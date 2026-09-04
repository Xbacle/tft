# TFT_18_HELPER – JSON data analysis

## 1. Source-of-truth files

The application reads four JSON resources:

- `Set18.json`: the primary Set 18 game data.
- `comps.json`: composition clusters and statistics.
- `items_processed.json`: processed unit/item statistics used for recommendations.
- `assets.json`: generated local-asset manifest; it does **not** modify the original TFT data.

The original TFT dataset contains top-level collections for `units`, `traits`, `items`, `augments`, `armory_items`, `charms`, `encounters`, `unitAssetNames`, `extras`, `augmentTiers`, `roles`, `roleData` and `_metadata`.

## 2. What counts as a Unit

`Set18.json.units` contains 81 entities, not 81 playable champions. The project defines a playable Unit as:

```js
unit.shopUnit === true
```

This currently produces 65 shop-purchasable units. Summons, monsters and special entities remain available through the repository's `getAllUnits()` / `getOtherUnits()` APIs but are excluded from `/units`.

This rule is intentionally kept in the repository so every feature (UI, relations and asset downloader) uses the same definition.

## 3. Unit fields used by the UI

Playable units expose enough data for a rich detail page:

- `name`, `apiName`, `characterName`
- `cost`, `shopTier`, `poolCount`, `shopUnit`
- `traits`, `traitApiNames`
- `role`, `roleTags`
- `stats`: HP, armor, magic resist, attack damage, attack speed, range, mana, crit chance, crit multiplier, etc.
- `ability`: name, description, icon, `attributeValues`, `attributeCalcs`, curve data
- `skin`, `recommendedItems`
- `curveValues`, `curveTable`, `attributeValues`, `attributeCalcs`

The UI displays all non-null core stats and the full available curve rows instead of only the short tooltip sentence.

## 4. Tooltip values are not missing text

TFT descriptions often contain placeholders such as:

```text
<TFTCurveTable row="Damage" />
<TFTCurveTable row="Duration" format="percent" />
<TFTAttribute attributeID="TFTCalculationAttributes.MagicDamageCalc1" />
```

The real numeric data is stored beside the description in `curveValues`, `curveTable`, `attributeValues` and `attributeCalcs`.

`src/utils/tftText.js` resolves those placeholders before rendering and also exposes a separate table of the full curve values. This is why the website can show exact damage, duration, percentages, mana values and similar numbers without hard-coding them.

## 5. Traits

Traits use:

- `desc`
- `effects` for breakpoint bounds
- `units` for related playable units
- `curveValues` / `curveTable` for numerical effects
- `icon`
- `type`
- `effectsSource`

The previous decorative `traits/base.png` background is deliberately not used. Trait cards now focus on the icon, name, description and unit count.

## 6. Items

Items provide both normal and Radiant variants.

Useful fields:

- `name`, `apiName`, `id`
- `desc`, `statLine`
- `composition`
- `from`, `upgrade`
- `unique`
- `associatedTraits`, `incompatibleTraits`
- `effects`
- `tags`, `itemTags`
- `overlays`
- `curveValues`, `curveTable`

Radiant items can be recognized from the Radiant overlay/tag data and receive a separate gold visual treatment in the UI.

`composition`, `from`, `upgrade`, associated traits and incompatible traits are resolved back into real entities so the interface does not expose raw JSON identifiers.

## 7. Augments and tier handling

There are 259 augment records.

An augment has:

- `apiName`, `name`, `desc`
- `icon`
- `rarity`: Silver, Gold or Prismatic
- `roundVariants`, `rounds`
- `type`, `unique`
- `tags`, `manual_tags`
- `associatedTraits`, `incompatibleTraits`
- `effects`
- `curveValues`, `curveTable`

The same icon can intentionally be shared by multiple rarity variants. The project therefore does not invent filenames such as `-i`, `-ii`, or `-iii` when the source JSON uses one shared `icon`.

The augment icon is rendered as a CSS mask so the same alpha silhouette can be filled with tier-specific gradients and glow:

- Original: `#FF00FF → #FF66FF`, blue neon glow `#0000FF`
- Silver: `#D6F6FF → #A8DFF2 → #6EA8C6`, glow `#6EA8C6`
- Gold: `#FFF176 → #FFD600 → #B88600`, glow `#FFD600`
- Prismatic: `#EFFFFF → #D4C1FF → #FFB3FF`, glow `#A78BFA`

No extra frame is added around the icon.

## 8. Composition data

`comps.json` stores cluster data rather than friendly names. Fields such as `units_string`, `traits_string`, `name_string`, `name`, `builds`, `overall` and `trends` are used together.

The UI derives a readable composition label from:

1. the highest-scoring unit in `name` (carry candidate),
2. the highest-scoring trait in `name`,
3. a frontline candidate from the build list using role tags,
4. the resolved unit/trait names.

Example output style:

```text
Yunara Carry · Alistar Frontline
Executioner core · 8 unique units
```

This avoids exposing identifiers such as `DA_18_Yunara` to players.

## 9. Relationship resolution

The repository resolves IDs between data sources without modifying JSON. Common patterns include:

- `DA_18_X` ↔ `TFT18_X`
- item composition IDs → component item records
- item `from` / `upgrade` → item records
- trait `units[].unit` → playable unit records
- comp `units_string` → playable units
- comp `traits_string` → traits
- processed item/unit statistics → their corresponding Set 18 records

## 10. Asset manifest

`public/data/assets.json` contains only asset metadata:

- remote CDN URL
- local asset URL
- download status
- augment rarity
- Radiant marker for items

It is intentionally separate from the Riot JSON so the source-of-truth game data remains untouched.

## 11. Asset downloader rules

`scripts/download_assets.py` uses the same `shopUnit === true` rule for units.

It downloads:

- Unit icons and splashes
- Item icons
- Trait icons
- Augment icons

Augment lookup first tries the exact Riot icon identifier converted to lowercase, then safe slug fallbacks. The script records unresolved assets instead of fabricating an image path.
