"""Recompress the JPEGs in place and emit a WebP twin for each one."""
import os
from PIL import Image

SRC = r"D:\Front End\HTML And CSS\DevFolio\imges"

# Nothing on the page renders wider than 1920 CSS px.
MAX_WIDTH = 1920
JPEG_QUALITY = 78
WEBP_QUALITY = 74

rows = []
total_before = total_after = 0

for name in sorted(os.listdir(SRC)):
    stem, ext = os.path.splitext(name)
    if ext.lower() not in (".jpg", ".jpeg"):
        continue

    path = os.path.join(SRC, name)
    before = os.path.getsize(path)

    with Image.open(path) as im:
        im = im.convert("RGB")
        if im.width > MAX_WIDTH:
            im = im.resize(
                (MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)),
                Image.LANCZOS,
            )
        # optimize+progressive shrinks the file and lets it paint in passes.
        im.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
        webp_path = os.path.join(SRC, stem + ".webp")
        im.save(webp_path, "WEBP", quality=WEBP_QUALITY, method=6)
        size = im.size

    after = os.path.getsize(path)
    webp = os.path.getsize(webp_path)
    total_before += before
    total_after += webp  # webp is what modern browsers will actually fetch
    rows.append((name, f"{size[0]}x{size[1]}", before, after, webp))

print(f"{'file':<16}{'dims':<12}{'was':>9}{'jpg':>9}{'webp':>9}{'saved':>8}")
print("-" * 63)
for name, dims, before, after, webp in rows:
    saved = 100 - webp * 100 // before
    print(f"{name:<16}{dims:<12}{before/1024:>8.0f}K{after/1024:>8.0f}K{webp/1024:>8.0f}K{saved:>7}%")
print("-" * 63)
print(
    f"{'TOTAL':<28}{total_before/1024:>8.0f}K{'':>9}{total_after/1024:>8.0f}K"
    f"{100 - total_after * 100 // total_before:>7}%"
)
