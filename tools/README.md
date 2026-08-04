# Build scripts

Two one-file Python scripts. Neither runs automatically — the site is plain
static files with no build step, so these are run by hand when their inputs
change. Both need Python 3 and Pillow (`pip install pillow`).

## `subset-fontawesome.py`

Generates `css/fontawesome.subset.css` from the full `css/all.min.css`, keeping
only the glyph rules for icons the pages actually use (94 KB → 11 KB).

**Run this whenever you add a new `fa-…` icon to the markup.** A new icon that
is not in the subset renders as a blank box. The script scans every `.html`
and `.js` file for `fa-*` class names, so no list needs updating by hand — and
it prints `MISSING` if any requested icon has no glyph rule.

```bash
python tools/subset-fontawesome.py
```

`css/all.min.css` stays in the repo as the source to re-subset from; it is not
loaded by any page.

## `optimize-images.py`

Recompresses every JPEG in `images/` in place (max width 1920, quality 78,
progressive) and writes a WebP twin next to it.

**Run this after adding new photos to `images/`.** The pages reference the
WebP through `<picture>` and `image-set()`, with the JPEG as the fallback, so
both files need to exist.

```bash
python tools/optimize-images.py
```

Re-running it on already-optimised files will recompress them again and slowly
degrade quality — only run it when new images have been added.
