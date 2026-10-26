/**
 * Converts a string into a deterministic 32-bit unsigned integer seed.
 */
export function strToSeed(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

/**
 * Returns a deterministic pseudo-random number generator (PRNG) seeded with
 * the given value.
 */
export function seededRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return s / 4294967296;
  };
}

export function roundedPolygonPath(points: number[][], r: number): string {
  const n = points.length;
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const d0x = prev[0] - curr[0];
    const d0y = prev[1] - curr[1];
    const len0 = Math.sqrt(d0x * d0x + d0y * d0y);
    const a0x = curr[0] + (d0x / len0) * Math.min(r, len0 / 2);
    const a0y = curr[1] + (d0y / len0) * Math.min(r, len0 / 2);
    const d1x = next[0] - curr[0];
    const d1y = next[1] - curr[1];
    const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    const a1x = curr[0] + (d1x / len1) * Math.min(r, len1 / 2);
    const a1y = curr[1] + (d1y / len1) * Math.min(r, len1 / 2);
    parts.push(
      `${i === 0 ? "M" : "L"} ${a0x.toFixed(1)} ${a0y.toFixed(1)} Q ${curr[0].toFixed(1)} ${curr[1].toFixed(1)} ${a1x.toFixed(1)} ${a1y.toFixed(1)}`,
    );
  }
  parts.push("Z");
  return parts.join(" ");
}
