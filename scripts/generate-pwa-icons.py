#!/usr/bin/env python3
"""Generate all PWA icons from the DigiTools SVG logo.
Outputs:
  - public/icon-192.png   (Android, normal)
  - public/icon-512.png   (Android, splash)
  - public/maskable-192.png  (Android, maskable)
  - public/maskable-512.png  (Android, maskable)
  - public/apple-touch-icon.png  (iOS, 180x180)
  - public/favicon-32.png  (browser tab, 32x32)
  - public/favicon-16.png  (browser tab, 16x16)
  - public/icon-512-with-bg.png  (masked with safe padding)
"""
import cairosvg
from PIL import Image, ImageFilter, ImageDraw
from pathlib import Path
from io import BytesIO

PUB = Path("/home/z/my-project/public")
SRC_SVG = PUB / "logo-digi.svg"

def render_png(size: int, padding: float = 0.0, bg: str | None = None) -> Image.Image:
    """Render the SVG at given size. Padding is a fraction (0..0.3) of empty
    space around the icon — used for maskable icons to keep the safe area."""
    inner = int(size * (1 - 2 * padding))
    # Render SVG at inner size
    png_bytes = cairosvg.svg2png(url=str(SRC_SVG),
                                 output_width=inner,
                                 output_height=inner,
                                 background_color="transparent")
    inner_img = Image.open(BytesIO(png_bytes)).convert("RGBA")

    # Compose onto a canvas
    if bg is None:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    else:
        canvas = Image.new("RGBA", (size, size), bg)

    offset = (size - inner) // 2
    canvas.paste(inner_img, (offset, offset), inner_img)
    return canvas


def main():
    # 1. Standard icons (transparent background, full bleed)
    for sz in (192, 512):
        img = render_png(sz, padding=0.0)
        img.save(PUB / f"icon-{sz}.png")
        print(f"  icon-{sz}.png  ({sz}x{sz})")

    # 2. Maskable icons — need padding (safe area = 80% visible in middle).
    # Android maskable: keep the important content within a circle of 80% diameter
    # centered. We add ~15% padding around the icon.
    for sz in (192, 512):
        img = render_png(sz, padding=0.15, bg=(0, 0, 0, 0))
        img.save(PUB / f"maskable-{sz}.png")
        print(f"  maskable-{sz}.png  ({sz}x{sz})")

    # 3. Apple touch icon — iOS adds rounded corners, so we provide a 180x180
    # icon with a solid background gradient so it looks good on the iOS home
    # screen.
    apple = render_png(180, padding=0.06, bg=(99, 102, 241, 255))
    apple.save(PUB / "apple-touch-icon.png")
    print("  apple-touch-icon.png  (180x180)")

    # 4. Favicons (small, transparent)
    for sz in (16, 32):
        img = render_png(sz, padding=0.0)
        img.save(PUB / f"favicon-{sz}.png")
        print(f"  favicon-{sz}.png  ({sz}x{sz})")

    # 5. OG/social preview (1200x630) for Twitter/Facebook cards
    og = Image.new("RGB", (1200, 630), (15, 23, 42))
    # Add gradient background
    grad = Image.new("RGB", (1200, 630))
    draw = ImageDraw.Draw(grad)
    for y in range(630):
        # interpolate #6366f1 → #8b5cf6
        t = y / 630
        r = int(99 + (139 - 99) * t)
        g = int(102 + (92 - 102) * t)
        b = int(241 + (246 - 241) * t)
        draw.line([(0, y), (1200, y)], fill=(r, g, b))
    og = Image.blend(og, grad, 0.92)

    # Render large icon and add to left
    icon_bytes = cairosvg.svg2png(url=str(SRC_SVG),
                                  output_width=400,
                                  output_height=400,
                                  background_color="transparent")
    icon_img = Image.open(BytesIO(icon_bytes)).convert("RGBA")
    # Add subtle shadow
    shadow = Image.new("RGBA", og.size, (0, 0, 0, 0))
    sh = Image.new("RGBA", icon_img.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, 80), (0, 0, *icon_img.size), icon_img)
    sh = sh.filter(ImageFilter.GaussianBlur(15))
    shadow.alpha_composite(sh, (120, 115))
    shadow.alpha_composite(icon_img, (120, 115))
    og_rgba = og.convert("RGBA")
    og_rgba.alpha_composite(shadow)
    og = og_rgba.convert("RGB")

    og.save(PUB / "og-image.png", quality=92)
    print("  og-image.png  (1200x630, social preview)")

    # Verify all icons exist
    print("\n=== Generated icons ===")
    for f in sorted(PUB.glob("*.png")):
        if "icon" in f.name or "maskable" in f.name or "favicon" in f.name or "apple-touch" in f.name or "og-image" in f.name:
            try:
                with Image.open(f) as im:
                    print(f"  {f.name:30} {im.size[0]}x{im.size[1]}  {f.stat().st_size} bytes")
            except Exception as e:
                print(f"  {f.name}: ERROR {e}")

if __name__ == "__main__":
    main()
