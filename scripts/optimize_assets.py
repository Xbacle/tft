from __future__ import annotations

import argparse
from pathlib import Path
from PIL import Image
import json

IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.webp'}


def save_webp(src: Path, dst: Path, max_size: int, quality: int):
    with Image.open(src) as image:
        image = image.convert('RGBA')
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        dst.parent.mkdir(parents=True, exist_ok=True)
        image.save(dst, 'WEBP', quality=quality, method=6)


def main() -> int:
    p = argparse.ArgumentParser(description='Create lightweight WebP derivatives for TFT assets.')
    p.add_argument('--root', default='public/assets')
    p.add_argument('--force', action='store_true')
    p.add_argument('--quality', type=int, default=84)
    args = p.parse_args()
    root = Path(args.root)
    if not root.exists():
        print(f'Asset root not found: {root}')
        return 1
    count = 0
    for src in root.rglob('*'):
        if not src.is_file() or src.suffix.lower() not in IMAGE_EXTS:
            continue
        if 'optimized' in src.parts or 'thumbs' in src.parts:
            continue
        if src.suffix.lower() == '.webp':
            continue
        rel = src.relative_to(root)
        parts = rel.parts
        if 'units' in parts and 'championsplashes' in parts:
            max_size = 768
            out = root / 'units' / 'optimized' / rel.name
        elif 'units' in parts:
            max_size = 256
            out = root / 'units' / 'thumbs' / rel.with_suffix('.webp').name
        elif 'items' in parts or 'traits' in parts or 'augments' in parts:
            max_size = 256
            out = root / parts[0] / 'optimized' / rel.name
        else:
            continue
        out = out.with_suffix('.webp')
        if out.exists() and not args.force:
            continue
        save_webp(src, out, max_size, args.quality)
        count += 1
        print(f'{src} -> {out}')
    manifest_path = root.parent / 'data' / 'assets.json'
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
            for section in ('units', 'items', 'traits', 'augments'):
                for key, entry in manifest.get(section, {}).items():
                    for slot in ('icon', 'splash'):
                        node = entry.get(slot) if isinstance(entry, dict) else None
                        if not isinstance(node, dict):
                            continue
                        local = node.get('local')
                        if not local:
                            continue
                        local_path = Path(local.lstrip('/'))
                        png_path = root.parent.parent / local_path
                        if section == 'units' and slot == 'icon':
                            candidate = root / 'units' / 'thumbs' / Path(local).stem
                            optimized = candidate.with_suffix('.webp')
                        elif section == 'units' and slot == 'splash':
                            candidate = root / 'units' / 'optimized' / Path(local).name
                            optimized = candidate.with_suffix('.webp')
                        else:
                            optimized = root / section / 'optimized' / Path(local).name
                            optimized = optimized.with_suffix('.webp')
                        if optimized.exists():
                            # Đường dẫn web tính từ thư mục public/ (root.parent), KHÔNG gồm tiền tố "public".
                            node['optimized'] = '/' + str(optimized.relative_to(root.parent)).replace('\\','/')
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
            print(f'Updated manifest: {manifest_path}')
        except Exception as exc:
            print(f'Warning: could not update manifest: {exc}')
    print(f'Optimized assets: {count}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
