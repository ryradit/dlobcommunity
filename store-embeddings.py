"""
Store face embeddings in the database (face_data[i].embedding).
At query time, the API will use cosine similarity to find near matches.
Only crops >= MIN_SIZE get embeddings; others use the landmark fallback.
"""
import os
import json
import requests
from io import BytesIO
from PIL import Image
import numpy as np
import torch
from facenet_pytorch import InceptionResnetV1
from supabase import create_client, Client

env_path = "/Users/ryanradityatama/Documents/dlobcommunity-deploy-optimizations/.env"
supabase_url = ""
supabase_key = ""
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if '=' in line:
                k, v = line.strip().split('=', 1)
                v = v.strip("'\"")
                if k == 'NEXT_PUBLIC_SUPABASE_URL': supabase_url = v
                if k == 'SUPABASE_SERVICE_ROLE_KEY': supabase_key = v

supabase: Client = create_client(supabase_url, supabase_key)

print("Loading Facenet model...")
device = torch.device('cpu')
resnet = InceptionResnetV1(pretrained='vggface2').eval()

MIN_CROP_PX = 60   # Skip faces smaller than 60×60 px (too blurry for neural net)
THUMB_SIZE  = "w2000"

def embed(crop_img):
    img = crop_img.convert('RGB').resize((160, 160))
    arr = np.array(img).astype(np.float32)
    arr = (arr - arr.mean()) / max(arr.std(), 1e-5)
    t = torch.tensor(arr).permute(2,0,1).unsqueeze(0)
    with torch.no_grad():
        e = resnet(t).numpy()[0]
    e = e / max(np.linalg.norm(e), 1e-5)
    return e.tolist()

print("Fetching face records...")
res = supabase.table("latihan_faces").select("id, image_id, image_title, face_data").gt("face_count", 0).execute()
rows = res.data
print(f"Loaded {len(rows)} rows.")

thumbnail_cache = {}
total = sum(len(r["face_data"] or []) for r in rows)
done = 0

for row in rows:
    image_id  = row["image_id"]
    title     = row["image_title"]
    face_data = row["face_data"] or []

    # Download thumbnail once per image
    if image_id not in thumbnail_cache:
        url = f"https://drive.google.com/thumbnail?id={image_id}&sz={THUMB_SIZE}"
        try:
            r2 = requests.get(url, timeout=20)
            thumbnail_cache[image_id] = Image.open(BytesIO(r2.content)).convert("RGB")
        except Exception as e:
            print(f"  Download failed for {title}: {e}", flush=True)
            thumbnail_cache[image_id] = None

    img = thumbnail_cache[image_id]
    modified = False

    for idx, face in enumerate(face_data):
        done += 1
        print(f"[{done}/{total}] {title} face {idx}", flush=True)

        # Clear any stale person_id from previous bad run
        if "person_id" in face:
            del face["person_id"]
            modified = True

        if img is None:
            continue

        w, h = img.size
        verts = face.get("vertices", [])
        if not verts:
            continue

        xs = [v["x"] for v in verts]; ys = [v["y"] for v in verts]
        left   = int(min(xs)*w); right  = int(max(xs)*w)
        top    = int(min(ys)*h); bottom = int(max(ys)*h)

        # 30% padding
        px = int((right-left)*0.3); py = int((bottom-top)*0.3)
        left   = max(0,   left  -px); right  = min(w-1, right +px)
        top    = max(0,   top   -py); bottom = min(h-1, bottom+py)

        cw, ch = right-left, bottom-top
        if cw < MIN_CROP_PX or ch < MIN_CROP_PX:
            # Face too small — clear any existing embedding
            if "embedding" in face:
                del face["embedding"]
                modified = True
            continue

        try:
            crop = img.crop((left, top, right, bottom))
            emb  = embed(crop)
            face["embedding"] = emb
            modified = True
        except Exception as e:
            print(f"  Embed error: {e}", flush=True)

    if modified:
        try:
            supabase.table("latihan_faces").update({"face_data": face_data}).eq("id", row["id"]).execute()
            print(f"  Saved {title}", flush=True)
        except Exception as e:
            print(f"  Save error: {e}", flush=True)

print("\nDone storing embeddings.")
