"""
Quick test: measure cosine distances between known same-person and different-person crops
to find the right DBSCAN eps threshold.
"""
import os
import numpy as np
import torch
from facenet_pytorch import InceptionResnetV1
from PIL import Image
from scipy.spatial.distance import cosine

device = torch.device('cpu')
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

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

# Print first 20 embeddings and measure their pairwise distances
samples = []
for f in files[:30]:
    path = os.path.join(crop_dir, f)
    emb = embed(path)
    samples.append((f, emb))
    print(f"Embedded: {f}")

print("\n--- Pairwise cosine distances for first 10 samples ---")
for i in range(min(10, len(samples))):
    for j in range(i+1, min(10, len(samples))):
        dist = cosine(samples[i][1], samples[j][1])
        print(f"  {samples[i][0][:30]} vs {samples[j][0][:30]}: {dist:.4f}")
