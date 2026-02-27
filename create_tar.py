import tarfile
import os

# Files to include in the deployment tar
project_dir = os.path.dirname(os.path.abspath(__file__))
include_files = [
    'index.html',
    'style.css',
    'script.js',
    'capybara.png',
    'Dockerfile',
    'captain-definition',
    '.dockerignore',
]

output_tar = os.path.join(project_dir, 'labyrinth.tar')

with tarfile.open(output_tar, 'w') as tar:
    for fname in include_files:
        fpath = os.path.join(project_dir, fname)
        if os.path.exists(fpath):
            tar.add(fpath, arcname=fname)
            print(f'  Added: {fname} ({os.path.getsize(fpath)} bytes)')
        else:
            print(f'  MISSING: {fname}')

print(f'\nDone! Created: {output_tar}')
print(f'Archive size: {os.path.getsize(output_tar)} bytes')