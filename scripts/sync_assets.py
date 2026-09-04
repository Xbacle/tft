from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def run(script: str, extra: list[str]) -> int:
    cmd = [sys.executable, str(ROOT / 'scripts' / script), *extra]
    print('\n$ ' + ' '.join(cmd))
    return subprocess.run(cmd, cwd=ROOT).returncode


def main() -> int:
    parser = argparse.ArgumentParser(description='Download, optimize and recolor TFT Set 18 assets from the current JSON.')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--workers', type=int, default=8)
    args = parser.parse_args()
    download_args = ['--workers', str(args.workers), '--optimize']
    if args.force:
        download_args.append('--force')
    code = run('download_assets.py', download_args)
    if code:
        return code
    code = run('recolor_augment_icon.py', [])
    if code:
        return code
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
