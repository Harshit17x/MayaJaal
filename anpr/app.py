import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import uvicorn
from ultralytics import YOLO

app = FastAPI()

# Load your trained YOLOv8 model weights
model = YOLO('train-4/weights/best.pt')

HTML_PAGE = """
<!DOCTYPE html>
<html>
<head>
    <title>Mobile ANPR Live Test</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #0f172a; color: white; font-family: sans-serif; text-align: center; margin: 0; padding: 15px; }
        h2 { margin-bottom: 10px; font-size: 1.5rem; }
        #stream { width: 100%; max-width: 640px; border-radius: 12px; border: 2px solid #38bdf8; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    </style>
</head>
<body>
    <h2>Live ANPR Camera Node</h2>
    <img id="stream" alt="Connecting to PC Stream..." />
    
    <video id="video" autoplay playsinline style="display:none;"></video>
    <canvas id="canvas" style="display:none;"></canvas>

    <script>
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        const streamImage = document.getElementById('stream');
        
        const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const ws = new WebSocket(wsProtocol + window.location.host + '/ws');

        ws.onmessage = function(event) {
            streamImage.src = URL.createObjectURL(event.data);
        };

        navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment', 
                width: { ideal: 1280 }, 
                height: { ideal: 720 } 
            },
            audio: false
        }).then(stream => {
            video.srcObject = stream;
            
            setInterval(() => {
                canvas.width = 640;
                canvas.height = 360;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(blob => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(blob);
                    }
                }, 'image/jpeg', 0.65);
            }, 40);
        }).catch(err => {
            alert("Camera access error: " + err);
        });
    </script>
</body>
</html>
"""

@app.get("/")
def get():
    return HTMLResponse(HTML_PAGE)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            np_arr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
            if frame is not None:
                results = model(frame, imgsz=640, conf=0.35, verbose=False)
                annotated_frame = results[0].plot()
                
                success, encoded_image = cv2.imencode('.jpeg', annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                if success:
                    await websocket.send_bytes(encoded_image.tobytes())
                    
    except WebSocketDisconnect:
        print("Mobile testing client disconnected.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)