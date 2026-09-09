# SIH26187 – AI-Based Intelligent Video Analytics Inference Engine

## 1. Project Overview

This repository contains the **backend inference engine** for SIH 2026 Problem Statement **SIH26187**:

> AI-Based Intelligent Video Analytics Platform for Border Surveillance using existing CCTV Infrastructure

The backend is designed to receive image, video, and RTSP CCTV inputs, preprocess the input, execute selected ONNX AI models, manage model resources efficiently, and return structured inference results to the frontend.

The system is designed for deployment on CPU-based systems and supports multiple ONNX models being loaded and cached simultaneously.

---

## 2. Current Project Status

### Completed

* FastAPI backend
* ONNX Runtime inference engine
* ONNX model loading and caching
* Multiple-model support
* CPU execution
* Configurable ONNX Runtime threading
* Bounded inference concurrency
* Image input processing
* Video input processing
* RTSP input handling
* RTSP connection timeout
* RTSP read timeout
* RTSP reconnect handling
* Input validation
* Error handling
* Centralized API exception handling
* Rotating application logs
* Temporary upload handling
* Image preprocessing pipeline
* Unit/integration-style tests
* API endpoint testing
* Multi-model loading test
* Concurrency test
* Performance baseline test

### Pending

The final SIH-trained ONNX models are not yet integrated.

When the AI team provides the final models, their:

* input shape
* input data type
* channel ordering
* normalization requirements
* output structure
* class labels
* confidence interpretation
* post-processing requirements

must be inspected and integrated before final deployment.

---

# 3. Architecture

```text
                    ┌──────────────────────┐
                    │      Frontend        │
                    │   Dashboard / UI     │
                    └──────────┬───────────┘
                               │
                               │ HTTP / JSON
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI         │
                    │      REST API        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Image Input      Video Input       RTSP Input
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │   Input Validation   │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │    Preprocessing     │
                    │ Resize / RGB / Scale │
                    │       / CHW / Batch  │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │  Inference Service   │
                    └──────────┬───────────┘
                               │
                  ┌────────────┴────────────┐
                  ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  Model Manager   │      │ Resource Manager │
        │ Model Cache      │      │ Concurrency      │
        └────────┬─────────┘      └────────┬─────────┘
                 │                         │
                 └────────────┬────────────┘
                              ▼
                    ┌──────────────────────┐
                    │    ONNX Runtime     │
                    │    CPUExecution     │
                    │      Provider       │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │   Model Prediction   │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Structured JSON      │
                    │ Inference Response   │
                    └──────────────────────┘
```

---

# 4. Technology Stack

| Component               | Technology          |
| ----------------------- | ------------------- |
| Language                | Python              |
| API Framework           | FastAPI             |
| ASGI Server             | Uvicorn             |
| AI Runtime              | ONNX Runtime        |
| Model Format            | ONNX                |
| Computer Vision         | OpenCV              |
| Numerical Processing    | NumPy               |
| Validation              | Pydantic            |
| Configuration           | Pydantic Settings   |
| Video/RTSP              | OpenCV + FFmpeg     |
| Testing                 | Python test scripts |
| Version Control         | Git                 |
| Development Environment | VS Code             |
| Operating System        | Windows 11          |
| Execution               | CPU                 |

---

# 5. System Requirements

Recommended development environment:

* Windows 10/11 or Linux
* Python 3.13+
* 8 GB RAM minimum
* 16 GB RAM recommended
* CPU with multiple cores
* Git
* VS Code
* FFmpeg support through OpenCV

A dedicated NVIDIA GPU is not required for the current CPU inference implementation.

---

# 6. Project Structure

```text
SIH26187_Inference_Engine/
│
├── app/
│   ├── api/
│   │   ├── health.py
│   │   ├── inference.py
│   │   └── models.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── resource_manager.py
│   │   └── runtime.py
│   │
│   ├── inference/
│   │   ├── inference_service.py
│   │   ├── model_manager.py
│   │   └── onnx_engine.py
│   │
│   ├── pipeline/
│   │   ├── image_loader.py
│   │   ├── preprocessor.py
│   │   ├── rtsp_loader.py
│   │   └── video_loader.py
│   │
│   ├── utils/
│   │   └── logging.py
│   │
│   └── main.py
│
├── config/
│
├── logs/
│
├── models/
│   ├── test_model.onnx
│   └── image_test_model.onnx
│
├── temp/
│
├── tests/
│
├── requirements.txt
├── test_video_input.mp4
└── README.md
```

---

# 7. Environment Setup

Clone the repository:

```powershell
git clone https://github.com/aditikp0907/SIH26187-Inference-Engine.git
cd SIH26187-Inference-Engine
```

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install -r requirements.txt
```

If Windows blocks the `pip.exe` executable directly, use:

```powershell
& ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt
```

---

# 8. Running the Backend

Activate the virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

Start the FastAPI server:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

For development with automatic reload:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

---

# 9. API Documentation

FastAPI automatically provides Swagger documentation.

Open:

```text
http://127.0.0.1:8000/docs
```

Alternative OpenAPI documentation:

```text
http://127.0.0.1:8000/redoc
```

---

# 10. Health Check

Endpoint:

```text
GET /api/health
```

PowerShell:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health"
```

Expected response:

```json
{
  "status": "healthy",
  "service": "SIH26187 Intelligent Video Analytics Backend",
  "version": "1.0.0"
}
```

---

# 11. Runtime Status

Endpoint:

```text
GET /api/inference/status
```

Example:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/inference/status"
```

The response contains:

* backend status
* maximum concurrent inference
* active inference count
* available inference slots
* loaded model count
* maximum model capacity
* loaded model information

---

# 12. Model Management

The backend contains a `ModelManager` responsible for loading, caching, retrieving, and unloading ONNX models.

The model manager prevents the application from repeatedly loading the same model for every request.

Models are loaded once and kept in memory.

Current configured capacity:

```text
Maximum models: 4
```

Current inference concurrency:

```text
Maximum simultaneous inference operations: 2
```

These values are configurable.

---

# 13. Adding an ONNX Model

Place the model inside:

```text
models/
```

For example:

```text
models/
└── border_person_detector.onnx
```

The model must:

* exist
* be a file
* use `.onnx`
* contain a valid ONNX graph
* be compatible with ONNX Runtime

---

# 14. Loading an ONNX Model

Endpoint:

```text
POST /api/models/load
```

PowerShell:

```powershell
Invoke-RestMethod `
    -Uri "http://127.0.0.1:8000/api/models/load" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"model_name":"border_person_detector","model_file":"border_person_detector.onnx"}'
```

The backend validates the model file before loading it.

---

# 15. Checking Loaded Models

Endpoint:

```text
GET /api/models
```

Command:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/models"
```

Example:

```text
loaded_count : 2
max_models   : 4
```

---

# 16. Unloading a Model

Endpoint:

```text
DELETE /api/models/{model_name}
```

Example:

```powershell
Invoke-RestMethod `
    -Uri "http://127.0.0.1:8000/api/models/border_person_detector" `
    -Method Delete
```

---

# 17. ONNX Model Inspection

Before integrating a final AI model, inspect its input and output requirements.

The backend's ONNX engine provides model information including:

* model name
* input names
* input shapes
* input data types
* output names
* output shapes
* output data types
* execution provider

A model should never be assumed to use the current test preprocessing configuration.

---

# 18. Important: Final Model Integration

The current test model uses:

```text
Input size: 224 × 224
Channels: 3
Data type: float32
Layout: NCHW
Batch: 1
```

The current test preprocessing is therefore configured around that shape.

The **real SIH models may use a different configuration**.

For each final model, verify:

```text
Input width
Input height
Number of channels
RGB or BGR
NCHW or NHWC
float32 / float16 / other
Normalization
Mean
Standard deviation
Scale
Batch size
```

The preprocessing pipeline must then be configured accordingly.

---

# 19. Image Inference

Endpoint:

```text
POST /api/inference/image
```

Required fields:

```text
model_name
file
```

Example:

```powershell
curl.exe `
    -X POST "http://127.0.0.1:8000/api/inference/image" `
    -F "model_name=image_test_model" `
    -F "file=@.\temp\test_image.jpg"
```

The endpoint:

1. validates the model
2. validates the uploaded file
3. loads the image
4. preprocesses the image
5. executes inference
6. returns structured results

---

# 20. Video Inference

Endpoint:

```text
POST /api/inference/video
```

Example:

```powershell
curl.exe `
    -X POST "http://127.0.0.1:8000/api/inference/video" `
    -F "model_name=image_test_model" `
    -F "file=@.\test_video_input.mp4" `
    -F "max_frames=5"
```

The endpoint processes video frames sequentially.

`max_frames` is bounded to prevent accidental unlimited processing.

Current allowed range:

```text
1–300 frames
```

Temporary uploaded files use unique temporary paths to avoid filename collisions.

---

# 21. RTSP CCTV Inference

Endpoint:

```text
POST /api/inference/rtsp
```

Example:

```powershell
curl.exe `
    -X POST "http://127.0.0.1:8000/api/inference/rtsp" `
    -F "model_name=image_test_model" `
    -F "rtsp_url=rtsp://camera-address:554/stream" `
    -F "max_frames=10"
```

The RTSP pipeline provides:

* RTSP URL validation
* connection timeout
* frame-read timeout
* connection failure handling
* frame-read failure handling
* bounded reconnect attempts
* resource cleanup

Current test configuration:

```text
Connection timeout: 5000 ms
Read timeout: 5000 ms
Reconnect attempts: 3
Reconnect delay: 1 second
```

---

# 22. RTSP Security

RTSP URLs may contain camera credentials.

Example:

```text
rtsp://username:password@camera-address:554/stream
```

Do not commit real:

* usernames
* passwords
* private camera addresses
* API keys
* secrets

to a public GitHub repository.

Use environment variables or secure deployment configuration for production credentials.

---

# 23. Preprocessing Pipeline

The preprocessing pipeline currently performs the following operations where configured:

```text
Input Frame
    ↓
Validation
    ↓
Resize
    ↓
BGR → RGB
    ↓
Convert to float32
    ↓
Scale / Normalize
    ↓
HWC → CHW
    ↓
Add Batch Dimension
    ↓
ONNX Tensor
```

Example final test tensor:

```text
Shape: (1, 3, 224, 224)
Type: float32
```

This must be changed if the final SIH models require different input specifications.

---

# 24. CPU Optimization

The backend is designed for CPU inference.

ONNX Runtime uses:

```text
CPUExecutionProvider
```

The current runtime configuration uses:

```text
Intra-op threads: 2
Inter-op threads: 1
```

These values are configurable.

The purpose is to avoid uncontrolled CPU thread creation when multiple inference requests arrive.

---

# 25. Model Caching

Loading an ONNX model is more expensive than executing an already-loaded model.

Therefore:

```text
Application Startup
       ↓
Model Load Request
       ↓
ONNX Runtime Session
       ↓
Model Stored in Memory
       ↓
Repeated Inference Requests
       ↓
Reuse Existing Session
```

The backend does not intentionally recreate the ONNX Runtime session for every inference request.

---

# 26. Concurrency Control

The backend uses a bounded resource manager.

Current configuration:

```text
Maximum concurrent inference: 2
```

Example:

```text
Request 1 → Inference Slot 1
Request 2 → Inference Slot 2
Request 3 → Wait / Timeout
```

This protects CPU and RAM resources from uncontrolled concurrent inference.

A direct resource-manager test confirmed:

```text
Initial slots: 2
After two acquisitions: 0
Third acquisition with 0.5 second timeout: False
After release: 2
```

---

# 27. Validation and Error Handling

The backend validates:

* missing model names
* empty model names
* unsupported model extensions
* missing model files
* invalid image files
* invalid video files
* unsupported image extensions
* unsupported video extensions
* invalid RTSP URLs
* RTSP connection failures
* RTSP frame failures
* invalid frame data
* invalid preprocessing configuration
* inference resource exhaustion
* invalid request fields

FastAPI also has centralized handlers for:

```text
422 Validation Errors
500 Unexpected Server Errors
```

Internal errors are logged while generic internal error responses are returned to clients.

---

# 28. Logging

Application logs are written to:

```text
logs/backend.log
```

The logging system supports:

* console logging
* file logging
* rotating log files
* configurable log level
* backend lifecycle logging
* model loading logging
* inference-related error logging
* RTSP connection logging

---

# 29. Testing

The repository contains tests for:

* image loading
* corrupt images
* missing images
* unsupported images
* preprocessing
* video loading
* video errors
* RTSP validation
* RTSP connection errors
* RTSP timeout
* RTSP reconnection
* inference service
* model handling

Test asset generation scripts are also included.

---

# 30. Test Video

A test video is included:

```text
test_video_input.mp4
```

Properties:

```text
Resolution: 640 × 480
Frame rate: 20 FPS
Frames: 100
Duration: approximately 5 seconds
```

It can be used for API testing without requiring a real CCTV camera.

---

# 31. Test ONNX Models

The repository currently contains temporary models:

```text
models/test_model.onnx
models/image_test_model.onnx
```

These models are only for validating the backend infrastructure.

They are **not the final SIH AI models**.

They should not be used to claim final AI detection accuracy.

---

# 32. Performance Baseline

A 20-request image API benchmark was performed using:

```text
Model: image_test_model
Input: test_image.jpg
Execution: CPU
```

Observed results:

| Metric              |    Result |
| ------------------- | --------: |
| Requests            |        20 |
| Average API latency |  8.175 ms |
| Minimum             |  5.093 ms |
| Maximum             | 23.614 ms |
| P95                 | 13.936 ms |

Important:

This is only a **backend infrastructure baseline using a tiny test model**.

It is not the expected performance of the final SIH-trained models.

Final benchmarking must be repeated after integrating the actual ONNX models.

---

# 33. Concurrency Benchmark

The resource manager was tested with a capacity of two.

Observed behavior:

```text
Maximum slots = 2

Request 1 → accepted
Request 2 → accepted
Request 3 → blocked/timeout
```

After releasing both resources:

```text
Available slots = 2
```

This confirms bounded inference concurrency.

---

# 34. Recommended Final Model Integration Process

When the AI team provides the models:

### Step 1

Copy the `.onnx` files into:

```text
models/
```

### Step 2

Inspect each model.

Record:

```text
Model name
Input name
Input shape
Input type
Output name
Output shape
Output type
```

### Step 3

Determine preprocessing.

Record:

```text
Image size
RGB/BGR
Normalization
Mean
Std
Scale
Tensor layout
Batch size
```

### Step 4

Update the preprocessing configuration.

### Step 5

Load all required models.

### Step 6

Verify model cache.

### Step 7

Run image inference.

### Step 8

Run video inference.

### Step 9

Run RTSP inference with a real authorized CCTV stream.

### Step 10

Verify output parsing.

### Step 11

Add model-specific post-processing.

### Step 12

Benchmark CPU and RAM usage.

---

# 35. Expected Future AI Pipeline

The current backend provides the infrastructure required for model execution.

The eventual complete analytics pipeline can become:

```text
CCTV / Video
      ↓
Frame Acquisition
      ↓
Preprocessing
      ↓
AI Model
      ↓
Post-processing
      ↓
Detection Results
      ↓
Tracking
      ↓
Counting
      ↓
Event / Alert Generation
      ↓
JSON
      ↓
Frontend Dashboard
```

Tracking, counting, alert generation, and model-specific post-processing are future integration stages and are not claimed as fully implemented by the current core backend.

---

# 36. Frontend Integration

The frontend can communicate with the FastAPI backend using HTTP requests.

Typical flow:

```text
Frontend
   ↓
POST /api/inference/image
POST /api/inference/video
POST /api/inference/rtsp
   ↓
Backend
   ↓
ONNX Model
   ↓
JSON Response
   ↓
Frontend Dashboard
```

For local development:

```text
Frontend → http://127.0.0.1:8000
```

For a remotely hosted frontend, the backend must eventually be exposed through a secure deployment, reverse proxy, VPN, or tunnel.

The backend should not be exposed directly to the public internet without appropriate security controls.

---

# 37. Troubleshooting

## `pip.exe` is blocked

Use:

```powershell
& ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt
```

instead of:

```powershell
pip install -r requirements.txt
```

---

## Server is not responding

Check that Uvicorn is running:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Then test:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health"
```

---

## Model not found

Check:

```text
models/
```

The requested filename must exist there.

---

## RTSP connection failure

A valid RTSP URL does not guarantee that a stream is available.

Verify:

* camera is online
* RTSP is enabled
* address is correct
* port is correct
* credentials are correct
* network access exists
* stream path is correct

---

## Image inference fails

Check:

```text
Model is loaded
Image exists
Image extension is supported
Image is not corrupt
Model input shape matches preprocessing
```

---

# 38. Useful Commands

Activate environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

Start server:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Check health:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health"
```

Check models:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/models"
```

Check inference status:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/inference/status"
```

Check installed packages:

```powershell
& ".\.venv\Scripts\python.exe" -m pip freeze
```

Check Python:

```powershell
& ".\.venv\Scripts\python.exe" --version
```

---

# 39. Development Notes

The project is intentionally separated into layers.

### API layer

Responsible for:

* HTTP requests
* input validation
* responses
* API errors

### Pipeline layer

Responsible for:

* image loading
* video loading
* RTSP acquisition
* preprocessing

### Inference layer

Responsible for:

* ONNX Runtime
* model loading
* model caching
* inference execution

### Core layer

Responsible for:

* configuration
* runtime initialization
* resource management

### Utility layer

Responsible for:

* logging

This separation makes it easier to replace or extend individual components without rewriting the entire backend.

---

# 40. Handoff Instructions for AI/Model Team

When receiving an ONNX model, provide the backend developer with:

```text
1. Model filename
2. Model purpose
3. Input shape
4. Input datatype
5. Expected image size
6. RGB/BGR requirement
7. Normalization formula
8. Mean/std values
9. Output shape
10. Output datatype
11. Class labels
12. Confidence threshold
13. NMS requirements, if applicable
14. Required post-processing
15. Example input
16. Example expected output
```

Without this information, the model should not be integrated by assumption.

---

# 41. Git Workflow

Check repository status:

```powershell
git status
```

Add project files:

```powershell
git add .
```

Review staged files:

```powershell
git status
```

Create commit:

```powershell
git commit -m "Build SIH26187 inference engine"
```

Connect GitHub remote:

```powershell
git remote add origin https://github.com/aditikp0907/SIH26187-Inference-Engine.git
```

Push:

```powershell
git branch -M main
git push -u origin main
```

---

# 42. Important Git Security Note

This repository is public.

Never commit real:

```text
Passwords
API keys
Private RTSP credentials
Private CCTV addresses
Cloud secrets
Production tokens
```

Temporary test models and test assets are acceptable for development, but final production models and sensitive operational data should be handled according to the project team's deployment and security requirements.

---

# 43. Current Backend Capability

At the current stage, the backend can:

```text
✓ Start FastAPI server
✓ Validate requests
✓ Load ONNX models
✓ Cache multiple models
✓ Execute CPU inference
✓ Limit concurrent inference
✓ Process images
✓ Process videos
✓ Process RTSP streams
✓ Handle RTSP failures
✓ Handle invalid input
✓ Generate structured JSON responses
✓ Log backend activity
✓ Clean up temporary resources
✓ Run performance tests
```

The infrastructure is therefore ready for integration of the actual SIH-trained models.

---

# 44. Final Integration Checklist

Before final SIH demonstration:

```text
[ ] Final ONNX models received
[ ] Each model inspected
[ ] Input shapes verified
[ ] Input datatypes verified
[ ] Preprocessing verified
[ ] Output formats verified
[ ] Class labels integrated
[ ] Post-processing integrated
[ ] Detection thresholds configured
[ ] Image inference tested
[ ] Video inference tested
[ ] RTSP inference tested
[ ] Multiple models loaded
[ ] CPU/RAM benchmark completed
[ ] Concurrency benchmark completed
[ ] Error handling verified
[ ] Logs verified
[ ] Frontend connected
[ ] Secure backend exposure configured
[ ] GitHub repository updated
```

---

# 45. Repository

GitHub:

https://github.com/aditikp0907/SIH26187-Inference-Engine

---

## Project Summary

**SIH26187 Inference Engine** is a modular CPU-based FastAPI backend for intelligent video analytics. It provides the model execution and input-processing infrastructure required by the SIH26187 border surveillance platform.

The system is designed to accept image, video, and CCTV RTSP inputs, efficiently manage multiple ONNX models, control CPU inference concurrency, validate requests, handle failures safely, and provide structured inference responses for frontend integration.

The final AI intelligence will be provided by the trained ONNX models and their corresponding model-specific preprocessing and post-processing logic.
