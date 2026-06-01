import os
import requests
from io import BytesIO
from PIL import Image
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

supabase: Client = create_client(supabase_url, supabase_key)

response = supabase.table("latihan_faces").select("image_id, image_title, face_data").gt("face_count", 0).limit(5).execute()
rows = response.data

os.makedirs("test_crops", exist_ok=True)

for row in rows:
    img_id = row["image_id"]
    title = row["image_title"]
    face_data = row["face_data"]
    
    url = f"https://drive.google.com/thumbnail?id={img_id}&sz=w600"
    res = requests.get(url)
    img = Image.open(BytesIO(res.content))
    w, h = img.size
    
    print(f"\nImage: {title} | Size: {w}x{h}")
    for idx, face in enumerate(face_data):
        vertices = face.get("vertices", [])
        if not vertices:
            continue
        xs = [v.get("x", 0) for v in vertices]
        ys = [v.get("y", 0) for v in vertices]
        x_min, x_max = min(xs), max(xs)
        y_min, y_max = min(ys), max(ys)
        
        # Method 1: Multiplying by max_thumb
        max_thumb = max(w, h)
        l1, t1 = int(x_min * max_thumb), int(y_min * max_thumb)
        r1, b1 = int(x_max * max_thumb), int(y_max * max_thumb)
        
        # Method 2: Multiplying by w and h
        l2, t2 = int(x_min * w), int(y_min * h)
        r2, b2 = int(x_max * w), int(y_max * h)
        
        print(f"  Face {idx}:")
        print(f"    Norm Box: [{x_min:.4f}, {y_min:.4f}, {x_max:.4f}, {y_max:.4f}]")
        print(f"    Method 1 (max_thumb={max_thumb}): [{l1}, {t1}, {r1}, {b1}]")
        print(f"    Method 2 (w={w}, h={h}): [{l2}, {t2}, {r2}, {b2}]")
        
        # Save both crops
        try:
            crop1 = img.crop((l1, t1, r1, b1))
            crop1.save(f"test_crops/{title}_face_{idx}_method1.jpg")
            
            crop2 = img.crop((l2, t2, r2, b2))
            crop2.save(f"test_crops/{title}_face_{idx}_method2.jpg")
        except Exception as e:
            print(f"    Crop failed: {e}")
