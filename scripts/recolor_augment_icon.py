from __future__ import annotations

import argparse
import html
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urljoin

import requests
from PIL import Image

BASE_CDN = "https://cdn.metatft.com/file/metatft/augments/"
METATFT_AUGMENTS_PAGE = "https://www.metatft.com/augments"
DEFAULT_JSON = Path("public/data/Set18.json")
DEFAULT_OUTPUT = Path("public/assets/augments")

RARITY_ORDER = ("Silver", "Gold", "Prismatic")

PALETTES = {
    "Silver": [
        (68, 105, 127),
        (92, 140, 169),
        (167, 214, 239),
        (245, 253, 255),
        (255, 255, 255),
    ],
    "Gold": [
        (112, 65, 0),
        (199, 137, 0),
        (246, 181, 0),
        (255, 233, 106),
        (255, 248, 201),
        (255, 252, 224),
    ],
    "Prismatic": [
        (114, 86, 216),
        (148, 112, 242),
        (201, 140, 255),
        (246, 217, 255),
        (236, 255, 255),
        (255, 255, 255),
    ],
}

GLOW_COLORS = {
    "Silver": (143, 233, 255),
    "Gold": (255, 208, 0),
    "Prismatic": (184, 135, 255),
}

# MetaTFT/HTML can expose the exact CDN image through:
# <img class="AugmentTierIcon" src="..." id="DA_PandorasItemsIIListItem">
IMG_RE = re.compile(
    r'<img[^>]*class=["\'][^"\']*AugmentTierIcon[^"\']*["\'][^>]*>',
    re.IGNORECASE,
)
ATTR_RE = re.compile(r'\b(src|id|alt)=["\']([^"\']*)["\']', re.IGNORECASE)


def normalize_rarity(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    key = value.strip().lower()
    mapping = {
        "silver": "Silver",
        "gold": "Gold",
        "prismatic": "Prismatic",
        "diamond": "Prismatic",
    }
    return mapping.get(key)


def load_augments(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    augments = data.get("augments")
    if not isinstance(augments, list):
        raise ValueError("Set18.json không có mảng 'augments'.")
    return augments


def slugify(value: str) -> str:
    value = re.sub(r"['’]", "", value.lower())
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def fetch_metatft_image_map(session: requests.Session, timeout: int) -> dict[str, str]:
    """Try to obtain exact MetaTFT CDN URLs keyed by augment apiName.

    We deliberately use the page only to discover the exact original image URL.
    The actual rarity transformation is always performed locally from that PNG.
    """
    try:
        response = session.get(
            METATFT_AUGMENTS_PAGE,
            timeout=timeout,
            headers={"User-Agent": "Mozilla/5.0 TFT_18_HELPER asset tool"},
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"[WARN] Không lấy được MetaTFT augment page: {exc}")
        return {}

    mapping: dict[str, str] = {}
    for match in IMG_RE.finditer(response.text):
        tag = match.group(0)
        attrs = dict(ATTR_RE.findall(tag))
        api_id = attrs.get("id")
        src = attrs.get("src")
        if not api_id or not src:
            continue
        if api_id.endswith("ListItem"):
            api_name = api_id[: -len("ListItem")]
            mapping[api_name] = html.unescape(urljoin("https://www.metatft.com", src))

    print(f"[INFO] MetaTFT discovered {len(mapping)} augment image mappings")
    return mapping


def candidate_urls(augment: dict, exact_map: dict[str, str]) -> list[str]:
    api_name = augment.get("apiName") or ""
    icon = augment.get("icon") or ""
    name = augment.get("name") or ""
    candidates: list[str] = []

    exact = exact_map.get(api_name)
    if exact:
        candidates.append(exact)

    if icon:
        candidates.append(urljoin(BASE_CDN, icon.lower() + ".png"))

    if name:
        slug = slugify(name)
        rarity = normalize_rarity(augment.get("rarity"))
        suffix_map = {"Silver": "-i", "Gold": "-ii", "Prismatic": "-iii"}
        if slug and rarity:
            candidates.append(urljoin(BASE_CDN, slug + suffix_map[rarity] + ".png"))
        if slug:
            candidates.append(urljoin(BASE_CDN, slug + ".png"))

    # De-duplicate while preserving priority.
    seen = set()
    out = []
    for u in candidates:
        if u not in seen:
            out.append(u)
            seen.add(u)
    return out


def download_bytes(session: requests.Session, url: str, timeout: int, retries: int = 3) -> bytes | None:
    for attempt in range(1, retries + 1):
        try:
            response = session.get(
                url,
                timeout=timeout,
                headers={"User-Agent": "Mozilla/5.0 TFT_18_HELPER asset tool"},
            )
            if response.status_code == 404:
                return None
            if response.status_code in (429, 500, 502, 503, 504):
                if attempt < retries:
                    continue
            response.raise_for_status()
            return response.content
        except requests.RequestException as exc:
            if attempt == retries:
                print(f"[WARN] Download failed: {url} -> {exc}")
    return None


def srgb_to_linear(value: float) -> float:
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def linear_to_srgb(value: float) -> float:
    return 12.92 * value if value <= 0.0031308 else 1.055 * (value ** (1 / 2.4)) - 0.055


def luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = (srgb_to_linear(c / 255.0) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def palette_at(palette: list[tuple[int, int, int]], t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    if len(palette) == 1:
        return palette[0]
    pos = t * (len(palette) - 1)
    i = min(int(pos), len(palette) - 2)
    local = pos - i
    a, b = palette[i], palette[i + 1]
    return tuple(round(a[c] + (b[c] - a[c]) * local) for c in range(3))


def remap_pixel(rgb: tuple[int, int, int], rarity: str) -> tuple[int, int, int]:
    lum = luminance(rgb)
    # Use luminance to choose the target color, then rescale it so the perceived
    # light/dark structure of the original artwork survives.
    target = palette_at(PALETTES[rarity], lum)
    target_lum = max(luminance(target), 1e-6)
    ratio = lum / target_lum if lum > 0 else 0.0
    out = []
    for c in target:
        linear = srgb_to_linear(c / 255.0) * ratio
        encoded = max(0.0, min(1.0, linear_to_srgb(max(0.0, min(1.0, linear)))))
        out.append(round(encoded * 255))
    return tuple(out)


def remap_image(source: Image.Image, rarity: str, size: int = 1024) -> Image.Image:
    src = source.convert("RGBA")
    # Preserve geometry; fit inside a transparent 1024x1024 canvas rather than cropping.
    scale = min(size / src.width, size / src.height)
    if scale != 1 or src.size != (size, size):
        new_size = (max(1, round(src.width * scale)), max(1, round(src.height * scale)))
        src = src.resize(new_size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    left = (size - src.width) // 2
    top = (size - src.height) // 2
    canvas.alpha_composite(src, (left, top))

    pixels = canvas.load()
    glow = GLOW_COLORS[rarity]
    for y in range(size):
        for x in range(size):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            # Pure black stays pure black, as requested.
            if max(r, g, b) <= 2:
                pixels[x, y] = (0, 0, 0, a)
                continue

            mapped = remap_pixel((r, g, b), rarity)

            # Keep the original alpha and blend a very small amount of the
            # rarity glow into already bright emissive pixels only. This is
            # still a per-pixel recolor, not an overlay layer or a gradient.
            lum = luminance((r, g, b))
            glow_mix = max(0.0, min(0.22, (lum - 0.82) * 0.45))
            if glow_mix:
                mapped = tuple(
                    round(mapped[i] * (1 - glow_mix) + glow[i] * glow_mix)
                    for i in range(3)
                )
            pixels[x, y] = (*mapped, a)

    # No blur, mask, or frame is added. The original alpha/silhouette remains.
    return canvas


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def choose_source_url(augment: dict, exact_map: dict[str, str], session: requests.Session, timeout: int) -> tuple[str | None, bytes | None]:
    for url in candidate_urls(augment, exact_map):
        payload = download_bytes(session, url, timeout)
        if payload:
            try:
                Image.open(__import__("io").BytesIO(payload)).verify()
            except Exception:
                continue
            return url, payload
    return None, None


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Tự đọc Set18.json, tìm tất cả augment + rarity, tự tìm/tải icon gốc "
            "và tạo Silver/Gold/Prismatic bằng remap luminance. Không cần chỉ định từng file."
        )
    )
    parser.add_argument("--json", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument("--size", type=int, default=1024)
    parser.add_argument("--dry-run", action="store_true", help="Chỉ phân tích, không tải/tạo ảnh")
    args = parser.parse_args()

    augments = load_augments(args.json)
    groups: dict[str, list[dict]] = defaultdict(list)
    for aug in augments:
        icon = aug.get("icon")
        rarity = normalize_rarity(aug.get("rarity"))
        if not icon or not rarity:
            continue
        groups[icon].append(aug)

    print(f"[INFO] Augments in JSON: {len(augments)}")
    print(f"[INFO] Unique icon groups: {len(groups)}")
    print(
        "[INFO] Rarity counts: "
        + ", ".join(f"{r}={sum(1 for a in augments if normalize_rarity(a.get('rarity')) == r)}" for r in RARITY_ORDER)
    )

    session = requests.Session()
    exact_map = fetch_metatft_image_map(session, args.timeout) if not args.dry_run else {}

    manifest: dict = {
        "source": "MetaTFT CDN / discovered from MetaTFT augment page",
        "json": str(args.json).replace("\\", "/"),
        "augmentIcons": {},
        "rarityVariants": {r: [] for r in RARITY_ORDER},
        "missing": [],
    }

    processed = 0
    generated = Counter()
    missing = 0

    for index, (icon, items) in enumerate(sorted(groups.items()), start=1):
        rarities = sorted(
            {normalize_rarity(a.get("rarity")) for a in items if normalize_rarity(a.get("rarity"))},
            key=RARITY_ORDER.index,
        )
        representative = items[0]
        api_names = [a.get("apiName") for a in items if a.get("apiName")]
        display_names = [a.get("name") for a in items if a.get("name")]

        print(f"[{index:03d}/{len(groups):03d}] {icon} | {'/'.join(rarities)}")

        record = {
            "icon": icon,
            "augmentIds": api_names,
            "names": display_names,
            "rarities": rarities,
            "sourceUrl": None,
            "original": None,
            "variants": {},
        }

        if args.dry_run:
            manifest["augmentIcons"][icon] = record
            continue

        source_url, payload = choose_source_url(representative, exact_map, session, args.timeout)
        if not payload or not source_url:
            missing += 1
            record["error"] = "No source icon found"
            manifest["missing"].append(record)
            manifest["augmentIcons"][icon] = record
            print("      -> MISSING source image")
            continue

        source_path = args.output_dir / "original" / f"{icon.lower()}.png"
        source_image = Image.open(__import__("io").BytesIO(payload)).convert("RGBA")
        save_png(source_image.resize((args.size, args.size), Image.Resampling.LANCZOS) if source_image.size != (args.size, args.size) else source_image, source_path)
        record["sourceUrl"] = source_url
        record["original"] = str(source_path).replace("\\", "/")

        for rarity in rarities:
            out_path = args.output_dir / "rarity" / rarity / f"{icon.lower()}.png"
            out_image = remap_image(source_image, rarity, args.size)
            save_png(out_image, out_path)
            rel = str(out_path).replace("\\", "/")
            record["variants"][rarity] = rel
            manifest["rarityVariants"][rarity].append(rel)
            generated[rarity] += 1

        manifest["augmentIcons"][icon] = record
        processed += 1

    manifest_path = args.output_dir.parent.parent / "data" / "augment_assets.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print("\n=== DONE ===")
    print(f"Processed icon groups : {processed}")
    print(f"Missing source icons  : {missing}")
    for rarity in RARITY_ORDER:
        print(f"Generated {rarity:10}: {generated[rarity]}")
    print(f"Manifest              : {manifest_path}")
    if missing:
        print("[WARN] Các icon thiếu được ghi vào manifest.missing để xử lý riêng.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
