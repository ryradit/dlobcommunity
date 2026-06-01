"""
Re-cluster the already-downloaded face crops at different eps values
to find the sweet spot, without re-downloading images.
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
print(f"Embedding {len(files)} crops...")

embeddings = []
names = []
for f in files:
    path = os.path.join(crop_dir, f)
    emb = embed(path)
    embeddings.append(emb)
    names.append(f)
    if len(embeddings) % 50 == 0:
        print(f"  {len(embeddings)}/{len(files)}", flush=True)

X = np.array(embeddings)
print(f"\nEmbedded {len(X)} faces. Testing different eps values...\n")

for eps in [0.15, 0.20, 0.25, 0.30, 0.35]:
    clustering = DBSCAN(eps=eps, min_samples=2, metric='cosine').fit(X)
    labels = clustering.labels_
    cnt = Counter(labels)
    n_clusters = sum(1 for k in cnt if k != -1)
    n_noise = cnt[-1] if -1 in cnt else 0
    biggest = max((v for k,v in cnt.items() if k != -1), default=0)
    print(f"eps={eps}: {n_clusters} clusters, biggest={biggest}, noise={n_noise}")
