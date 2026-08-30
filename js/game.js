/* Unarrow — silnik gry, rysowanie i obsługa wejścia. */
(function () {
  'use strict';

  // --- stałe w jednostkach siatki (1 = odstęp między punktami) -------------
  const PAD = 1.15;          // margines planszy wokół siatki
  const STROKE = 0.38;       // grubość strzałki
  const HEAD_LEN = 0.74;     // długość grotu
  const HEAD_HALF = 0.46;    // połowa szerokości grotu
  const HIT_SLOP = 0.26;     // zapas przy trafianiu w strzałkę
  const SPEED = 19;          // prędkość wysuwania (jednostek siatki / s)
  const SHAKE_TIME = 0.42;   // czas drgania zablokowanej strzałki
  const HINT_TIME = 1.9;     // jak długo świeci podpowiedź

  const COLORS = {
    arrow: '#151a23',
    hover: '#39414f',
    accent: '#d21e4b',
    card: '#ffffff',
    cardEdge: 'rgba(120,140,175,0.16)',
    trace: '#edf2fa',
    dot: 'rgba(124,130,188,0.32)'
  };

  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');

  const ui = {
    level: document.getElementById('levelBadge'),
    left: document.getElementById('leftCount'),
    hint: document.getElementById('hintBtn'),
    restart: document.getElementById('restartBtn'),
    sound: document.getElementById('soundBtn'),
    info: document.getElementById('infoBtn'),
    infoModal: document.getElementById('infoModal'),
    infoClose: document.getElementById('infoClose'),
    win: document.getElementById('winOverlay'),
    winStats: document.getElementById('winStats'),
    next: document.getElementById('nextBtn')
  };

  const store = {
    read(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : v; } catch (e) { return fallback; } },
    write(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) { /* tryb prywatny */ } }
  };

  const state = {
    puzzle: null,
    arrows: [],
    decor: [],
    view: { cx: 0, cy: 0, scale: 1, angle: 0 },
    hoverId: -1,
    shake: null,      // { id, t }
    hint: null,       // { id, t }
    moves: 0,
    mistakes: 0,
    hints: 0,
    startedAt: 0,
    finishedAt: 0,
    won: false,
    lastFrame: 0
  };

  // ---------------------------------------------------------------- plansza

  function loadLevel(level) {
    const puzzle = Generator.generate(level);
    state.puzzle = puzzle;
    state.arrows = puzzle.arrows.map(a => {
      const cum = Geo.measure(a.exitPath);
      return {
        id: a.id,
        dir: a.dir,
        cells: a.cells,
        exitPath: a.exitPath,
        cum: cum,
        bodyLen: Geo.measure(a.cells)[a.cells.length - 1],
        total: cum[cum.length - 1],
        status: 'idle',   // idle | leaving | gone
        progress: 0
      };
    });
    state.decor = buildDecor(puzzle);
    state.hoverId = -1;
    state.shake = null;
    state.hint = null;
    state.moves = 0;
    state.mistakes = 0;
    state.hints = 0;
    state.won = false;
    state.startedAt = performance.now();
    state.finishedAt = 0;

    ui.level.textContent = level;
    ui.win.classList.add('hidden');
    updateCounter();
    layout();
  }

  /* Delikatny wzór "płytki drukowanej" pod strzałkami.
     Starty rozrzucamy po zgrubnej kracie z drganiem, żeby ścieżki pokryły
     planszę równomiernie zamiast zbijać się w kilka kęp. */
  function buildDecor(puzzle) {
    const rnd = makeRng(Math.imul(puzzle.level, 0x27d4eb2d) ^ 0x165667b1);
    const lo = -PAD + 0.3;
    const hi = puzzle.size - 1 + PAD - 0.3;
    const ortho = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    const diag = [{ x: 0.7, y: 0.7 }, { x: -0.7, y: 0.7 }, { x: 0.7, y: -0.7 }, { x: -0.7, y: -0.7 }];
    const step = () => (rnd() < 0.72 ? rnd.pick(ortho) : rnd.pick(diag));

    const traces = [];
    const cols = Math.max(3, Math.round(puzzle.size / 2.4));
    const cellW = (hi - lo) / cols;

    for (let gx = 0; gx < cols; gx++) {
      for (let gy = 0; gy < cols; gy++) {
        if (rnd() < 0.12) continue; // gdzieniegdzie zostawiamy pustkę
        let x = lo + (gx + 0.15 + rnd() * 0.7) * cellW;
        let y = lo + (gy + 0.15 + rnd() * 0.7) * cellW;
        const pts = [[x, y]];
        let dir = step();
        const legs = rnd.range(2, 4);
        for (let s = 0; s < legs; s++) {
          const len = rnd.range(1, 3);
          x = Math.max(lo, Math.min(hi, x + dir.x * len));
          y = Math.max(lo, Math.min(hi, y + dir.y * len));
          pts.push([x, y]);
          dir = step();
        }
        traces.push({ pts: pts, pad: rnd() < 0.45 });
      }
    }
    return traces;
  }

  // ---------------------------------------------------------------- układ

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const puzzle = state.puzzle;
    if (!puzzle) return;

    const span = puzzle.size - 1 + 2 * PAD;
    const a = Math.abs(puzzle.angle);
    const spread = Math.abs(Math.cos(a)) + Math.abs(Math.sin(a));
    const fit = Math.min(w, h) * (w < 620 ? 0.96 : 0.88);

    state.view.dpr = dpr;
    state.view.cx = w / 2;
    state.view.cy = h / 2;
    state.view.angle = puzzle.angle;
    state.view.scale = fit / (span * spread);
  }

  function applyBoardTransform() {
    const v = state.view;
    const half = (state.puzzle.size - 1) / 2;
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    ctx.translate(v.cx, v.cy);
    ctx.rotate(v.angle);
    ctx.scale(v.scale, v.scale);
    ctx.translate(-half, -half);
  }

  function screenToGrid(px, py) {
    const v = state.view;
    const half = (state.puzzle.size - 1) / 2;
    const dx = px - v.cx;
    const dy = py - v.cy;
    const c = Math.cos(-v.angle);
    const s = Math.sin(-v.angle);
    return [
      (dx * c - dy * s) / v.scale + half,
      (dx * s + dy * c) / v.scale + half
    ];
  }

  // ---------------------------------------------------------------- logika

  function blockedCells() {
    const occ = new Set();
    for (const a of state.arrows) {
      if (a.status !== 'idle') continue;
      for (const c of a.cells) occ.add(c[0] + ',' + c[1]);
    }
    return occ;
  }

  function isRemovable(arrow, occ) {
    const size = state.puzzle.size;
    const head = arrow.cells[arrow.cells.length - 1];
    let x = head[0] + arrow.dir.x;
    let y = head[1] + arrow.dir.y;
    while (x >= 0 && y >= 0 && x < size && y < size) {
      if (occ.has(x + ',' + y)) return false;
      x += arrow.dir.x;
      y += arrow.dir.y;
    }
    return true;
  }

  function arrowAt(gx, gy) {
    let best = null;
    let bestDist = STROKE / 2 + HIT_SLOP;
    for (const a of state.arrows) {
      if (a.status !== 'idle') continue;
      const d = Geo.distToPolyline(gx, gy, a.cells);
      if (d < bestDist) { bestDist = d; best = a; }
    }
    return best;
  }

  function tryRemove(arrow) {
    const occ = blockedCells();
    // pole samej strzałki nie może blokować jej własnego wyjścia
    for (const c of arrow.cells) occ.delete(c[0] + ',' + c[1]);

    if (!isRemovable(arrow, occ)) {
      state.mistakes++;
      state.shake = { id: arrow.id, t: 0 };
      Sfx.blocked();
      return false;
    }

    arrow.status = 'leaving';
    arrow.progress = 0;
    state.moves++;
    if (state.hint && state.hint.id === arrow.id) state.hint = null;
    Sfx.release();
    updateCounter();
    return true;
  }

  function showHint() {
    if (state.won) return;
    const occ = blockedCells();
    const candidates = state.arrows.filter(a => {
      if (a.status !== 'idle') return false;
      const own = new Set(a.cells.map(c => c[0] + ',' + c[1]));
      const rest = new Set([...occ].filter(k => !own.has(k)));
      return isRemovable(a, rest);
    });
    if (!candidates.length) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    state.hint = { id: pick.id, t: 0 };
    state.hints++;
    Sfx.hint();
  }

  function updateCounter() {
    const left = state.arrows.filter(a => a.status !== 'gone').length;
    ui.left.textContent = left;
  }

  function checkWin() {
    if (state.won) return;
    if (state.arrows.some(a => a.status !== 'gone')) return;
    state.won = true;
    state.finishedAt = performance.now();
    Sfx.win();
    const secs = Math.round((state.finishedAt - state.startedAt) / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    ui.winStats.textContent =
      'Czas ' + mm + ':' + ss +
      ' · ruchów ' + state.moves +
      ' · pomyłek ' + state.mistakes +
      (state.hints ? ' · podpowiedzi ' + state.hints : '');
    const next = state.puzzle.level + 1;
    if (next > parseInt(store.read('unarrow.level', '1'), 10)) store.write('unarrow.level', next);
    setTimeout(() => ui.win.classList.remove('hidden'), 420);
  }

  // ---------------------------------------------------------------- rysunek

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawArrowShape(pts, color) {
    if (pts.length < 2) return;
    const cum = Geo.measure(pts);
    const total = cum[cum.length - 1];
    if (total < 0.02) return;

    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    let dx = last[0] - prev[0];
    let dy = last[1] - prev[1];
    const m = Math.hypot(dx, dy) || 1;
    dx /= m; dy /= m;

    const headLen = Math.min(HEAD_LEN, total);
    const shaft = Geo.slice(pts, cum, 0, Math.max(0, total - headLen * 0.55));

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = STROKE;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (shaft.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(shaft[0][0], shaft[0][1]);
      for (let i = 1; i < shaft.length; i++) ctx.lineTo(shaft[i][0], shaft[i][1]);
      ctx.stroke();
    }

    const bx = last[0] - dx * headLen;
    const by = last[1] - dy * headLen;
    const px = -dy * HEAD_HALF;
    const py = dx * HEAD_HALF;
    ctx.beginPath();
    ctx.moveTo(last[0], last[1]);
    ctx.lineTo(bx + px, by + py);
    ctx.lineTo(bx - px, by - py);
    ctx.closePath();
    ctx.fill();
  }

  function colorFor(arrow) {
    if (state.shake && state.shake.id === arrow.id) return COLORS.accent;
    if (state.hint && state.hint.id === arrow.id) return COLORS.accent;
    if (state.hoverId === arrow.id) return COLORS.hover;
    return COLORS.arrow;
  }

  function render() {
    const v = state.view;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!state.puzzle) return;

    const size = state.puzzle.size;
    const span = size - 1 + 2 * PAD;

    applyBoardTransform();

    // biała plansza z cieniem
    ctx.save();
    ctx.shadowColor = 'rgba(37, 58, 92, 0.22)';
    ctx.shadowBlur = 34 * v.dpr;
    ctx.shadowOffsetY = 10 * v.dpr;
    ctx.fillStyle = COLORS.card;
    roundRect(-PAD, -PAD, span, span, 0.3);
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(-PAD, -PAD, span, span, 0.3);
    ctx.clip();

    // wzór płytki drukowanej
    ctx.strokeStyle = COLORS.trace;
    ctx.fillStyle = COLORS.trace;
    ctx.lineWidth = 0.15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const t of state.decor) {
      ctx.beginPath();
      ctx.moveTo(t.pts[0][0], t.pts[0][1]);
      for (let i = 1; i < t.pts.length; i++) ctx.lineTo(t.pts[i][0], t.pts[i][1]);
      ctx.stroke();
      if (t.pad) {
        const end = t.pts[t.pts.length - 1];
        ctx.beginPath();
        ctx.arc(end[0], end[1], 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // punkty siatki
    ctx.fillStyle = COLORS.dot;
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        ctx.beginPath();
        ctx.arc(x, y, 0.055, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // strzałki: najpierw leżące, potem te w ruchu
    for (const a of state.arrows) {
      if (a.status !== 'idle') continue;
      const shaking = state.shake && state.shake.id === a.id;
      ctx.save();
      if (shaking) {
        const p = state.shake.t / SHAKE_TIME;
        const amp = 0.22 * (1 - p) * Math.sin(p * Math.PI * 7);
        ctx.translate(a.dir.x * amp, a.dir.y * amp);
      }
      drawArrowShape(a.cells, colorFor(a));
      ctx.restore();
    }

    for (const a of state.arrows) {
      if (a.status !== 'leaving') continue;
      const from = a.progress;
      const to = Math.min(a.total, a.bodyLen + a.progress);
      if (to - from > 0.02) drawArrowShape(Geo.slice(a.exitPath, a.cum, from, to), COLORS.arrow);
    }

    ctx.restore();

    // subtelna krawędź planszy
    ctx.strokeStyle = COLORS.cardEdge;
    ctx.lineWidth = 0.035;
    roundRect(-PAD, -PAD, span, span, 0.3);
    ctx.stroke();
  }

  // ---------------------------------------------------------------- pętla

  function frame(now) {
    const dt = Math.min((now - (state.lastFrame || now)) / 1000, 0.05);
    state.lastFrame = now;

    let finished = false;
    for (const a of state.arrows) {
      if (a.status !== 'leaving') continue;
      a.progress += SPEED * dt;
      if (a.progress >= a.total) {
        a.status = 'gone';
        finished = true;
      }
    }
    if (finished) { updateCounter(); checkWin(); }

    if (state.shake) {
      state.shake.t += dt;
      if (state.shake.t >= SHAKE_TIME) state.shake = null;
    }
    if (state.hint) {
      state.hint.t += dt;
      if (state.hint.t >= HINT_TIME) state.hint = null;
    }

    render();
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- wejście

  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  canvas.addEventListener('pointermove', (e) => {
    if (state.won || e.pointerType === 'touch') return;
    const [px, py] = pointerPos(e);
    const [gx, gy] = screenToGrid(px, py);
    const hit = arrowAt(gx, gy);
    state.hoverId = hit ? hit.id : -1;
    canvas.classList.toggle('pointing', !!hit);
  });

  canvas.addEventListener('pointerleave', () => {
    state.hoverId = -1;
    canvas.classList.remove('pointing');
  });

  canvas.addEventListener('pointerdown', (e) => {
    if (state.won) return;
    Sfx.unlock();
    const [px, py] = pointerPos(e);
    const [gx, gy] = screenToGrid(px, py);
    const hit = arrowAt(gx, gy);
    if (hit) tryRemove(hit);
  });

  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 120));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'h' || e.key === 'H') showHint();
    if (e.key === 'r' || e.key === 'R') loadLevel(state.puzzle.level);
    if (e.key === 'Escape') { ui.infoModal.classList.add('hidden'); }
  });

  ui.hint.addEventListener('click', showHint);
  ui.restart.addEventListener('click', () => loadLevel(state.puzzle.level));
  ui.info.addEventListener('click', () => ui.infoModal.classList.remove('hidden'));
  ui.infoClose.addEventListener('click', () => {
    ui.infoModal.classList.add('hidden');
    store.write('unarrow.seen', '1');
    Sfx.unlock();
  });
  ui.infoModal.addEventListener('click', (e) => {
    if (e.target === ui.infoModal) ui.infoModal.classList.add('hidden');
  });
  ui.next.addEventListener('click', () => loadLevel(state.puzzle.level + 1));

  ui.sound.addEventListener('click', () => {
    const muted = !Sfx.isMuted();
    Sfx.setMuted(muted);
    store.write('unarrow.muted', muted ? '1' : '0');
    ui.sound.classList.toggle('muted', muted);
  });

  // ---------------------------------------------------------------- start

  const mutedAtStart = store.read('unarrow.muted', '0') === '1';
  Sfx.setMuted(mutedAtStart);
  ui.sound.classList.toggle('muted', mutedAtStart);

  /* Uchwyt do testów automatycznych i debugowania z konsoli. */
  window.__unarrow = {
    state: state,
    loadLevel: loadLevel,
    gridToScreen(gx, gy) {
      const v = state.view;
      const half = (state.puzzle.size - 1) / 2;
      const rx = (gx - half) * v.scale;
      const ry = (gy - half) * v.scale;
      const c = Math.cos(v.angle);
      const s = Math.sin(v.angle);
      return [rx * c - ry * s + v.cx, rx * s + ry * c + v.cy];
    },
    firstRemovable() {
      const occ = blockedCells();
      for (const a of state.arrows) {
        if (a.status !== 'idle') continue;
        const rest = new Set(occ);
        for (const c of a.cells) rest.delete(c[0] + ',' + c[1]);
        if (isRemovable(a, rest)) {
          const mid = a.cells[Math.floor(a.cells.length / 2)];
          return { id: a.id, point: [mid[0], mid[1]] };
        }
      }
      return null;
    }
  };

  loadLevel(Math.max(1, parseInt(store.read('unarrow.level', '1'), 10) || 1));
  if (store.read('unarrow.seen', '0') !== '1') ui.infoModal.classList.remove('hidden');
  else ui.infoModal.classList.add('hidden');

  requestAnimationFrame(frame);
})();
