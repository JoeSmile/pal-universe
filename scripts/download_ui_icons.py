#!/usr/bin/env python3
"""下载元素图标和工作图标到 frontend/public/images/ui/"""

import urllib.request
import ssl
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "frontend" / "public" / "images" / "ui"

ELEMENTS = {
    "ice": "T_Icon_element_s_08.png",
    "dark": "T_Icon_element_s_05.png",
    "dragon": "T_Icon_element_s_06.png",
    "ground": "T_Icon_element_s_07.png",
    "grass": "T_Icon_element_s_04.png",
    "electric": "T_Icon_element_s_03.png",
    "water": "T_Icon_element_s_02.png",
    "fire": "T_Icon_element_s_01.png",
    "neutral": "T_Icon_element_s_00.png",
}

WORKS = {
    "gathering": "T_icon_palwork_05.png",
    "cooling": "T_icon_palwork_10.png",
    "logging": "T_icon_palwork_06.png",
    "kindling": "T_icon_palwork_00.png",
    "generating": "T_icon_palwork_03.png",
    "handiwork": "T_icon_palwork_04.png",
    "mining": "T_icon_palwork_07.png",
    "farming": "T_icon_palwork_12.png",
    "extracting": "T_icon_palwork_09.png",
    "medicine": "T_icon_palwork_08.png",
    "planting": "T_icon_palwork_02.png",
    "transporting": "T_icon_palwork_11.png",
    "watering": "T_icon_palwork_01.png",
}

BASE = "https://palworld.gg/images/icons"
OUT.mkdir(parents=True, exist_ok=True)

ctx = ssl.create_default_context()
ok = 0

for name, filename in {**ELEMENTS, **WORKS}.items():
    url = f"{BASE}/{filename}"
    dest = OUT / f"{name}.png"
    if dest.exists() and dest.stat().st_size > 500:
        ok += 1
        continue
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            dest.write_bytes(resp.read())
        print(f"  ✅ {name} ({dest.stat().st_size//1024}KB)")
        ok += 1
    except Exception as e:
        print(f"  ❌ {name}: {e}")

print(f"\n🎉 完成: {ok}/{len(ELEMENTS)+len(WORKS)}")