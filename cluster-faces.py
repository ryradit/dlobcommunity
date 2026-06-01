import os
import requests
from io import BytesIO
from PIL import Image
import numpy as np
import torch
from facenet_pytorch import InceptionResnetV1
from sklearn.cluster import DBSCAN
from supabase import create_client, Client

env_path = "/Users/ryanradityatama/Documents/dlobcommunity-deploy-optimizations/.env"
supabase_url = ""
supabase_key = ""

if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if '=' in line:
                key, val = line.strip().split('=', 1)
                val = val.strip("'\"")
                if key == 'NEXT_PUBLIC_SUPABASE_URL':
                    supabase_url = val
                elif key == 'SUPABASE_SERVICE_ROLE_KEY':
                    supabase_key = val

if not supabase_url or not supabase_key:
    print("Error: Supabase URL or Service Role Key not found in .env")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

print("Loading Facenet model...")
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

def get_embedding(img_crop):
    """Generate a 512-dim normalized face embedding from a PIL crop."""
    img_crop = img_crop.convert('RGB').resize((160, 160))
    arr = np.array(img_crop).astype(np.float32)
    mean, std = arr.mean(), arr.std()
    arr = (arr - mean) / max(std, 1e-5)
    tensor = torch.tensor(arr).permute(2, 0, 1).unsqueeze(0).to(device)
    with torch.no_grad():
        emb = resnet(tensor).cpu().numpy()[0]
    norm = np.linalg.norm(emb)
    return emb / max(norm, 1e-5)

print("Fetching faces from database...")
response = supabase.table("latihan_faces").select("id, image_id, image_title, face_data").gt("face_count", 0).execute()
rows = response.data
print(f"Loaded {len(rows)} image records.")

faces_to_process = []
for row in rows:
    face_data = row.get("face_data", [])
    if not isinstance(face_data, list):
        continue
    for idx, face in enumerate(face_data):
        faces_to_process.append({
            "row_id": row["id"],
            "image_id": row["image_id"],
            "image_title": row["image_title"],
            "face_index": idx,
            "vertices": face.get("vertices", []),
            "face_object": face
        })

print(f"Total faces to embed: {len(faces_to_process)}")

embeddings = []
valid_indices = []

os.makedirs("face_crops_v2", exist_ok=True)
thumbnail_cache = {}

# Use larger thumbnails for better face resolution
THUMB_SIZE = "w2000"

for idx, f in enumerate(faces_to_process):
    img_id = f["image_id"]
    title = f["image_title"]
    vertices = f["vertices"]
    face_idx = f["face_index"]

    print(f"[{idx+1}/{len(faces_to_process)}] {title} face {face_idx}...", flush=True)

    if img_id not in thumbnail_cache:
        url = f"https://drive.google.com/thumbnail?id={img_id}&sz={THUMB_SIZE}"
        try:
            res = requests.get(url, timeout=20)
            if res.status_code == 200:
                thumbnail_cache[img_id] = Image.open(BytesIO(res.content)).convert('RGB')
            else:
                print(f"  HTTP {res.status_code}")
                continue
        except Exception as e:
            print(f"  Download error: {e}")
            continue

    img = thumbnail_cache[img_id]
    w, h = img.size

    if not vertices:
        print("  No vertices")
        continue

    xs = [v.get("x", 0) for v in vertices]
    ys = [v.get("y", 0) for v in vertices]
    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys), max(ys)

    # FIXED: vertices are stored as x/width and y/height (separately)
    # so multiply x by w and y by h
    left   = int(x_min * w)
    top    = int(y_min * h)
    right  = int(x_max * w)
    bottom = int(y_max * h)

    # Add 30% padding around the face
    pad_x = int((right - left) * 0.3)
    pad_y = int((bottom - top) * 0.3)
    left   = max(0,   left   - pad_x)
    top    = max(0,   top    - pad_y)
    right  = min(w-1, right  + pad_x)
    bottom = min(h-1, bottom + pad_y)

    face_w = right - left
    face_h = bottom - top
    if face_w < 20 or face_h < 20:
        print(f"  Crop too small: {face_w}x{face_h}")
        continue

    try:
        crop = img.crop((left, top, right, bottom))
        crop.save(f"face_crops_v2/{img_id}_face_{face_idx}.jpg")
        emb = get_embedding(crop)
        embeddings.append(emb)
        valid_indices.append(idx)
    except Exception as e:
        print(f"  Crop/embed error: {e}")

print(f"\nEmbedded {len(embeddings)}/{len(faces_to_process)} faces.")

if not embeddings:
    print("No embeddings. Exiting.")
    exit(0)

X = np.array(embeddings)

# Cluster — tuned eps for VGGFace2 cosine space
# eps=0.25 means faces must be very similar (cosine dist < 0.25) to group together
# min_samples=3 requires at least 3 appearances to form a cluster
print("Clustering with DBSCAN (eps=0.25, min_samples=3)...")
clustering = DBSCAN(eps=0.25, min_samples=3, metric='cosine').fit(X)
labels = clustering.labels_

unique_labels = set(labels)
n_clusters = len(unique_labels) - (1 if -1 in unique_labels else 0)
n_noise     = list(labels).count(-1)
print(f"Found {n_clusters} clusters, {n_noise} noise points.")

# Assign person_id
noise_counter = 0
for i, label in zip(valid_indices, labels):
    if label == -1:
        person_id = f"unknown_{noise_counter}"
        noise_counter += 1
    else:
        person_id = f"person_{label}"
    faces_to_process[i]["face_object"]["person_id"] = person_id

# Clear person_id on faces that were not embedded (invalid crops)
embedded_set = set(valid_indices)
for i, f in enumerate(faces_to_process):
    if i not in embedded_set:
        f["face_object"]["person_id"] = None

# Group updates by row_id
row_updates = {}
for fi in faces_to_process:
    rid = fi["row_id"]
    row_updates.setdefault(rid, []).append(fi)

print(f"\nUpdating {len(row_updates)} rows in Supabase...")
ok = 0
for row_id, items in row_updates.items():
    res = supabase.table("latihan_faces").select("face_data").eq("id", row_id).execute()
    fd = res.data[0]["face_data"]
    for item in items:
        fi = item["face_index"]
        pid = item["face_object"].get("person_id")
        if pid is not None:
            fd[fi]["person_id"] = pid
        else:
            fd[fi].pop("person_id", None)   # remove stale label
    try:
        supabase.table("latihan_faces").update({"face_data": fd}).eq("id", row_id).execute()
        ok += 1
        print(f"  Updated {row_id}", flush=True)
    except Exception as e:
        print(f"  Failed {row_id}: {e}")

print(f"\nDone! Updated {ok}/{len(row_updates)} rows.")
