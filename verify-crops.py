import requests
from io import BytesIO
from PIL import Image, ImageDraw
from supabase import create_client
import os

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

sb = create_client(supabase_url, supabase_key)

# Check DSC (landscape DSLR) and IMG (portrait iPhone)
titles = ['DSC00241.JPG', 'IMG_8871.JPG']
res = sb.table("latihan_faces").select("image_id, image_title, face_data").in_("image_title", titles).execute()

os.makedirs("verify_crops", exist_ok=True)
for row in res.data:
    img_id = row["image_id"]
    title  = row["image_title"]
    url = f"https://drive.google.com/thumbnail?id={img_id}&sz=w2000"
    img = Image.open(BytesIO(requests.get(url).content)).convert("RGB")
    w, h = img.size
    print(f"{title}: {w}x{h}")

    draw = ImageDraw.Draw(img)
    for i, face in enumerate(row["face_data"]):
        verts = face.get("vertices", [])
        if not verts: continue
        xs = [v["x"] for v in verts]
        ys = [v["y"] for v in verts]
        # FIXED formula
        left   = int(min(xs)*w); right  = int(max(xs)*w)
        top    = int(min(ys)*h); bottom = int(max(ys)*h)
        draw.rectangle([left, top, right, bottom], outline="red", width=3)
        print(f"  face {i}: pixel box [{left},{top},{right},{bottom}], size {right-left}x{bottom-top}")

    img.save(f"verify_crops/{title}_annotated.jpg")
    print(f"  Saved verify_crops/{title}_annotated.jpg")
