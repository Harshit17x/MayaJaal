from app.pipeline.rtsp_loader import (
    RTSPStream,
    RTSPConnectionError,
)

print("=== RTSP COMPLETE TEST ===")
print()

passed = 0
total = 5

# 1. URL validation
try:
    RTSPStream("")
    print("1. URL validation: FAILED")
except Exception as exc:
    print("1. URL validation: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()

# 2. Initial status
stream = RTSPStream(
    "rtsp://127.0.0.1:59999/nonexistent",
    reconnect_attempts=1,
    reconnect_delay_seconds=0,
    connection_timeout_ms=5000,
    read_timeout_ms=5000,
)

status = stream.get_status()

if status["connected"] is False:
    print("2. Initial status: SUCCESS")
    print("   Connected:", status["connected"])
    print("   Timeout:", status["connection_timeout_ms"], "ms")
    passed += 1
else:
    print("2. Initial status: FAILED")

print()

# 3. Connection failure
try:
    stream.connect()
    print("3. Connection failure handling: FAILED")
except RTSPConnectionError as exc:
    print("3. Connection failure handling: SUCCESS")
    print("   Error:", exc)
    passed += 1

print()

# 4. Reconnect failure
if stream.reconnect() is False:
    print("4. Reconnect failure handling: SUCCESS")
    passed += 1
else:
    print("4. Reconnect failure handling: FAILED")

print()

# 5. Read without connection + cleanup
try:
    stream.read_frame()
    print("5. Read/cleanup handling: FAILED")
except RTSPConnectionError as exc:
    print("5. Read without connection: SUCCESS")
    print("   Error:", exc)

stream.release()

if stream.get_status()["connected"] is False:
    print("   Resource cleanup: SUCCESS")
    passed += 1
else:
    print("   Resource cleanup: FAILED")

print()
print("=== RESULT ===")
print(f"Passed: {passed}/{total}")

if passed == total:
    print("ALL RTSP TESTS: SUCCESS")
else:
    print("RTSP TESTS: FAILED")
