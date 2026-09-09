import re

with open(r'..\..\app.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''    # Convert using imageio-ffmpeg to ensure browser compatibility
    import subprocess
    import imageio_ffmpeg
    final_out_path = out_path.replace(".mp4", "_h264.mp4")
    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run([ffmpeg_exe, "-y", "-i", out_path, "-vcodec", "libx264", "-movflags", "faststart", final_out_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        video_to_return = final_out_path
    except Exception as e:
        print(f"Warning: ffmpeg conversion failed: {e}. Falling back to mp4v.")
        video_to_return = out_path'''

content = re.sub(
    r'    # Convert using ffmpeg to ensure browser compatibility.*?        video_to_return = out_path',
    replacement,
    content,
    flags=re.DOTALL
)

with open(r'..\..\app.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched app.py")
