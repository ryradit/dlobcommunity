"""
Re-cluster only LARGE face crops (>= 80px wide), skip tiny background faces.
Test eps=0.15 only on quality crops.
"""
import os
import numpy as np
import torch
from facenet_pytorch import InceptionResnetV1
from sklearn.cluster import DBSCAN
from PIL import Image
from collections import Counter

device = torch.device('cpu')
print("Loading model...")
resnet = InceptionResnetV1(pretrained='vggface2').eval()

def embed(path):
    img = Image.open(path).convert('RGB').resize((160, 160))
    arr = np.array(img).astype(np.float32)
    arr = (arr - arr.mean()) / max(arr.std(), 1e-5)
    t = torch.tensor(arr).permute(2,0,1).unsqueeze(0)
    with torch.no_grad():
        e = resnet(t).numpy()[0]
    return e / max(np.linalg.norm(e), 1e-5)

crop_dir = "face_crops_v2"
files = sorted(os.listdir(crop_dir))

# Only embed faces that are large enough
MIN_SIZE = 80  # px (width or height must be >= 80px)
embeddings = []
names = []
skipped = 0
for f in files:
    path = os.path.join(crop_dir, f)
    img = Image.open(path)
    w, h = img.size
    if w < MIN_SIZE and h < MIN_SIZE:
        skipped += 1
        continue
    emb = embed(path)
    embeddings.append(emb)
    names.append(f)

print(f"Embedded {len(embeddings)} large crops (skipped {skipped} tiny ones).\n")

X = np.array(embeddings)
for eps in [0.10, 0.15, 0.20, 0.25]:
    for min_s in [2, 3]:
        clustering = DBSCAN(eps=eps, min_samples=min_s, metric='cosine').fit(X)
        labels = clustering.labels_
        cnt = Counter(labels)
        n_clusters = sum(1 for k in cnt if k != -1)
        n_noise = cnt[-1] if -1 in cnt else 0
        biggest = max((v for k,v in cnt.items() if k != -1), default=0)
        print(f"eps={eps}, min_s={min_s}: {n_clusters} clusters, biggest={biggest}, noise={n_noise}/{len(X)}")
