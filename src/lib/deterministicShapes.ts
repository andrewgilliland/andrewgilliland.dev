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

export function polygonPath(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotationDeg = 0,
) {
  const rotation = (rotationDeg * Math.PI) / 180;
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = rotation + (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return `M ${pts.join(" L ")} Z`;
}

export function starPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number,
  rotationDeg = 0,
) {
  const rotation = (rotationDeg * Math.PI) / 180;
  const pts = Array.from({ length: points * 2 }, (_, i) => {
    const isOuter = i % 2 === 0;
    const r = isOuter ? outerRadius : innerRadius;
    const a = rotation + (i * Math.PI) / points - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return `M ${pts.join(" L ")} Z`;
}
