import os

with open(r'..\..\app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix: Write output video to a fixed path instead of Gradio's temp dir
# This prevents Windows PermissionError on temp files
old_video_return = 'return annotated_output_path, snaps'
new_video_return = '''# Copy to a stable output path to avoid Windows temp file permission errors
import shutil
stable_output = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output_result.mp4")
shutil.copy2(annotated_output_path, stable_output)
return stable_output, snaps'''

content = content.replace(old_video_return, new_video_return)

# Make sure os is imported at the top
if 'import os' not in content:
    content = 'import os\n' + content

with open(r'..\..\app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied: video now saved to stable output path.")
