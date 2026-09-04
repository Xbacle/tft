#!/usr/bin/env python3
"""Validate the three runtime data files without changing them."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public" / "data"


def load(name: str):
    with (DATA / name).open("r", encoding="utf-8") as fh:
        return json.load(fh)


def main() -> None:
    set18 = load("Set18.json")
    comps = load("comps.json")
    processed = load("items_processed.json")

    units = set18.get("units", [])
    traits = set18.get("traits", [])
    items = set18.get("items", [])
    augments = set18.get("augments", [])
    shop_units = [u for u in units if u.get("shopUnit") is True]
    clusters = comps.get("results", {}).get("data", {}).get("cluster_details", {})

    print("Set data")
    print(f"  units: {len(units)} (shop units: {len(shop_units)})")
    print(f"  traits: {len(traits)}")
    print(f"  items: {len(items)}")
    print(f"  augments: {len(augments)}")
    print(f"  charms: {len(set18.get('charms', []))}")
    print(f"  encounters: {len(set18.get('encounters', []))}")
    print("Comp data")
    print(f"  clusters: {len(clusters)}")
    print(f"  updated: {comps.get('updated')}")
    print("Performance data")
    print(f"  unit records: {len(processed.get('units', {}))}")
    print(f"  item records: {len(processed.get('itemNames', {}))}")
    print(f"  updated: {processed.get('updated')}")

    required_top = {
        "set": {"units", "traits", "items", "augments"},
        "comps": {"results"},
        "processed": {"units", "itemNames"},
    }
    missing = []
    for label, obj, required in [
        ("Set18.json", set18, required_top["set"]),
        ("comps.json", comps, required_top["comps"]),
        ("items_processed.json", processed, required_top["processed"]),
    ]:
        for key in required:
            if key not in obj:
                missing.append(f"{label}: missing {key}")
    if missing:
        raise SystemExit("\n".join(missing))
    print("Validation: OK")


if __name__ == "__main__":
    main()
