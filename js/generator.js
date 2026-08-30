/* Generator plansz.
 *
 * Zasada gry: strzałka daje się usunąć, jeśli prosta droga od jej grotu
 * do krawędzi planszy jest wolna od innych strzałek.
 *
 * Planszę budujemy "od tyłu": jako pierwszą kładziemy strzałkę, która
 * zostanie usunięta jako ostatnia. Przy dokładaniu kolejnej wymagamy, by jej
 * tor wyjścia był wolny od strzałek już leżących. Dzięki temu kolejność
 * odwrotna do kolejności układania jest zawsze poprawnym rozwiązaniem —
 * a że usunięcie strzałki tylko zwalnia pola, żadnego ruchu nie da się
 * "zepsuć" i plansza nigdy nie wpada w ślepy zaułek.
 */
(function (global) {
  'use strict';

  const DIRS = [
    { x: 1, y: 0 }, { x: -1, y: 0 },
    { x: 0, y: 1 }, { x: 0, y: -1 }
  ];

  const key = (x, y) => x + ',' + y;
  const perpendicular = (d) => (d.x !== 0 ? [{ x: 0, y: 1 }, { x: 0, y: -1 }]
                                          : [{ x: 1, y: 0 }, { x: -1, y: 0 }]);

  function levelSpec(level) {
    return {
      size: Math.min(9 + Math.floor((level - 1) / 2), 17),
      arrows: Math.min(6 + Math.round((level - 1) * 2.2), 40)
    };
  }

  function build(level, salt) {
    const spec = levelSpec(level);
    const size = spec.size;
    const rnd = makeRng((Math.imul(level, 2654435761) ^ 0x9e3779b9) + salt * 0x85ebca6b);

    const occupied = new Set();
    const placed = [];
    const maxAttempts = 3000 + spec.arrows * 500;

    const inBounds = (x, y) => x >= 0 && y >= 0 && x < size && y < size;

    for (let attempt = 0; attempt < maxAttempts && placed.length < spec.arrows; attempt++) {
      const dir = rnd.pick(DIRS);
      const hx = rnd.int(size);
      const hy = rnd.int(size);
      if (occupied.has(key(hx, hy))) continue;

      // Tor wyjścia: od pola za grotem aż poza krawędź.
      const ray = new Set();
      let blocked = false;
      for (let x = hx + dir.x, y = hy + dir.y; inBounds(x, y); x += dir.x, y += dir.y) {
        if (occupied.has(key(x, y))) { blocked = true; break; }
        ray.add(key(x, y));
      }
      if (blocked) continue;

      // Ogon rośnie wstecz od grotu: kilka odcinków, każdy pod kątem prostym
      // do poprzedniego. Ciało nie może wejść na własny tor wyjścia.
      const path = [[hx, hy]];
      const used = new Set([key(hx, hy)]);
      let cur = [hx, hy];
      let back = { x: -dir.x, y: -dir.y };
      const segments = rnd.range(1, 4);

      for (let s = 0; s < segments; s++) {
        const wanted = rnd.range(1, 4);
        let moved = 0;
        for (let i = 0; i < wanted; i++) {
          const nx = cur[0] + back.x;
          const ny = cur[1] + back.y;
          const k = key(nx, ny);
          if (!inBounds(nx, ny) || occupied.has(k) || used.has(k) || ray.has(k)) break;
          cur = [nx, ny];
          used.add(k);
          path.push(cur);
          moved++;
        }
        if (moved === 0) break;
        back = rnd.pick(perpendicular(back));
      }

      if (path.length < 3) continue; // za krótkie, żeby ładnie wyglądało

      path.forEach(p => occupied.add(key(p[0], p[1])));
      path.reverse(); // ogon -> grot

      // Tor wyjścia dopisany za grotem, z zapasem poza planszę.
      const toEdge = dir.x > 0 ? size - 1 - hx
                   : dir.x < 0 ? hx
                   : dir.y > 0 ? size - 1 - hy
                   : hy;
      const reach = toEdge + 3;

      placed.push({
        id: placed.length,
        dir: dir,
        cells: path.map(p => [p[0], p[1]]),
        exitPath: path.map(p => [p[0], p[1]]).concat([[hx + dir.x * reach, hy + dir.y * reach]])
      });
    }

    // Kolejność układania odwrotna do kolejności rozwiązania — mieszamy
    // identyfikatory, żeby nic nie zdradzało poprawnej sekwencji.
    placed.reverse();
    placed.forEach((a, i) => { a.id = i; });

    return { size: size, level: level, arrows: placed, angle: (rnd() - 0.5) * 0.19 };
  }

  /* Losowe upychanie bywa nierówne — bierzemy najlepszą z kilku prób,
     żeby plansza nie wyszła nagle o połowę pustsza od sąsiednich. */
  function generate(level) {
    const target = levelSpec(level).arrows;
    let best = null;
    for (let salt = 0; salt < 6; salt++) {
      const candidate = build(level, salt);
      if (!best || candidate.arrows.length > best.arrows.length) best = candidate;
      if (best.arrows.length >= target) break;
    }
    return best;
  }

  global.Generator = { generate, levelSpec, DIRS };
})(window);
