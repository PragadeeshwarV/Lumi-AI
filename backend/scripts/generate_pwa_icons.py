import os
import math
from pathlib import Path
from PIL import Image, ImageDraw

def generate_icons():
    root = Path(__file__).resolve().parent.parent.parent
    icons_dir = root / "frontend" / "public" / "icons"
    icons_dir.mkdir(parents=True, exist_ok=True)

    def create_lumi_icon(size: int, is_maskable: bool = False) -> Image.Image:
        scale = 4
        canvas_size = size * scale
        img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Lumi Purple Gradient: #7654B8 to #49356F
        bg_top = (118, 84, 184, 255)
        bg_bottom = (73, 53, 111, 255)

        for y in range(canvas_size):
            factor = y / canvas_size
            r = int(bg_top[0] * (1 - factor * 0.35) + bg_bottom[0] * (factor * 0.35))
            g = int(bg_top[1] * (1 - factor * 0.35) + bg_bottom[1] * (factor * 0.35))
            b = int(bg_top[2] * (1 - factor * 0.35) + bg_bottom[2] * (factor * 0.35))
            draw.line([(0, y), (canvas_size, y)], fill=(r, g, b, 255))

        if not is_maskable:
            mask = Image.new("L", (canvas_size, canvas_size), 0)
            mask_draw = ImageDraw.Draw(mask)
            radius = int(canvas_size * 0.22)
            mask_draw.rounded_rectangle([(0, 0), (canvas_size, canvas_size)], radius=radius, fill=255)
            img.putalpha(mask)
            draw = ImageDraw.Draw(img)

        # Sparkle geometry
        art_scale = 0.52 if is_maskable else 0.62
        cx, cy = canvas_size / 2, canvas_size / 2
        r_outer = (canvas_size / 2) * art_scale
        r_inner = r_outer * 0.22

        # Glowing soft halo
        halo = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        halo_draw = ImageDraw.Draw(halo)
        halo_radius = int(r_outer * 0.75)
        halo_draw.ellipse([
            (cx - halo_radius, cy - halo_radius),
            (cx + halo_radius, cy + halo_radius)
        ], fill=(237, 229, 255, 75))
        img = Image.alpha_composite(img, halo)
        draw = ImageDraw.Draw(img)

        # Central 4-pointed star
        points = []
        for i in range(8):
            angle = i * (math.pi / 4)
            r = r_outer if (i % 2 == 0) else r_inner
            px = cx + r * math.cos(angle)
            py = cy + r * math.sin(angle)
            points.append((px, py))
        draw.polygon(points, fill=(255, 255, 255, 255))

        # Companion sparkle top-right
        s2_cx = cx + r_outer * 0.68
        s2_cy = cy - r_outer * 0.62
        s2_outer = r_outer * 0.28
        s2_inner = s2_outer * 0.22
        s2_points = []
        for i in range(8):
            angle = i * (math.pi / 4)
            r = s2_outer if (i % 2 == 0) else s2_inner
            px = s2_cx + r * math.cos(angle)
            py = s2_cy + r * math.sin(angle)
            s2_points.append((px, py))
        draw.polygon(s2_points, fill=(237, 229, 255, 240))

        # Accent dot bottom-left
        s3_cx = cx - r_outer * 0.65
        s3_cy = cy + r_outer * 0.60
        s3_radius = int(r_outer * 0.08)
        draw.ellipse([
            (s3_cx - s3_radius, s3_cy - s3_radius),
            (s3_cx + s3_radius, s3_cy + s3_radius)
        ], fill=(237, 229, 255, 220))

        # Antialiased downsample
        return img.resize((size, size), Image.Resampling.LANCZOS)

    create_lumi_icon(192, is_maskable=False).save(icons_dir / "icon-192.png", "PNG")
    create_lumi_icon(512, is_maskable=False).save(icons_dir / "icon-512.png", "PNG")
    create_lumi_icon(192, is_maskable=True).save(icons_dir / "icon-192-maskable.png", "PNG")
    create_lumi_icon(512, is_maskable=True).save(icons_dir / "icon-maskable-512.png", "PNG")
    create_lumi_icon(180, is_maskable=False).save(icons_dir / "apple-touch-icon.png", "PNG")
    print(f"Generated 5 PWA icons in {icons_dir}")

if __name__ == "__main__":
    generate_icons()
