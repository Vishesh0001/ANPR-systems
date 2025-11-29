from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import cv2
import numpy as np
import easyocr
from PIL import Image
import io

app = FastAPI()

# Load YOLO model (general model, can replace with custom plate model later)
model = YOLO("yolov8n.pt")

# Initialize OCR (optimized network for number plates)
reader = easyocr.Reader(['en'], gpu=False, recog_network='latin_g2')


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    # Read file
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    image_np = np.array(image)
    image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    # Detect license plate using YOLO
    results = model.predict(image_np)

    if len(results[0].boxes.xyxy) == 0:
        return {"message": "❌ No number plate detected"}

    # Take first detected plate (later we can loop if multiple)
    x1, y1, x2, y2 = results[0].boxes.xyxy[0].cpu().numpy().astype(int)
    plate = image_np[y1:y2, x1:x2]

    # ---- IMAGE PREPROCESSING FOR BETTER OCR ----
    gray = cv2.cvtColor(plate, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )

    # Upscale (OCR performs better on large text)
    thresh = cv2.resize(thresh, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    # ---- RUN OCR ----
    text = reader.readtext(thresh, detail=0)
    cleaned_text = "".join(text).replace(" ", "")

    return {
        "filename": file.filename,
        "detected_text_raw": text,
        "cleaned_text": cleaned_text,
        "bounding_box": [int(x1), int(y1), int(x2), int(y2)]
    }


@app.get("/")
def home():
    return {"message": "🚗 ANPR System is Running!"}
