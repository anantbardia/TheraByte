"""Remove white background from logo and do branding rename in one script."""
import os, re
from PIL import Image
import numpy as np

# === 1. Remove white background ===
img_path = r"c:\Users\Anant\Desktop\AIpsycho\frontend\public\Gemini_Generated_Image_bux0pobux0pobux0.png"
out_path = r"c:\Users\Anant\Desktop\AIpsycho\frontend\public\logo.png"

img = Image.open(img_path).convert("RGBA")
data = np.array(img)
# White/near-white pixels → transparent
r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
white_mask = (r > 230) & (g > 230) & (b > 230)
data[white_mask] = [0, 0, 0, 0]
# Semi-white edge pixels → semi-transparent for smooth edges
light_mask = (r > 200) & (g > 200) & (b > 200) & ~white_mask
data[light_mask, 3] = ((255 - ((r[light_mask].astype(int) + g[light_mask].astype(int) + b[light_mask].astype(int)) // 3 - 200) * 255 // 55)).clip(0, 255).astype(np.uint8)

result = Image.fromarray(data)
# Resize to reasonable logo size
result.thumbnail((512, 512), Image.LANCZOS)
result.save(out_path)
print(f"Logo saved: {out_path}")

# === 2. Replace MindBridge → TheraByte across codebase ===
base_dir = r"c:\Users\Anant\Desktop\AIpsycho"
exclude = {".git", "node_modules", "dist", "__pycache__", ".venv", ".gemini"}
exts = {'.py', '.js', '.jsx', '.html', '.css', '.md', '.txt'}
skip_files = {'package-lock.json', 'replace_brand.py', 'remove_bg.py', 'rebrand.py'}

count = 0
for root, dirs, files in os.walk(base_dir):
    dirs[:] = [d for d in dirs if d not in exclude]
    for f in files:
        if f in skip_files or os.path.splitext(f)[1] not in exts:
            continue
        fp = os.path.join(root, f)
        try:
            with open(fp, 'r', encoding='utf-8') as fh:
                content = fh.read()
            new = content.replace('MindBridge', 'TheraByte').replace('mindbridge', 'therabyte').replace('MINDBRIDGE', 'THERABYTE')
            if new != content:
                with open(fp, 'w', encoding='utf-8') as fh:
                    fh.write(new)
                count += 1
                print(f"  Rebranded: {fp}")
        except:
            pass
print(f"\nDone! Rebranded {count} files.")
