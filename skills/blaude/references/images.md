# Images

Artifacts can't load images from other sites. Every image is stored inside the page as a `data:` URI.

## For each image the author attaches

1. **Alt text.** Required. If the author didn't describe the image, ask in one line, offering a suggestion they can accept: "Alt text for the photo: 'Three boats in the harbour at dawn'?" Decorative images still need a short description in a figure.
2. **Resize and encode.** At most 1600 px on the long edge, WebP at quality 80 (JPEG at 80 if WebP isn't available; PNG only for screenshots with sharp text where WebP looks worse). Strip metadata (location data especially).
3. **Inline** the result as `data:image/webp;base64,…` in a `figure` or `gallery`, with its pixel `width` and `height`.

With code execution (Python with Pillow is usually available):

```python
import base64, io
from PIL import Image, ImageOps

def inline_image(path, long_edge=1600, quality=80):
    im = ImageOps.exif_transpose(Image.open(path))   # respect camera rotation
    im.thumbnail((long_edge, long_edge))              # keeps the aspect ratio, never upscales
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "transparency" in im.info else "RGB")
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=quality, method=6)   # no EXIF is written
    uri = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    return uri, im.width, im.height
```

## Size budget

A post must stay under 16 MiB; keep it under **12 MB** to leave headroom. After building, check the size (`blaude.js check` warns above 12 MB). If it's over:

1. Re-encode the largest images at 1200 px and quality 70.
2. Still over: ask the author which images to drop or split into a second post. Don't silently remove any.

## Video

Video can't be embedded (no iframes, no remote media). Offer a figure with a thumbnail image the author attaches, followed by a plain link to the video page ("Watch on …"). Never hotlink a thumbnail from another site.

## Avatar

For the Featured layout's About sidebar: a square image, 256 px, WebP, stored as `blog.avatar` (a `data:image/…` URI). Ledger shows no avatar.
