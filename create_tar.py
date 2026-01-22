import tarfile
import os

output_filename = "labyrinth.tar"
files_to_pack = ["index.html", "style.css", "script.js", "captain-definition", "capybara.png"]

print(f"Creating {output_filename}...")
with tarfile.open(output_filename, "w") as tar:
    for file in files_to_pack:
        if os.path.exists(file):
            tar.add(file)
            print(f"+ {file}")
        else:
            print(f"- {file} (not found, skipping)")

print("Done! Now upload this file to CapRover dashboard.")