from app.pipeline.rtsp_loader import (
    RTSPStream,
    InvalidRTSPUrlError,
    RTSPConnectionError,
    RTSPReadError,
)

print("=== RTSP ERROR HANDLING TEST ===")
print()

passed = 0
total = 4

# 1. Empty URL
try:
    RTSPStream("")
    print("1. Empty URL: FAILED")
except InvalidRTSPUrlError as exc:
    print("1. Empty URL: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()

# 2. Invalid URL scheme
try:
    RTSPStream("http://127.0.0.1:8554/test")
    print("2. Invalid scheme: FAILED")
except InvalidRTSPUrlError as exc:
    print("2. Invalid scheme: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()

# 3. Unreachable RTSP stream
stream = RTSPStream(
    "rtsp://127.0.0.1:59999/nonexistent",
    reconnect_attempts=1,
    reconnect_delay_seconds=0,
)

try:
    stream.connect()
    print("3. Unreachable stream: FAILED")
except RTSPConnectionError as exc:
    print("3. Unreachable stream: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()

# 4. Read without connection
stream.release()

try:
    stream.read_frame()
    print("4. Read without connection: FAILED")
except RTSPConnectionError as exc:
    print("4. Read without connection: SUCCESS")
    print("   Error:", exc)
    passed += 1
except RTSPReadError as exc:
    print("4. Read without connection: FAILED")
    print("   Wrong error type:", type(exc).__name__)
    print("   Error:", exc)

print()

# Reconnect failure test
print("Testing reconnect failure...")

reconnected = stream.reconnect()

if reconnected is False:
    print("Reconnect failure handling: SUCCESS")
else:
    print("Reconnect failure handling: FAILED")

stream.release()

print()
print("=== RESULT ===")
print(f"Passed: {passed}/{total}")

if passed == total:
    print("ALL RTSP ERROR TESTS: SUCCESS")
else:
    print("RTSP ERROR TESTS: FAILED")
