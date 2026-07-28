from PIL import Image, ImageEnhance, ImageDraw, ImageFilter
import os

def process_party_image(input_path, output_path, theme_color):
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return

    img = Image.open(input_path).convert("RGBA")
    w, h = img.size

    # 1. Nightclub Neon Tint & Contrast Enhancement
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.25)
    
    enhancer_sat = ImageEnhance.Color(img)
    img = enhancer_sat.enhance(1.4)

    # 2. Add Nightclub Magenta/Cyan Glow Layer
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Purple/Pink Nightclub ambient tint on top & bottom
    for y in range(h):
        alpha = int(120 * (y / h))
        draw.line([(0, y), (w, y)], fill=(217, 70, 239, alpha // 2))

    # Neon Disco Spotlights
    draw.ellipse([w*0.1, h*0.05, w*0.5, h*0.35], fill=(56, 189, 248, 70))
    draw.ellipse([w*0.5, h*0.02, w*0.9, h*0.3], fill=(236, 72, 153, 80))

    img = Image.alpha_composite(img, overlay)

    # 3. Draw Stylish Party Sunglasses 🕶️ directly onto the character's eyes
    glass_draw = ImageDraw.Draw(img)
    
    # Glass coordinates in upper middle section
    gx1, gy1 = int(w * 0.28), int(h * 0.32)
    gx2, gy2 = int(w * 0.72), int(h * 0.44)
    
    # Left lens
    glass_draw.rounded_rectangle([gx1, gy1, int(w*0.48), gy2], radius=15, fill=(15, 23, 42, 230), outline=(244, 114, 182, 255), width=4)
    # Right lens
    glass_draw.rounded_rectangle([int(w*0.52), gy1, gx2, gy2], radius=15, fill=(15, 23, 42, 230), outline=(56, 189, 248, 255), width=4)
    # Bridge
    glass_draw.line([(int(w*0.48), int(gy1 + (gy2-gy1)/2)), (int(w*0.52), int(gy1 + (gy2-gy1)/2))], fill=(244, 114, 182, 255), width=4)
    
    # Lens reflections
    glass_draw.line([(gx1+10, gy1+10), (gx1+25, gy2-10)], fill=(255, 255, 255, 180), width=3)
    glass_draw.line([(int(w*0.52)+10, gy1+10), (int(w*0.52)+25, gy2-10)], fill=(255, 255, 255, 180), width=3)

    # 4. Draw DJ Headphones 🎧 on top of head
    hx1, hy1 = int(w * 0.15), int(h * 0.15)
    hx2, hy2 = int(w * 0.85), int(h * 0.38)
    
    # Headphone band
    glass_draw.arc([hx1, hy1-20, hx2, hy1+60], start=180, end=360, fill=(236, 72, 153, 255), width=12)
    # Left ear cup
    glass_draw.rounded_rectangle([hx1-10, int(h*0.25), hx1+25, int(h*0.42)], radius=10, fill=(30, 27, 75, 255), outline=(56, 189, 248, 255), width=4)
    # Right ear cup
    glass_draw.rounded_rectangle([hx2-25, int(h*0.25), hx2+10, int(h*0.42)], radius=10, fill=(30, 27, 75, 255), outline=(56, 189, 248, 255), width=4)

    # Save RGB JPEG
    final_img = img.convert("RGB")
    final_img.save(output_path, "JPEG", quality=95)
    print(f"Saved: {output_path}")

public_dir = "/home/tung/Documents/pray/public"
process_party_image(f"{public_dir}/codex_chibi.jpg", f"{public_dir}/codex_party.jpg", "#38bdf8")
process_party_image(f"{public_dir}/claude_chibi.jpg", f"{public_dir}/claude_party.jpg", "#f472b6")
process_party_image(f"{public_dir}/kiro_chibi.jpg", f"{public_dir}/kiro_party.jpg", "#c084fc")
