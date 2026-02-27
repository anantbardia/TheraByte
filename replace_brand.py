import os
import re

base_dir = r"c:\Users\Anant\Desktop\AIpsycho"
exclude_dirs = {".git", "node_modules", ".venv", "venv", "dist", ".gemini", "__pycache__", ".vscode", "brain"}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = re.sub(r'MindBridge', 'TheraByte', content)
        new_content = re.sub(r'mindbridge', 'therabyte', new_content)
        new_content = re.sub(r'MINDBRIDGE', 'THERABYTE', new_content)

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
    except Exception as e:
        print(f"Could not process {filepath}: {e}")

for root, dirs, files in os.walk(base_dir):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        if file.endswith(('.py', '.js', '.jsx', '.html', '.css', '.md', '.txt', '.env', '.json')):
            if file in ['package-lock.json']:
                continue
            replace_in_file(os.path.join(root, file))
