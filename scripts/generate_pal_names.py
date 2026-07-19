#!/usr/bin/env python3
"""Generate frontend/src/data/pal-names.json from palworld.gg EN + zh-Hans lists.

Source of truth for Chinese names:
  https://palworld.gg/zh-Hans/pals?sort=index
English names / deck ids come from the same site's English page.
Rows are joined by shared palicon filename so index-less Yakushima pals still match.
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.request
from collections import Counter
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend/src/data/pal-names.json"

EN_URL = "https://palworld.gg/pals?sort=index"
ZH_URL = "https://palworld.gg/zh-Hans/pals?sort=index"

RARITY_LABELS = {
    "Common",
    "Rare",
    "Epic",
    "Legendary",
    "普通",
    "稀有",
    "史诗",
    "传奇",
}

# Community aliases kept for search; primary name_cn always comes from palworld.gg.
MANUAL_ALIASES: dict[str, list[str]] = {
    "Anubis": ["冥王犬"],
}

USER_AGENT = "pal-universe/1.0 (+https://github.com/JoeSmile/pal-universe)"


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read().decode("utf-8", errors="ignore")


def parse_cards(html: str) -> list[dict[str, str | None]]:
    cards = re.findall(r'<div class="pal">(.*?)</a></div>', html, re.S)
    rows: list[dict[str, str | None]] = []

    for card in cards:
        icon_match = re.search(r'src="([^"]*full_palicon/[^"]+)"', card)
        name_div = re.search(r'<div class="name">(.*?)</div>', card, re.S)
        if not name_div:
            continue

        inner = name_div.group(1)
        index_match = re.search(r'<span class="index">#([^<]+)</span>', inner)
        name = unescape(
            re.sub(
                r"<[^>]+>",
                "",
                re.sub(r'<span class="index">.*?</span>', "", inner),
            )
        ).strip()
        name = " ".join(name.split())
        if name in RARITY_LABELS:
            continue

        icon_key = None
        if icon_match:
            icon_key = unescape(icon_match.group(1)).rsplit("/", 1)[-1]

        rows.append(
            {
                "name": name,
                "id": index_match.group(1) if index_match else None,
                "icon": icon_key,
            }
        )

    return rows


def build_entries(en_rows: list[dict[str, str | None]], zh_rows: list[dict[str, str | None]]) -> list[dict[str, object]]:
    zh_by_icon = {row["icon"]: row for row in zh_rows if row["icon"]}
    if len(en_rows) != len(zh_by_icon):
        raise SystemExit(
            f"EN/ZH icon mismatch: en={len(en_rows)} zh_icons={len(zh_by_icon)}"
        )

    pals: list[dict[str, object]] = []
    for en in en_rows:
        icon = en["icon"]
        zh = zh_by_icon.get(icon)
        if zh is None:
            raise SystemExit(f"Missing ZH card for icon={icon} name={en['name']}")

        name = en["name"] or ""
        name_cn = zh["name"] or name
        entry: dict[str, object] = {
            "id": en["id"] or "",
            "name": name,
            "name_cn": name_cn,
        }
        aliases = MANUAL_ALIASES.get(name)
        if aliases:
            entry["aliases"] = aliases
        pals.append(entry)

    pals.sort(key=lambda item: (str(item["name"]).lower(), str(item["id"])))
    return pals


def validate(pals: list[dict[str, object]]) -> None:
    if len(pals) != 299:
        raise SystemExit(f"Expected 299 pals, got {len(pals)}")

    cn_counts = Counter(str(p["name_cn"]) for p in pals)
    collisions = {name: count for name, count in cn_counts.items() if count > 1}
    if collisions:
        raise SystemExit(f"Duplicate Chinese names: {collisions}")

    if any(p.get("id") == "None" for p in pals):
        raise SystemExit("Found literal id='None'")

    by_name = {str(p["name"]): p for p in pals}
    if by_name["Cattiva"]["name_cn"] != "捣蛋猫":
        raise SystemExit("Cattiva name_cn mismatch")
    if by_name["Ribbuny"]["name_cn"] != "姬小兔":
        raise SystemExit("Ribbuny name_cn mismatch")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--en-html",
        type=Path,
        help="Optional local EN HTML snapshot (skips network)",
    )
    parser.add_argument(
        "--zh-html",
        type=Path,
        help="Optional local ZH HTML snapshot (skips network)",
    )
    args = parser.parse_args()

    en_html = args.en_html.read_text(encoding="utf-8") if args.en_html else fetch(EN_URL)
    zh_html = args.zh_html.read_text(encoding="utf-8") if args.zh_html else fetch(ZH_URL)

    en_rows = parse_cards(en_html)
    zh_rows = parse_cards(zh_html)
    if len(en_rows) != 299 or len(zh_rows) != 299:
        raise SystemExit(f"Unexpected card counts en={len(en_rows)} zh={len(zh_rows)}")

    pals = build_entries(en_rows, zh_rows)
    validate(pals)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(pals, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(pals)} pals -> {OUT}")
    print(f"source: {ZH_URL}")


if __name__ == "__main__":
    main()
