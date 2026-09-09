import os

new_code = """import cv2
import re
import easyocr

class HFInference:
    def __init__(self):
        # Using EasyOCR instead of TrOCR to completely eliminate receipt hallucinations (TAX, FAX, etc.)
        self.reader = easyocr.Reader(['en'], gpu=False)

    def predict(self, image_bgr):
        try:
            # Convert to RGB for EasyOCR
            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
            
            # Read text from the cropped plate image
            results = self.reader.readtext(image_rgb)
            
            if not results:
                return ""
                
            # Extract the text from the results (results is a list of (bbox, text, prob))
            texts = [res[1] for res in results]
            
            # Combine multiple lines if present
            combined_text = "".join(texts)
            
            # Clean the text: keep only alphanumeric characters and dashes
            clean_text = re.sub(r'[^A-Z0-9-]', '', combined_text.upper())
            
            # Ensure there's at least one number in it to be considered a valid plate
            if not any(char.isdigit() for char in clean_text):
                return ""
                
            return clean_text
            
        except Exception as e:
            print(f"OCR Inference Error: {e}")
            return ""

if __name__ == '__main__':
    hf_model = HFInference()
    print("OCR Model initialized successfully.")
"""

with open(r'..\..\hf_inference.py', 'w', encoding='utf-8') as f:
    f.write(new_code)

print("Swapped TrOCR with EasyOCR to fix hallucinations.")
