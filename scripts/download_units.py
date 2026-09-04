"""Backward-compatible wrapper for the old unit-only downloader."""
import subprocess
import sys

raise SystemExit(subprocess.call([sys.executable, "scripts/download_assets.py", "--only", "units", *sys.argv[1:]]))
