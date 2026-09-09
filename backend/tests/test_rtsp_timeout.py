import time

from app.pipeline.rtsp_loader import (
    RTSPStream,
    RTSPConnectionError,
)

print("=== RTSP TIMEOUT TEST ===")
print()

stream = RTSPStream(
    "rtsp://127.0.0.1:59999/nonexistent",
    reconnect_attempts=1,
    reconnect_delay_seconds=0,
    connection_timeout_ms=5000,
    read_timeout_ms=5000,
)

start = time.perf_counter()

try:
    stream.connect()
    print("Connection: UNEXPECTED SUCCESS")
except RTSPConnectionError as exc:
    elapsed = time.perf_counter() - start

    print("Connection failure: SUCCESS")
    print("Error:", exc)
    print(f"Elapsed time: {elapsed:.2f} seconds")

    if elapsed <= 8:
        print("Timeout control: SUCCESS")
    else:
        print("Timeout control: FAILED")

finally:
    stream.release()

print()
print("RTSP timeout test complete.")
