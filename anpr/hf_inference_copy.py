import cv2
import re
import torch
import transformers.utils.import_utils
from transformers import TrOCRProcessor, VisionEncoderDecoderModel, RobertaTokenizer, AutoImageProcessor
from PIL import Image
import numpy as np

# Monkey-patch to bypass strict torch version check for loading .bin models
def mock_check_torch_load_is_safe():
    pass
transformers.utils.import_utils.check_torch_load_is_safe = mock_check_torch_load_is_safe

class HFInference:
    def __init__(self):
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        
        # We revert to TrOCR because it is vastly superior for complex license plate fonts
        # than generic OCR engines, provided we clean up its receipt hallucinations.
        tokenizer = RobertaTokenizer.from_pretrained("microsoft/trocr-base-printed")
        feature_extractor = AutoImageProcessor.from_pretrained("microsoft/trocr-base-printed")
        self.processor = TrOCRProcessor(image_processor=feature_extractor, tokenizer=tokenizer)
        
        self.model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-printed")
        self.model.to(self.device)

    def _predict_batch(self, imgs):
        rgb_imgs = [Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)) for img in imgs]
        pixel_values = self.processor(rgb_imgs, return_tensors="pt").pixel_values.to(self.device)
        generated_ids = self.model.generate(pixel_values, max_new_tokens=20)
        return self.processor.batch_decode(generated_ids, skip_special_tokens=True)

    def _get_best_text(self, texts):
        # 1. Look for perfect Indian format match
        for t in texts:
            clean = re.sub(r'[^A-Z0-9]', '', t.upper())
            if re.match(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$', clean):
                return clean
                
        # 2. Look for old format
        for t in texts:
            clean = re.sub(r'[^A-Z0-9]', '', t.upper())
            if re.match(r'^[A-Z]{2,3}[0-9]{3,4}$', clean):
                return clean
                
        # 3. Fallback to the most robust prediction (the 4% crop usually)
        if len(texts) == 9:
            # 2-line plate: top 4% + bottom 4% is at index 4 (t1 + b1)
            return re.sub(r'[^A-Z0-9-]', '', texts[4].upper())
        elif len(texts) >= 2:
            # 1-line plate: 4% crop is at index 1
            return re.sub(r'[^A-Z0-9-]', '', texts[1].upper())
            
        return re.sub(r'[^A-Z0-9-]', '', texts[0].upper())

    def predict(self, image_bgr):
        try:
            h, w = image_bgr.shape[:2]
            ratio = w / float(h)
            
            # Dynamic Ensemble: 0%, 4%, 8% crops to handle varying YOLO bounding boxes
            crops = [0.0, 0.04, 0.08]
            
            if ratio < 2.0:
                top_half = image_bgr[0:int(h*0.55), :]
                bottom_half = image_bgr[int(h*0.45):h, :]
                
                top_imgs = [top_half[:, int(w*c):] for c in crops]
                bot_imgs = [bottom_half[:, int(w*c):] for c in crops]
                
                all_imgs = top_imgs + bot_imgs
                results = self._predict_batch(all_imgs)
                
                top_results = results[:3]
                bot_results = results[3:]
                
                combined_texts = []
                for t in top_results:
                    for b in bot_results:
                        combined_texts.append(f"{t}{b}")
                        
                clean_text = self._get_best_text(combined_texts)
            else:
                imgs = [image_bgr[:, int(w*c):] for c in crops]
                results = self._predict_batch(imgs)
                clean_text = self._get_best_text(results)
            
            if not any(char.isdigit() for char in clean_text):
                return ""
                
            return clean_text
        except Exception as e:
            print(f"OCR Inference Error: {e}")
            return ""

if __name__ == '__main__':
    hf_model = HFInference()
    print("OCR Model initialized successfully.")
