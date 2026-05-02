#!/usr/bin/env node
// Pre-process all edition JSONs into a compact monster-abilities lookup
// for the web player UI.
//
// Output: { decks: { [deckName]: { [nr]: {name, initiative, lines} } },
//           monsters: { [monsterId]: deckName } }
//
// Usage: node scripts/build-ability-data.mjs

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = resolve(here, '../../frosthaven_assistant/assets/data/editions');
const OUT_FILE = resolve(here, '../public/monster-abilities.json');

const SKIP = new Set(['editions.json', 'na.json']);

const decks = {};
const monsters = {};

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.json') && !SKIP.has(f));

for (const f of files) {
  const data = JSON.parse(readFileSync(join(SRC_DIR, f), 'utf8'));

  for (const deck of data.monsterAbilities ?? []) {
    const cards = {};
    for (const c of deck.cards ?? []) {
      // Card array shape: [name, nr, shuffle, initiative, ...lines]
      const [name, nr, , initiative, ...lines] = c;
      cards[nr] = { name, initiative, lines };
    }
    decks[deck.name] = cards;
  }

  for (const [monsterId, info] of Object.entries(data.monsters ?? {})) {
    if (info?.deck) monsters[monsterId] = info.deck;
  }
}

const out = { decks, monsters };
writeFileSync(OUT_FILE, JSON.stringify(out));
const sizeKb = (JSON.stringify(out).length / 1024).toFixed(1);
console.log(`Wrote ${OUT_FILE}`);
console.log(`Decks: ${Object.keys(decks).length}, monsters: ${Object.keys(monsters).length}, size: ${sizeKb} KB`);
