with open(r'..\..\app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines 81-92 (1-indexed) contain the snap logic we need to replace
# We'll replace from "        if text_clean:" through the snaps.append line

# Find the exact start and end lines
start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if line.strip() == 'if text_clean:' and start_idx is None:
        start_idx = i
    if start_idx is not None and 'snaps.append' in line:
        end_idx = i
        break

if start_idx is None or end_idx is None:
    print(f"ERROR: Could not find block. start={start_idx}, end={end_idx}")
else:
    print(f"Found block at lines {start_idx+1} to {end_idx+1}")
    
    # Detect the indentation level from the 'if text_clean:' line
    indent = len(lines[start_idx]) - len(lines[start_idx].lstrip())
    ind = ' ' * indent
    ind2 = ' ' * (indent + 4)
    ind3 = ' ' * (indent + 8)
    
    new_block = [
        f"{ind}# Always save plate crop — even if OCR text is short/empty\n",
        f"{ind}text = text_clean if text_clean else ''\n",
        f"{ind}if return_snaps:\n",
        f"{ind2}if text and seen_plates is not None and text in seen_plates:\n",
        f"{ind3}pass  # skip duplicate\n",
        f"{ind2}else:\n",
        f"{ind3}if text and seen_plates is not None:\n",
        f"{ind3}    seen_plates.add(text)\n",
        f"{ind3}import time as _t\n",
        f"{ind3}label = text if text else 'plate'\n",
        f"{ind3}snap_path = os.path.join('detected_plates', f'plate_{{label}}_{{int(_t.time()*1000)}}.jpg')\n",
        f"{ind3}cv2.imwrite(snap_path, plate_crop)\n",
        f"{ind3}snaps.append((snap_path, f'{{vehicle_type.upper()}} - {{text}}'))\n",
        f"{ind}if text and len(text) >= 4:\n",
    ]
    
    lines[start_idx:end_idx+1] = new_block
    
    with open(r'..\..\app.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Patch applied successfully.")
