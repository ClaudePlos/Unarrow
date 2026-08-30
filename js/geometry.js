/* Narzędzia do pracy z łamanymi (polyline) w jednostkach siatki. */
(function (global) {
  'use strict';

  function measure(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    return cum;
  }

  function pointAt(pts, cum, s) {
    const total = cum[cum.length - 1];
    if (s <= 0) return [pts[0][0], pts[0][1]];
    if (s >= total) return [pts[pts.length - 1][0], pts[pts.length - 1][1]];
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const span = cum[i] - cum[i - 1] || 1;
    const t = (s - cum[i - 1]) / span;
    return [
      pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
      pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t
    ];
  }

  /* Wycinek łamanej pomiędzy długościami łuku a i b. */
  function slice(pts, cum, a, b) {
    const total = cum[cum.length - 1];
    a = Math.max(0, Math.min(total, a));
    b = Math.max(a, Math.min(total, b));
    const out = [pointAt(pts, cum, a)];
    for (let i = 0; i < cum.length; i++) {
      if (cum[i] > a + 1e-6 && cum[i] < b - 1e-6) out.push(pts[i]);
    }
    out.push(pointAt(pts, cum, b));
    return out;
  }

  function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  function distToPolyline(px, py, pts) {
    let best = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const d = distToSegment(px, py, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      if (d < best) best = d;
    }
    return best;
  }

  global.Geo = { measure, pointAt, slice, distToPolyline };
})(window);
