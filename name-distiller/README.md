# name-distiller

A small Node tool that maps GTA V clothing **drawable IDs** to human-readable
names — the companion to the in-game dumper one folder up.

The [in-game dumper](../README.md) tells you *what* drawables exist in a given
game build (`tops_0`, `tops_1`, …). This tool tells you what each one is
*called* ("Crew T-Shirt", "Silver Stripe Leather Jacket"), by fetching the
community-maintained
[root-cause/v-clothingnames](https://github.com/root-cause/v-clothingnames)
dataset and distilling it into compact per-gender lookup maps.

## Output

```
names/male.json
names/female.json
```

Each is a flat `slot → drawableId → name` map:

```jsonc
{
  "tops": {
    "0": "Crew T-Shirt",
    "6": "Silver Stripe Leather Jacket"
  },
  "masks": { "0": "Skull Bandana" }
  // undershirts, torsos, legs, shoes, accessories,
  // hats, glasses, ears, watches, bracelets …
}
```

Joining the two tools is then trivial — for each entry in a dump, look up
`names[slot][drawable]` to get its label.

## Usage

Requires **Node 18+** (uses global `fetch` and top-level `await`).

```bash
npm run dump
# or
node build-clothing-names.mjs
```

It downloads the source files, prints a per-slot summary, and writes the two
JSON files. The output path is resolved relative to the script, so it runs
correctly from any working directory.

```
Building male…
  male/tops: 466 named
  …
  → names/male.json (1742 names)
Building female…
  …
Done — 3561 clothing names across 2 genders.
```

## How it works

1. **Map slots to source files.** The upstream repo splits its data across files
   using three naming conventions, normalised in one place:

   | Slot kind  | Slots                                               | File pattern                 |
   | ---------- | --------------------------------------------------- | ---------------------------- |
   | Components | tops, undershirts, torsos, legs, shoes, accessories | `{gender}_{slot}.json`       |
   | Props      | hats, glasses, ears, watches, bracelets             | `props_{gender}_{slot}.json` |
   | Masks      | masks                                               | `masks_{gender}.json`        |

2. **Fetch in parallel.** All slots for a gender download concurrently
   (`Promise.all`) instead of one request at a time.

3. **Distill.** Each source maps `drawableId → { textureId → { Localized, … } }`.
   The script keeps the first texture variant with a usable localized label,
   collapsing it to `drawableId → "Name"` and dropping unnamed drawables.

4. **Sort and write.** Drawable IDs are sorted numerically, so re-running
   produces clean, reviewable diffs instead of reshuffled keys.

## Caveat: global-index drift

`v-clothingnames` is indexed by global drawable IDs, which can drift when a game
build reorders DLC collections. For names that are guaranteed correct against a
specific running build, read them live from the game instead (see the note on
`GetShopPedComponent` / GXT labels in the root README). This distiller trades
that precision for being fully offline and not needing a running game.

## Attribution

Clothing names come from
[root-cause/v-clothingnames](https://github.com/root-cause/v-clothingnames).
This tool only *transforms* that data; all credit for the names belongs to that
project and its contributors. Re-run the build to pick up upstream updates.
