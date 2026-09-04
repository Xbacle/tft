from __future__ import annotations

import argparse
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

import requests

BASE_URL = "https://cdn.metatft.com/file/metatft"


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def lower_filename(value: str) -> str:
    return f"{str(value).strip().lower()}.png"


def slugify(value: str) -> str:
    value = value.lower().strip().replace("&", " and ")
    value = re.sub(r"['’]", "", value)
    value = re.sub(r"\+", " plus ", value)
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def is_playable_unit(unit: dict[str, Any]) -> bool:
    return unit.get("shopUnit") is True


def request_download(url: str, target: Path, force: bool, retries: int = 3) -> tuple[bool, int | str]:
    if target.exists() and target.stat().st_size > 0 and not force:
        return True, "exists"
    target.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, timeout=25, headers={"User-Agent": "TFT_18_HELPER asset downloader"})
            if response.status_code == 200 and response.content:
                target.write_bytes(response.content)
                return True, 200
            if response.status_code == 404:
                return False, 404
            if response.status_code in {429, 500, 502, 503, 504} and attempt < retries:
                time.sleep(attempt * 1.5)
                continue
            return False, response.status_code
        except requests.RequestException as exc:
            if attempt < retries:
                time.sleep(attempt * 1.5)
                continue
            return False, str(exc)
    return False, "unknown"


def unit_records(set_data: dict[str, Any]) -> list[dict[str, Any]]:
    records = []
    for unit in set_data.get("units", []):
        if not is_playable_unit(unit):
            continue
        api = unit.get("apiName")
        if not api:
            continue
        filename = lower_filename(api)
        for folder, kind in (("champions", "icon"), ("championsplashes", "splash")):
            records.append({
                "category": "units", "key": api, "kind": kind,
                "name": unit.get("name") or api,
                "url": f"{BASE_URL}/{folder}/{filename}",
                "local": f"/assets/units/{folder}/{filename}",
                "target": Path("public/assets/units") / folder / filename,
            })
    return records


def item_records(set_data: dict[str, Any]) -> list[dict[str, Any]]:
    records = []
    for item in set_data.get("items", []):
        api = item.get("apiName") or item.get("id")
        if not api:
            continue
        filename = lower_filename(api)
        records.append({
            "category": "items", "key": api, "kind": "icon",
            "name": item.get("name") or api,
            "url": f"{BASE_URL}/items/{filename}",
            "local": f"/assets/items/{filename}",
            "target": Path("public/assets/items") / filename,
            "radiant": any("radiant" in str(tag).lower() for tag in (item.get("itemTags") or []) + (item.get("tags") or [])),
        })
    return records


def trait_records(set_data: dict[str, Any]) -> list[dict[str, Any]]:
    records = []
    for trait in set_data.get("traits", []):
        api = trait.get("apiName")
        if not api:
            continue
        filename = lower_filename(api)
        records.append({
            "category": "traits", "key": api, "kind": "icon",
            "name": trait.get("name") or api,
            "url": f"{BASE_URL}/traits/{filename}",
            "local": f"/assets/traits/{filename}",
            "target": Path("public/assets/traits") / filename,
        })
    return records


def augment_candidates(augment: dict[str, Any]) -> list[str]:
    candidates: list[str] = []
    icon = str(augment.get("icon") or "").strip()
    if icon:
        # This is the most reliable MetaTFT pattern for the sample HTML provided by the user.
        candidates.append(lower_filename(icon))
    slug = slugify(augment.get("name") or augment.get("en_name") or "")
    if slug:
        candidates.extend([f"{slug}.png", f"{slug}-i.png", f"{slug}-ii.png", f"{slug}-iii.png"])
    return list(dict.fromkeys(candidates))


def augment_records(set_data: dict[str, Any]) -> list[dict[str, Any]]:
    records = []
    for augment in set_data.get("augments", []):
        api = augment.get("apiName")
        if not api:
            continue
        records.append({
            "category": "augments", "key": api, "kind": "icon",
            "name": augment.get("name") or api,
            "rarity": augment.get("rarity"),
            "candidates": augment_candidates(augment),
        })
    return records


def build_manifest(set_data: dict[str, Any]) -> dict[str, Any]:
    manifest = {
        "version": 2,
        "source": BASE_URL,
        "units": {},
        "items": {},
        "traits": {},
        "augments": {},
        "shared": {},
    }
    for record in unit_records(set_data):
        manifest["units"].setdefault(record["key"], {})[record["kind"]] = {
            "url": record["url"], "local": record["local"], "status": "not_downloaded"
        }
    for record in item_records(set_data):
        manifest["items"][record["key"]] = {
            "icon": {"url": record["url"], "local": record["local"], "status": "not_downloaded"},
            "radiant": record["radiant"],
        }
    for record in trait_records(set_data):
        manifest["traits"][record["key"]] = {
            "icon": {"url": record["url"], "local": record["local"], "status": "not_downloaded"}
        }
    for record in augment_records(set_data):
        manifest["augments"][record["key"]] = {
            "icon": {"url": None, "local": None, "status": "not_downloaded", "candidates": record["candidates"]},
            "rarity": record.get("rarity"),
        }
    return manifest


def update_manifest(manifest: dict[str, Any], record: dict[str, Any], status: int | str, url: str | None = None, local: str | None = None) -> None:
    if record["category"] == "units":
        entry = manifest["units"][record["key"]][record["kind"]]
    elif record["category"] == "items":
        entry = manifest["items"][record["key"]]["icon"]
    elif record["category"] == "traits":
        entry = manifest["traits"][record["key"]]["icon"]
    else:
        entry = manifest["augments"][record["key"]]["icon"]
    entry["status"] = status
    if url is not None:
        entry["url"] = url
    if local is not None:
        entry["local"] = local


def download_standard(record: dict[str, Any], force: bool) -> tuple[bool, int | str, str | None, str | None]:
    ok, status = request_download(record["url"], record["target"], force)
    return ok, status, record["url"] if ok else None, record["local"] if ok else None


def download_augment(record: dict[str, Any], force: bool) -> tuple[bool, int | str, str | None, str | None]:
    for filename in record.get("candidates", []):
        url = f"{BASE_URL}/augments/{filename}"
        target = Path("public/assets/augments") / filename
        local = f"/assets/augments/{filename}"
        ok, status = request_download(url, target, force)
        if ok:
            return True, status, url, local
        if status != 404:
            return False, status, None, None
    return False, 404, None, None


def run(records: list[dict[str, Any]], manifest: dict[str, Any], force: bool, workers: int) -> tuple[int, int, int]:
    success = skipped = failed = 0
    with ThreadPoolExecutor(max_workers=max(1, workers)) as executor:
        futures = {}
        for record in records:
            worker = download_augment if record["category"] == "augments" else download_standard
            futures[executor.submit(worker, record, force)] = record
        for index, future in enumerate(as_completed(futures), 1):
            record = futures[future]
            ok, status, url, local = future.result()
            if ok:
                success += 1
                if status == "exists": skipped += 1
            else:
                failed += 1
            update_manifest(manifest, record, status, url, local)
            state = "OK" if ok else "FAIL"
            print(f"[{index:>3}/{len(records)}] {record['category']:<8} {record['key']:<42} {state:<4} {status}")
    return success, skipped, failed


def main() -> int:
    parser = argparse.ArgumentParser(description="Download TFT Set 18 assets and build public/data/assets.json")
    parser.add_argument("--json", default="public/data/Set18.json")
    parser.add_argument("--output", default="public/data/assets.json")
    parser.add_argument("--only", choices=["all", "units", "items", "traits", "augments"], default="all")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--optimize", action="store_true", help="Create lightweight WebP derivatives after downloading")
    args = parser.parse_args()

    root = Path.cwd()
    data = load_json(root / args.json)
    manifest = build_manifest(data)

    builders = {
        "units": unit_records,
        "items": item_records,
        "traits": trait_records,
        "augments": augment_records,
    }
    if args.only == "all":
        records = [record for key in builders for record in builders[key](data)]
    else:
        records = builders[args.only](data)

    print(f"Entities: units={len(data.get('units', []))}, items={len(data.get('items', []))}, traits={len(data.get('traits', []))}, augments={len(data.get('augments', []))}")
    print(f"Playable shop units: {sum(is_playable_unit(u) for u in data.get('units', []))}")
    print(f"Download queue: {len(records)}")

    success, skipped, failed = run(records, manifest, args.force, args.workers)
    output = root / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDone. success={success}, skipped={skipped}, failed={failed}")
    print(f"Manifest: {output}")
    if args.optimize:
        import subprocess, sys
        subprocess.run([sys.executable, str(root / "scripts/optimize_assets.py")], check=False)
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
