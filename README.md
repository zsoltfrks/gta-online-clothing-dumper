# V Clothing Dumper

A pair of tools for working with GTA V / FiveM clothing data: one dumps **what
clothing exists in the current game build**, the other resolves those items to
**human-readable names**.

In GTA V every wearable is addressed by a numeric _drawable ID_ per slot
(`tops` drawable 0, 1, 2 …). There is no built-in name, and the set of valid
drawables grows with **every GTA Online DLC** — so a hard-coded list goes stale
the moment Rockstar ships an update. These tools read the data fresh instead of
guessing.

<h2>Closed source in action:</h2>
<img width="1024" height="618" alt="Screenshot 2026-06-12 152948" src="https://github.com/user-attachments/assets/f550d0be-af31-4666-886e-0236f9e8fa6d" />


## The two tools

| Tool                                         | Location          | What it answers                       | Needs a running game? |
| -------------------------------------------- | ----------------- | ------------------------------------- | --------------------- |
| **In-game dumper** (FiveM resource)          | repo root         | _What drawables exist in this build?_ | Yes                   |
| **[name-distiller](name-distiller/)** (Node) | `name-distiller/` | _What is each drawable called?_       | No                    |

They're complementary: the dumper gives you the authoritative list of drawables
for the build you're running; the distiller labels them. Join the two on
`(slot, drawable)`.

## Repo layout

```
.
├── fxmanifest.lua          # the in-game dumper (a FiveM resource)
├── sourceC.lua             #   /dumpcloth command — enumerates drawables (client)
├── sourceS.lua             #   writes the JSON dumps (server)
├── dump_male/              # sample output: every male slot for one build
├── dump_female/            # sample output: every female slot for one build
└── name-distiller/         # the Node name tool (+ its own README)
    ├── build-clothing-names.mjs
    └── names/              # sample output: drawableId -> name
```

## In-game dumper

A small FiveM resource. Drop the repo into your server's `resources/` folder and
`ensure` it, then run the command in-game (it's a dev/curation tool — don't ship
it to production).

```
/dumpcloth all        # dump every slot
/dumpcloth tops       # or a single slot
```

It detects the current ped's gender, asks the running build how many drawable
variations each slot has (`GetNumberOfPedDrawableVariations` /
`GetNumberOfPedPropDrawableVariations`), and writes one file per slot to
`dump_<gender>/`:

```jsonc
// dump_male/dump_male_tops.json
[
  { "texture": 0, "id": "tops_0", "drawable": 0 },
  { "texture": 0, "id": "tops_1", "drawable": 1 },
]
```

The dump records _what exists_ — pricing and labels are intentionally left out,
since those are decisions for whatever catalog/economy consumes the data, not
properties of the game build.

Run it against both the male (`mp_m_freemode_01`) and female
(`mp_f_freemode_01`) ped — drawable IDs differ per model. The committed
`dump_male/` and `dump_female/` folders are a full sample from one build.

### Slot → component map

| Slot keys                                                  | Kind      | Indices              |
| ---------------------------------------------------------- | --------- | -------------------- |
| tops, undershirts, torsos, legs, shoes, accessories, masks | component | 11, 8, 3, 4, 6, 7, 1 |
| hats, glasses, ears, watches, bracelets                    | prop      | 0, 1, 2, 6, 7        |

## name-distiller

See [`name-distiller/`](name-distiller/) for its own README. In short:

```bash
cd name-distiller
npm run dump
```

It fetches [root-cause/v-clothingnames](https://github.com/root-cause/v-clothingnames)
and writes `names/<gender>.json` as `slot → drawableId → name`.

## License

[GPL-3.0](LICENSE). Clothing names distilled by `name-distiller` come from
[root-cause/v-clothingnames](https://github.com/root-cause/v-clothingnames) —
credit for the names belongs to that project.
