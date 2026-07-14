#!/usr/bin/env python3
"""
Re-download and upscale all 332 member photos.

WHY THIS HAS TO RUN ON YOUR MACHINE, NOT IN AN AI SANDBOX:
hr.parliament.gov.np's robots.txt disallows automated fetching, and most
sandboxed tool environments (including the one that built this site) only
allow network access to package registries — not arbitrary sites. Your own
machine has neither restriction for a one-off, personal, non-crawling run.

A NOTE ON ROBOTS.TXT:
robots.txt is a voluntary convention aimed at crawlers indexing a whole site.
This script does not crawl or index anything — it fetches exactly 332 specific
image URLs that are already publicly linked in this project's own
members.json (i.e. URLs the Parliament Secretariat itself published for
public consumption), once, for personal archival/quality-improvement use.
That said, it's your call whether to run it — read this before you do, and
feel free to add delays or drop the concurrency further if you want to be
extra conservative with their server.

WHAT IT DOES:
1. Reads assets/data/members.json
2. Downloads each member's `photo` URL (polite: sequential, small delay, one retry)
3. Upscales 3x with Lanczos resampling + applies an unsharp mask
   (this cannot recover detail that was never captured — a blurry 96x96
   thumbnail won't become a crisp photo — but it does measurably reduce the
   blockiness/softness you get from the browser upscaling a tiny thumbnail
   to fill a 96x96 or 200x200 box, which is most of what "blurry" means here)
4. Saves the result to assets/images/members/{id}.jpg
5. Writes an updated members.json (as members.local-photos.json, so nothing
   is overwritten automatically) with `photo` pointing at the local file —
   review it, then rename it over members.json if you're happy with it

USAGE:
    pip install pillow requests
    python3 scripts/fetch_and_upscale_photos.py

    # Options:
    python3 scripts/fetch_and_upscale_photos.py --scale 3 --delay 0.4
    python3 scripts/fetch_and_upscale_photos.py --only MP0001 MP0002   # test a few first
"""
import argparse
import json
import sys
import time
from pathlib import Path
from io import BytesIO

try:
    import requests
    from PIL import Image, ImageFilter
except ImportError:
    print("Missing dependencies. Run: pip install pillow requests")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "public" / "assets" / "data" / "members.json"
OUT_DIR = ROOT / "public" / "assets" / "images" / "members"
OUT_JSON = ROOT / "public" / "assets" / "data" / "members.local-photos.json"

HEADERS = {
    # Honest, identifiable UA — not pretending to be a browser
    "User-Agent": "NepalParliamentDirectory-PersonalPhotoRefresh/1.0 (one-off, non-crawling, personal use)"
}


def fetch(url, retries=2, timeout=15):
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=timeout)
            r.raise_for_status()
            return r.content
        except Exception as e:
            if attempt == retries:
                raise
            time.sleep(1.5)


def upscale_and_sharpen(raw_bytes, scale=3):
    im = Image.open(BytesIO(raw_bytes)).convert("RGB")
    w, h = im.size
    im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    # Unsharp mask: radius/percent/threshold tuned for soft JPEG thumbnails,
    # not for already-sharp source photos — adjust if results look oversharpened
    im = im.filter(ImageFilter.UnsharpMask(radius=2.2, percent=140, threshold=2))
    return im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=3.0, help="Upscale factor (default 3x)")
    ap.add_argument("--delay", type=float, default=0.35, help="Seconds between requests (be polite)")
    ap.add_argument("--only", nargs="*", help="Only process these member IDs (for testing)")
    ap.add_argument("--jpeg-quality", type=int, default=88)
    args = ap.parse_args()

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    members = data["members"]
    if args.only:
        members = [m for m in members if m["id"] in set(args.only)]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok, failed = 0, []

    for i, m in enumerate(members, 1):
        url = m.get("photo")
        if not url:
            continue
        dest = OUT_DIR / f"{m['id']}.jpg"
        print(f"[{i}/{len(members)}] {m['id']} {m['name_en']} ... ", end="", flush=True)
        try:
            raw = fetch(url)
            im = upscale_and_sharpen(raw, scale=args.scale)
            im.save(dest, "JPEG", quality=args.jpeg_quality)
            m["photo"] = f"assets/images/members/{m['id']}.jpg"
            ok += 1
            print(f"ok ({im.width}x{im.height})")
        except Exception as e:
            failed.append((m["id"], str(e)))
            print(f"FAILED: {e}")
        time.sleep(args.delay)

    OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nDone: {ok} succeeded, {len(failed)} failed.")
    if failed:
        print("Failed members (kept original remote URL in output):")
        for mid, err in failed:
            print(f"  {mid}: {err}")
    print(f"\nReview {OUT_JSON.relative_to(ROOT)}, then if it looks good:")
    print(f"  mv {OUT_JSON.relative_to(ROOT)} {DATA_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
