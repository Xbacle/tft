Asset tools

1) download_assets.py
   Downloads Unit/Item/Trait/Augment assets and updates public/data/assets.json.

2) recolor_augment_icon.py
   Takes ONE original Riot/MetaTFT augment icon PNG as the only artwork source and
   generates Silver, Gold, and Diamond/Prismatic raster variants. The algorithm
   remaps luminance into the requested palette while preserving alpha, dark/black
   background pixels, gradients, highlights and shadow hierarchy. It does not use
   CSS masks or overlay layers.

Example:
python scripts/recolor_augment_icon.py path/to/t_augmenticon_pandorasitems.png --name t_augmenticon_pandorasitems
