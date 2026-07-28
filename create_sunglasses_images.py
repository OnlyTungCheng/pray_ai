from PIL import Image, ImageDraw
import os

def add_sunglasses_to_original(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return

    img = Image.open(input_path).convert("RGBA")
    w, h = img.size

    # Draw cool black sunglasses 🕶️ onto the original character's eyes
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Glass positioning tuned for the original Chibi face
    x1, y1 = int(w * 0.28), int(h * 0.33)
    x2, y2 = int(w * 0.72), int(h * 0.44)
    mid_gap = 10
    mw = (x2 - x1 - mid_gap) // 2

    # Left Lens (Sleek Black Sunglasses)
    draw.rounded_rectangle([x1, y1, x1 + mw, y2], radius=14, fill=(15, 23, 42, 245), outline=(244, 114, 182, 255), width=4)
    # Right Lens
    draw.rounded_rectangle([x1 + mw + mid_gap, y1, x2, y2], radius=14, fill=(15, 23, 42, 245), outline=(56, 189, 248, 255), width=4)
    # Center Bridge
    draw.line([(x1 + mw, y1 + 12), (x1 + mw + mid_gap, y1 + 12)], fill=(244, 114, 182, 255), width=4)

    # Lens glare highlights
    draw.line([(x1 + 10, y1 + 8), (x1 + 24, y2 - 8)], fill=(255, 255, 255, 180), width=3)
    draw.line([(x1 + mw + mid_gap + 10, y1 + 8), (x1 + mw + mid_gap + 24, y2 - 8)], fill=(255, 255, 255, 180), width=3)

    img = Image.alpha_composite(img, overlay)
    res = img.convert("RGB")
    res.save(output_path, "JPEG", quality=98)
    print(f"Saved original + sunglasses: {output_path}")

public_dir = "/home/tung/Documents/pray/public"
add_sunglasses_to_original(f"{public_dir}/codex_chibi.jpg", f"{public_dir}/codex_party.jpg")
add_sunglasses_to_original(f"{public_dir}/claude_chibi.jpg", f"{public_dir}/claude_party.jpg")
add_sunglasses_to_original(f"{public_dir}/kiro_chibi.jpg", f"{public_dir}/kiro_party.jpg")
