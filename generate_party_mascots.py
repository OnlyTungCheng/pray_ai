from PIL import Image, ImageEnhance, ImageDraw, ImageFilter, ImageOps
import math

def generate_party_art(input_path, output_path, primary_color, accent_color):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size

    # 1. Vibrant Nightclub Color Grade
    contrast = ImageEnhance.Contrast(img).enhance(1.35)
    color = ImageEnhance.Color(contrast).enhance(1.5)
    img = ImageEnhance.Brightness(color).enhance(1.05)

    # 2. Add Dynamic Disco Spotlights & Lasers Overlay
    disco_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(disco_layer)

    # Swirling Laser Beams
    draw.polygon([(0, 0), (int(w*0.7), h), (int(w*0.8), h), (0, 0)], fill=(236, 72, 153, 90))
    draw.polygon([(w, 0), (int(w*0.2), h), (int(w*0.3), h), (w, 0)], fill=(56, 189, 248, 90))
    draw.polygon([(int(w*0.5), 0), (0, int(h*0.8)), (0, int(h*0.9))], fill=(250, 204, 21, 75))

    # Glow Aura Behind Head
    draw.ellipse([int(w*0.15), int(h*0.1), int(w*0.85), int(h*0.6)], fill=(217, 70, 239, 70))

    img = Image.alpha_composite(img, disco_layer)

    # 3. Draw Ultra 3D Neon Party Shades 🕶️
    shades = ImageDraw.Draw(img)
    
    # Coordinates for glasses
    x1, y1 = int(w * 0.26), int(h * 0.31)
    x2, y2 = int(w * 0.74), int(h * 0.45)
    mw = (x2 - x1) // 2

    # Black reflective lenses
    shades.rounded_rectangle([x1, y1, x1 + mw - 5, y2], radius=16, fill=(10, 10, 20, 245), outline=(244, 114, 182, 255), width=5)
    shades.rounded_rectangle([x1 + mw + 5, y1, x2, y2], radius=16, fill=(10, 10, 20, 245), outline=(56, 189, 248, 255), width=5)
    shades.line([(x1 + mw - 5, y1 + 12), (x1 + mw + 5, y1 + 12)], fill=(244, 114, 182, 255), width=5)

    # Laser Glare Reflections on Lenses
    shades.line([(x1 + 12, y1 + 8), (x1 + 28, y2 - 8)], fill=(255, 255, 255, 210), width=4)
    shades.line([(x1 + mw + 17), y1 + 8, (x1 + mw + 33), y2 - 8], fill=(255, 255, 255, 210), width=4)

    # 4. Draw DJ Headphones 🎧
    shades.arc([int(w*0.12), int(h*0.12), int(w*0.88), int(h*0.48)], start=175, end=365, fill=(236, 72, 153, 255), width=14)
    shades.rounded_rectangle([int(w*0.1), int(h*0.26), int(w*0.22), int(h*0.44)], radius=12, fill=(30, 27, 75, 255), outline=(56, 189, 248, 255), width=4)
    shades.rounded_rectangle([int(w*0.78), int(h*0.26), int(w*0.9), int(h*0.44)], radius=12, fill=(30, 27, 75, 255), outline=(56, 189, 248, 255), width=4)

    # 5. Draw Glowing Cocktail Drink 🍸 in Hand
    cx, cy = int(w * 0.76), int(h * 0.72)
    shades.polygon([(cx-22, cy-25), (cx+22, cy-25), (cx, cy+5)], fill=(244, 114, 182, 220), outline=(255, 255, 255, 255), width=3)
    shades.line([(cx, cy+5), (cx, cy+30)], fill=(255, 255, 255, 255), width=4)
    shades.ellipse([cx-15, cy+27, cx+15, cy+33], fill=(255, 255, 255, 255))
    shades.line([(cx-5, cy-35), (cx+15, cy-5)], fill=(56, 189, 248, 255), width=3) # Straw

    # Save output
    res = img.convert("RGB")
    res.save(output_path, "JPEG", quality=98)
    print(f"Generated: {output_path}")

public_path = "/home/tung/Documents/pray/public"
generate_party_art(f"{public_path}/codex_chibi.jpg", f"{public_path}/codex_party.jpg", "#38bdf8", "#f472b6")
generate_party_art(f"{public_path}/claude_chibi.jpg", f"{public_path}/claude_party.jpg", "#f472b6", "#fde047")
generate_party_art(f"{public_path}/kiro_chibi.jpg", f"{public_path}/kiro_party.jpg", "#a855f7", "#38bdf8")
