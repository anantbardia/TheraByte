from PIL import Image
import numpy as np

img = Image.open(r"c:\Users\Anant\Desktop\AIpsycho\frontend\public\Gemini_Generated_Image_bux0pobux0pobux0.png").convert("RGBA")
data = np.array(img, dtype=np.float32)

r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

# Compute "whiteness" — distance from (255,255,255)
whiteness = 1 - (((255-r)**2 + (255-g)**2 + (255-b)**2) ** 0.5) / (255*3**0.5)

# The background is very white (whiteness > 0.92)
# Body of the image has color so whiteness drops.
# We convert whiteness to an alpha mask:
# whiteness 1.0 → alpha 0 (fully transparent)
# whiteness < 0.85 → alpha 255 (fully opaque)
threshold_high = 0.97
threshold_low = 0.82

alpha_mask = np.clip((threshold_high - whiteness) / (threshold_high - threshold_low), 0, 1) * 255
alpha_mask = alpha_mask.astype(np.uint8)

data[:,:,3] = alpha_mask

result = Image.fromarray(data.astype(np.uint8))
result.thumbnail((512, 512), Image.LANCZOS)
result.save(r"c:\Users\Anant\Desktop\AIpsycho\frontend\public\logo.png")
print("Done")
