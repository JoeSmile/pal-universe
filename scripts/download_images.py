#!/usr/bin/env python3
"""
Pal Universe — 图片资源下载脚本

从 palworld-kb 的 icons.json 中读取图片 URL，下载到本地。
源数据: ~/Desktop/github/palworld-kb/data/icons.json
"""

import json
import os
import sys
import urllib.request
import ssl
from pathlib import Path

DATA_SOURCE = Path(os.environ.get("PALWORLD_DATA", Path.home() / "Desktop" / "github" / "palworld-kb" / "data"))
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public" / "images"
def download(url: str, dest: Path, name: str) -> bool:
    """下载一张图片，已存在则跳过。失败时生成 SVG 占位图。"""
    ext = Path(url).suffix or ".webp"
    dest = OUTPUT_DIR / "pals" / f"{name}{ext}"
    if dest.exists() and dest.stat().st_size > 500:
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        ctx = ssl.create_default_context()
        req = urllib.request.Request(url, headers={"User-Agent": "PalUniverse/1.0", "Referer": "https://paldb.cc/"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = resp.read()
        if len(data) < 200:
            return _make_placeholder(dest, name)
        with open(dest, "wb") as f:
            f.write(data)
        print(f"  ✅ {name} ({len(data)//1024}KB)")
        return True
    except urllib.error.HTTPError as e:
        return _make_placeholder(dest.with_suffix(".svg"), name, f"HTTP {e.code}")
    except Exception as e:
        return _make_placeholder(dest.with_suffix(".svg"), name, str(e))


def _make_placeholder(dest: Path, name: str, reason: str = "") -> bool:
    """生成 SVG 占位图。文件名不变扩展名，内容改为 SVG。"""
    short = name[:10]
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="8" fill="#1e2030"/>
  <rect x="32" y="32" width="64" height="64" rx="32" fill="#2a2d4a"/>
  <text x="64" y="68" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#64748b">{short}</text>
</svg>'''
    dest.write_text(svg)
    print(f"  🔲 {name} → 占位图")
    return True


def download_pals(icons: dict) -> tuple[int, int]:
    """下载所有帕鲁图标"""
    pals = icons.get("pals", {})
    ok = 0
    for name, url in pals.items():
        ext = Path(url).suffix or ".webp"
        dest = OUTPUT_DIR / "pals" / f"{name}{ext}"
        if download(url, dest, name):
            ok += 1
    return ok, len(pals)


def main():
    icons_file = DATA_SOURCE / "icons.json"
    if not icons_file.exists():
        print(f"❌ 找不到 icons.json: {icons_file}")
        sys.exit(1)

    with open(icons_file) as f:
        icons = json.load(f)

    pals_total = len(icons.get("pals", {}))
    print(f"📥 下载帕鲁图标 ({pals_total} 张)")
    pals_ok, pals_all = download_pals(icons)
    print(f"\n🎉 完成: {pals_ok}/{pals_all} 图片已下载到 {OUTPUT_DIR / 'pals/'}")
    return 0 if pals_ok > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
