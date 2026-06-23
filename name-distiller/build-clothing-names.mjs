// build-clothing-names.mjs
//
// Distills the community-maintained root-cause/v-clothingnames dataset into
// compact, per-gender lookup maps of human-readable clothing names, keyed by
// the same drawable IDs the in-game dumper produces.
//
//   names/male.json     { slot: { drawableId: "Item Name" } }
//   names/female.json
//
// Usage:
//   npm run dump
//   node build-clothing-names.mjs
//
// Requires Node 18+ (global fetch + top-level await).

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE =
  "https://raw.githubusercontent.com/root-cause/v-clothingnames/master";

// The upstream repo splits names across files using three naming conventions.
// We map every clothing "slot" onto its source file.
const COMPONENTS = ["tops", "undershirts", "torsos", "legs", "shoes", "accessories"]; // {gender}_{slot}.json
const PROPS = ["hats", "glasses", "ears", "watches", "bracelets"]; //              props_{gender}_{slot}.json
//                                                                  masks live in masks_{gender}.json

const GENDERS = ["male", "female"];
const INDENT = 2; // pretty-print so regenerated files produce clean diffs

// Resolve output relative to this script, so it runs from any cwd.
const OUT_DIR = fileURLToPath(new URL("names", import.meta.url));

/** Map a gender to its { slot: sourceFile } table. */
function sourcesFor(gender) {
  const sources = {};
  for (const slot of COMPONENTS) sources[slot] = `${gender}_${slot}.json`;
  for (const slot of PROPS) sources[slot] = `props_${gender}_${slot}.json`;
  sources.masks = `masks_${gender}.json`;
  return sources;
}

/** Fetch and parse one JSON file from the upstream repo. */
async function fetchJson(file) {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Reduce a source file — { drawableId: { textureId: { Localized, ... } } } —
 * to a flat { drawableId: "Name" } map, keeping the first texture variant that
 * has a usable localized label. Unnamed drawables are dropped, and the result
 * is sorted numerically so output stays deterministic and git-friendly.
 */
function distill(raw) {
  const names = {};
  for (const [drawable, textures] of Object.entries(raw)) {
    const labelled = Object.values(textures).find(
      (t) => t.Localized && t.Localized !== "NULL",
    );
    if (labelled) names[drawable] = labelled.Localized;
  }
  return Object.fromEntries(
    Object.entries(names).sort(([a], [b]) => Number(a) - Number(b)),
  );
}

/** Build the full slot map for one gender, fetching every slot in parallel. */
async function buildGender(gender) {
  const slots = Object.entries(sourcesFor(gender));
  const distilled = await Promise.all(
    slots.map(async ([slot, file]) => [slot, distill(await fetchJson(file))]),
  );
  for (const [slot, names] of distilled) {
    console.log(`  ${gender}/${slot}: ${Object.keys(names).length} named`);
  }
  return Object.fromEntries(distilled);
}

await mkdir(OUT_DIR, { recursive: true });

let grandTotal = 0;
for (const gender of GENDERS) {
  console.log(`Building ${gender}…`);
  const result = await buildGender(gender);

  const total = Object.values(result).reduce(
    (n, names) => n + Object.keys(names).length,
    0,
  );
  grandTotal += total;

  const out = path.join(OUT_DIR, `${gender}.json`);
  await writeFile(out, JSON.stringify(result, null, INDENT) + "\n");
  console.log(`  → ${path.relative(process.cwd(), out)} (${total} names)\n`);
}

console.log(`Done — ${grandTotal} clothing names across ${GENDERS.length} genders.`);
