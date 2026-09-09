from app.pipeline.video_loader import VideoLoader

video_path = "temp/test_video.mp4"

print("Testing VideoLoader...")
print()

try:
    with VideoLoader(video_path) as video:

        metadata = video.get_metadata()

        print("Video opened: SUCCESS")
        print("Filename:", metadata["filename"])
        print("FPS:", metadata["fps"])
        print("Frame count:", metadata["frame_count"])
        print("Resolution:", f'{metadata["width"]}x{metadata["height"]}')
        print("Duration:", metadata["duration_seconds"], "seconds")
        print()

        frames_read = 0

        while True:
            success, frame = video.read_frame()

            if not success:
                break

            frames_read += 1

            if frames_read == 1:
                print("First frame: SUCCESS")
                print("Frame shape:", frame.shape)
                print("Frame dtype:", frame.dtype)

        print()
        print("Frames successfully read:", frames_read)

        if frames_read == metadata["frame_count"]:
            print("Frame count verification: SUCCESS")
        else:
            print(
                "Frame count verification: WARNING",
                f"(expected {metadata['frame_count']}, got {frames_read})"
            )

    print()
    print("Video resource cleanup: SUCCESS")

except Exception as exc:
    print()
    print("ERROR: VideoLoader test failed")
    print("Type:", type(exc).__name__)
    print("Error:", exc)
