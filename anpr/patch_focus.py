import re

with open(r'..\..\app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add padding to the plate crop to give the OCR model better focus context
old_crop_logic = """        px1 = max(0, px1)
        px2 = min(w, px2)
        py1 = max(0, py1)
        py2 = min(h, py2)"""

new_crop_logic = """        padding = 10
        px1 = max(0, px1 - padding)
        px2 = min(w, px2 + padding)
        py1 = max(0, py1 - padding)
        py2 = min(h, py2 + padding)"""

content = content.replace(old_crop_logic, new_crop_logic)

with open(r'..\..\app.py', 'w', encoding='utf-8') as f:
    f.write(content)

# Also patch hf_inference.py to prefer the full uncropped image as fallback
with open(r'..\..\hf_inference.py', 'r', encoding='utf-8') as f:
    hf_content = f.read()

hf_content = hf_content.replace(
    "return re.sub(r'[^A-Z0-9-]', '', texts[4].upper())",
    "return re.sub(r'[^A-Z0-9-]', '', texts[0].upper())"
)
hf_content = hf_content.replace(
    "return re.sub(r'[^A-Z0-9-]', '', texts[1].upper())",
    "return re.sub(r'[^A-Z0-9-]', '', texts[0].upper())"
)
hf_content = hf_content.replace(
    "texts[4].upper()", "texts[0].upper()"
).replace(
    "texts[1].upper()", "texts[0].upper()"
)

with open(r'..\..\hf_inference.py', 'w', encoding='utf-8') as f:
    f.write(hf_content)

print("Patch applied successfully.")
