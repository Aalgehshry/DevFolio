"""Subset Font Awesome to the icons this site actually renders.

all.min.css is ~4000 glyph rules of the form `.fa-name:before{content:"\fxxx"}`.
Only those rules are dropped; every other rule (@font-face, the .fa base class,
sizing/rotation/stacking utilities, animations) is kept untouched, so nothing
that is not an unused glyph can break.
"""
import re
import os

ROOT = r"D:\Front End\HTML And CSS\DevFolio"
SRC = os.path.join(ROOT, "css", "all.min.css")
OUT = os.path.join(ROOT, "css", "fontawesome.subset.css")

# --- 1. which icons does the site use? ------------------------------------
used = set()
for folder, _, files in os.walk(ROOT):
    if any(part in folder for part in (".git", "webfonts")):
        continue
    for name in files:
        if not name.endswith((".html", ".js")) or "bootstrap" in name:
            continue
        with open(os.path.join(folder, name), encoding="utf-8") as handle:
            used.update(re.findall(r"fa-[a-z0-9-]+", handle.read()))

# Style/utility classes are not glyphs; keeping them in `used` is harmless but
# noisy, so drop the ones we know are modifiers.
MODIFIERS = {
    "fa-solid", "fa-regular", "fa-brands", "fa-light", "fa-thin", "fa-duotone",
    "fa-xs", "fa-sm", "fa-lg", "fa-2xs", "fa-xl", "fa-2xl",
}
icons = {name for name in used if name not in MODIFIERS}

with open(SRC, encoding="utf-8") as handle:
    css = handle.read()

# --- 2. walk the rules ----------------------------------------------------
GLYPH_SELECTOR = re.compile(r"^\.fa-[a-z0-9-]+::?before$")
# Split on top-level '}' while keeping @font-face/@media blocks intact.
kept, dropped, out = 0, 0, []
depth = 0
buffer = ""

for char in css:
    buffer += char
    if char == "{":
        depth += 1
    elif char == "}":
        depth -= 1
        if depth == 0:
            rule = buffer
            buffer = ""
            head, _, body = rule.partition("{")
            selectors = [s.strip() for s in head.split(",") if s.strip()]
            # A glyph rule: every selector is `.fa-x:before` and it only sets content.
            if selectors and all(GLYPH_SELECTOR.match(s) for s in selectors) \
                    and body.strip().rstrip("}").startswith("content:"):
                keep = [s for s in selectors
                        if s.split(":")[0].lstrip(".") in icons]
                if keep:
                    out.append(",".join(keep) + "{" + body)
                    kept += 1
                else:
                    dropped += 1
                continue
            out.append(rule)

result = "".join(out)
with open(OUT, "w", encoding="utf-8", newline="") as handle:
    handle.write(result)

before, after = os.path.getsize(SRC), os.path.getsize(OUT)
print(f"icons requested : {len(icons)}")
print(f"glyph rules kept: {kept}   dropped: {dropped}")
print(f"{before/1024:.0f}K -> {after/1024:.0f}K  ({100 - after*100//before}% smaller)")

# --- 3. sanity check: every icon we asked for must have survived -----------
present = set(re.findall(r"\.(fa-[a-z0-9-]+)::?before\s*\{?content", result))
present |= set(re.findall(r"\.(fa-[a-z0-9-]+)::?before", result))
missing = sorted(icons - present)
print("MISSING (no glyph rule found):", missing if missing else "none")
