import os, requests
from io import BytesIO
from PIL import Image
from supabase import create_client

env_path = "/Users/ryanradityatama/Documents/dlobcommunity-deploy-optimizations/.env"
su, sk = "", ""
with open(env_path) as f:
    for line in f:
        if '=' in line:
            k, v = line.strip().split('=', 1); v = v.strip("'\"")
            if k == 'NEXT_PUBLIC_SUPABASE_URL': su = v
            if k == 'SUPABASE_SERVICE_ROLE_KEY': sk = v

sb = create_client(su, sk)

# Check multiple images to find good same-person pairs with large crops
titles_to_check = ['DSC00170.JPG', 'DSC00171.JPG', 'DSC00172.JPG', 'DSC00173.JPG',
                   'DSC00185.JPG', 'DSC00186.JPG', 'IMG_8871.JPG', 'IMG_8008.JPG']

res = sb.table("latihan_faces").select("image_id, image_title, face_data").in_(
    "image_title", titles_to_check
).execute()

os.makedirs("inspect_all", exist_ok=True)

for row in res.data:
    img_id = row["image_id"]
    title  = row["image_title"]
    img    = Image.open(BytesIO(requests.get(
        f"https://drive.google.com/thumbnail?id={img_id}&sz=w2000"
    ).content)).convert("RGB")
    w, h = img.size
    print(f"\n{title}: {w}x{h}")
    for i, face in enumerate(row["face_data"]):
        verts = face.get("vertices", [])
        if not verts: continue
        xs = [v["x"] for v in verts]; ys = [v["y"] for v in verts]
        l, r = int(min(xs)*w), int(max(xs)*w)
        t, b = int(min(ys)*h), int(max(ys)*h)
        px = int((r-l)*0.3); py = int((b-t)*0.3)
        l=max(0,l-px); r=min(w-1,r+px); t=max(0,t-py); b=min(h-1,b+py)
        crop = img.crop((l, t, r, b))
        has_emb = bool(face.get('embedding'))
        print(f"  face {i}: {crop.size[0]}x{crop.size[1]} has_emb={has_emb}")
        crop.save(f"inspect_all/{title}_f{i}.jpg")

print("\nAll crops saved to inspect_all/")
