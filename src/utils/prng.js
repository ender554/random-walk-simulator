// A tiny seeded generator (mulberry32 seeded by an FNV-1a hash of the seed text). It is simple
// enough to write out in Python and JavaScript snippets that reproduce a run exactly.

export function hashSeed(text) {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function mulberry32(seedText) {
  let a = hashSeed(seedText);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PYTHON_PRNG = `def make_rng(seed_text):
    # FNV-1a hash of the seed, then mulberry32 (matches the simulator exactly)
    a = 0x811C9DC5
    for byte in seed_text.encode("utf-8"):
        a = ((a ^ byte) * 0x01000193) & 0xFFFFFFFF
    def rand():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((a ^ (a >> 15)) * (a | 1)) & 0xFFFFFFFF
        t = ((t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return rand`;

export const JS_PRNG = `function makeRng(seedText) {
  // FNV-1a hash of the seed, then mulberry32 (matches the simulator exactly)
  let a = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(seedText)) a = Math.imul(a ^ byte, 0x01000193) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}`;
