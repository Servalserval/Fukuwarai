# -*- coding: utf-8 -*-
"""
產生兩張示範臉（okame / oni）的佔位圖 + face.json。
正解座標與繪圖用同一組常數，保證 JSON 與圖片一致。
換成真正的繪師圖之後就不需要這個腳本了。
用法: python3 tools/gen_sample_faces.py
"""
import json, math, os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "face")
W, H = 768, 1024

def canvas(w, h):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)

def bezier(p0, p1, p2, n=24):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t**2*p2[0]
        y = (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t**2*p2[1]
        pts.append((x, y))
    return pts

def stroke(d, pts, width, fill):
    d.line(pts, fill=fill, width=width, joint="curve")
    r = width / 2
    for p in (pts[0], pts[-1]):
        d.ellipse([p[0]-r, p[1]-r, p[0]+r, p[1]+r], fill=fill)

INK = (40, 32, 30, 255)

# ---------------------------------------------------------------- okame
def okame_base():
    img, d = canvas(W, H)
    # 髮
    d.ellipse([150, 140, 618, 560], fill=(35, 30, 32, 255))
    # 臉
    d.ellipse([84, 220, 684, 940], fill=(247, 231, 206, 255),
              outline=(122, 84, 56, 255), width=7)
    # 兩側髮絲
    d.ellipse([64, 380, 168, 640], fill=(35, 30, 32, 255))
    d.ellipse([600, 380, 704, 640], fill=(35, 30, 32, 255))
    # 腮紅
    for cx in (224, 544):
        d.ellipse([cx-52, 618, cx+52, 722], fill=(243, 169, 160, 255))
    return img

def okame_brow(flip=False):
    w, h = 120, 48
    img, d = canvas(w, h)
    pts = bezier((12, 36), (60, 4), (108, 36))
    stroke(d, pts, 14, INK)
    return img

def okame_eye():
    w, h = 120, 80
    img, d = canvas(w, h)
    d.ellipse([4, 8, 116, 72], fill=(255, 255, 255, 255), outline=INK, width=6)
    d.ellipse([44, 24, 76, 56], fill=INK)
    d.ellipse([50, 28, 60, 38], fill=(255, 255, 255, 255))
    return img

def okame_nose():
    w, h = 90, 90
    img, d = canvas(w, h)
    d.polygon([(45, 12), (72, 66), (18, 66)], fill=(232, 184, 138, 255),
              outline=(138, 90, 51, 255))
    d.ellipse([26, 62, 38, 74], fill=(138, 90, 51, 255))
    d.ellipse([52, 62, 64, 74], fill=(138, 90, 51, 255))
    return img

def okame_mouth():
    w, h = 200, 110
    img, d = canvas(w, h)
    d.ellipse([10, 10, 190, 100], fill=(192, 57, 43, 255),
              outline=(124, 31, 22, 255), width=6)
    d.rounded_rectangle([36, 20, 164, 48], radius=12, fill=(255, 250, 244, 255))
    return img

# ---------------------------------------------------------------- oni
def oni_base():
    img, d = canvas(W, H)
    # 角
    for cx in (250, 518):
        d.polygon([(cx-46, 300), (cx+46, 300), (cx, 128)],
                  fill=(231, 177, 10, 255), outline=(122, 84, 20, 255))
    # 亂髮
    hair = []
    for i in range(9):
        x = 154 + i * 57
        hair.append((x, 320))
        hair.append((x + 28, 208 if i % 2 == 0 else 250))
    hair.append((668, 320))
    d.polygon(hair, fill=(35, 30, 32, 255))
    # 臉
    d.ellipse([94, 260, 674, 960], fill=(198, 61, 47, 255),
              outline=(110, 23, 16, 255), width=8)
    return img

def oni_brow(right=False):
    w, h = 130, 60
    img, d = canvas(w, h)
    poly = [(8, 10), (124, 42), (118, 58), (2, 26)]
    if right:
        poly = [(w - x, y) for x, y in poly]
    d.polygon(poly, fill=INK)
    return img

def oni_eye():
    w, h = 120, 90
    img, d = canvas(w, h)
    d.ellipse([6, 8, 114, 84], fill=(245, 197, 66, 255), outline=INK, width=6)
    d.ellipse([42, 28, 78, 64], fill=INK)
    return img

def oni_nose():
    w, h = 100, 100
    img, d = canvas(w, h)
    d.ellipse([12, 20, 88, 88], fill=(165, 39, 27, 255),
              outline=(90, 16, 10, 255), width=6)
    d.ellipse([30, 34, 50, 54], fill=(226, 118, 105, 255))
    return img

def oni_mouth():
    w, h = 240, 130
    img, d = canvas(w, h)
    d.ellipse([8, 8, 232, 122], fill=(92, 14, 14, 255), outline=INK, width=6)
    for x0 in (60, 152):
        d.polygon([(x0, 16), (x0+28, 16), (x0+14, 60)],
                  fill=(255, 252, 246, 255), outline=(180, 176, 170, 255))
    return img


# ---------------------------------------------------------------- hajime (placeholder for メル art)
def hajime_base():
    img, d = canvas(W, H)
    # 亂髮（深藍灰）
    hair = []
    for i in range(9):
        x = 140 + i * 61
        hair.append((x, 360))
        hair.append((x + 30, 190 if i % 2 == 0 else 240))
    hair.append((688, 360))
    d.polygon(hair, fill=(46, 52, 74, 255))
    d.ellipse([120, 200, 648, 560], fill=(46, 52, 74, 255))
    # 臉
    d.ellipse([94, 250, 674, 950], fill=(248, 236, 222, 255),
              outline=(120, 96, 84, 255), width=7)
    # 側髮
    d.ellipse([70, 400, 180, 700], fill=(46, 52, 74, 255))
    d.ellipse([588, 400, 698, 700], fill=(46, 52, 74, 255))
    # 髮上的閃電標記（⚡ 感）
    d.polygon([(430, 200), (392, 292), (424, 292), (386, 380), (462, 272), (428, 272), (466, 200)],
              fill=(246, 201, 14, 255), outline=(160, 120, 8, 255))
    return img

def hajime_brow():
    w, h = 120, 40
    img, d = canvas(w, h)
    d.rounded_rectangle([8, 12, 112, 28], radius=8, fill=(46, 52, 74, 255))
    return img

def hajime_eye():
    w, h = 110, 84
    img, d = canvas(w, h)
    d.ellipse([6, 6, 104, 78], fill=(255, 255, 255, 255), outline=(46, 52, 74, 255), width=6)
    d.ellipse([38, 22, 72, 62], fill=(52, 84, 140, 255))
    d.ellipse([44, 28, 56, 40], fill=(255, 255, 255, 255))
    return img

def hajime_nose():
    w, h = 70, 70
    img, d = canvas(w, h)
    pts = bezier((18, 16), (46, 34), (22, 56))
    stroke(d, pts, 9, (150, 110, 90, 255))
    return img

def hajime_mouth():
    w, h = 180, 96
    img, d = canvas(w, h)
    d.chord([10, -40, 170, 78], 20, 160, fill=(214, 88, 78, 255),
            outline=(120, 34, 28, 255), width=6)
    d.rounded_rectangle([46, 20, 134, 40], radius=9, fill=(255, 250, 244, 255))
    return img

# ---------------------------------------------------------------- 定義
FACES = {
    "example/okame": {
        "label": "おかめ", "artist": "sample",
        "base": okame_base,
        "parts": [
            ("brow_l", "まゆ・左", okame_brow, (289, 470)),
            ("brow_r", "まゆ・右", okame_brow, (479, 470)),
            ("eye_l",  "め・左",  okame_eye,  (289, 560)),
            ("eye_r",  "め・右",  okame_eye,  (479, 560)),
            ("nose",   "はな",    okame_nose, (384, 655)),
            ("mouth",  "くち",    okame_mouth,(384, 790)),
        ],
    },
    "example/oni": {
        "label": "おに", "artist": "sample",
        "base": oni_base,
        "parts": [
            ("brow_l", "まゆ・左", lambda: oni_brow(False), (289, 505)),
            ("brow_r", "まゆ・右", lambda: oni_brow(True),  (479, 505)),
            ("eye_l",  "め・左",  oni_eye,  (289, 595)),
            ("eye_r",  "め・右",  oni_eye,  (479, 595)),
            ("nose",   "はな",    oni_nose, (384, 695)),
            ("mouth",  "くち",    oni_mouth,(384, 838)),
        ],
    },
    "hajime/meru": {
        "label": "はじめ", "artist": "メル",
        "base": hajime_base,
        "parts": [
            ("brow_l", "まゆ・左", hajime_brow, (289, 500)),
            ("brow_r", "まゆ・右", hajime_brow, (479, 500)),
            ("eye_l",  "め・左",  hajime_eye,  (289, 585)),
            ("eye_r",  "め・右",  hajime_eye,  (479, 585)),
            ("nose",   "はな",    hajime_nose, (384, 680)),
            ("mouth",  "くち",    hajime_mouth,(384, 810)),
        ],
    },
}


SWAPS = {
    "example/okame": {"brow_l": "brow", "brow_r": "brow", "eye_l": "eye", "eye_r": "eye"},
    "example/oni": {"eye_l": "eye", "eye_r": "eye"},
}

def main():
    registry = {"groups": {
        "example": {"label": "サンプル", "cover": "example/okame"},
        "hajime": {"label": "はじめ", "cover": "hajime/meru"},
    }, "faces": []}
    for face_id, spec in FACES.items():
        outdir = os.path.join(ROOT, face_id)
        os.makedirs(outdir, exist_ok=True)
        spec["base"]().save(os.path.join(outdir, "base.png"))
        parts_json = []
        for pid, label, fn, (tx, ty) in spec["parts"]:
            img = fn()
            img.save(os.path.join(outdir, f"{pid}.png"))
            entry = {
                "id": pid, "label": label, "img": f"{pid}.png",
                "w": img.width, "h": img.height, "x": tx, "y": ty,
            }
            sw = SWAPS.get(face_id, {}).get(pid)
            if sw:
                entry["swap"] = sw
            parts_json.append(entry)
        face_json = {
            "label": spec["label"], "artist": spec["artist"],
            "base": "base.png", "width": W, "height": H,
            "tolerance": 0.22,
            "parts": parts_json,
        }
        with open(os.path.join(outdir, "face.json"), "w", encoding="utf-8") as f:
            json.dump(face_json, f, ensure_ascii=False, indent=2)
        registry["faces"].append({
            "id": face_id,
            "label": spec["label"],
            "artist": spec["artist"],
            "dir": f"face/{face_id}",
        })
        print("wrote", face_id)
    reg_path = os.path.join(ROOT, "..", "faces.json")
    with open(reg_path, "w", encoding="utf-8") as f:
        json.dump(registry, f, ensure_ascii=False, indent=2)
    print("wrote faces.json")

if __name__ == "__main__":
    main()
