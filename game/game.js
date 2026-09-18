/* ============================================================
   PAC-MAN ARCADE v2 — playable Pac-Man for the GitHub profile
   haqqirahman / Haqqi Rahman
   Vanilla JS + Canvas, no dependencies.

   Movement engine (v2): tile-stepper. An entity only ever moves
   from its current tile toward an adjacent tile that was validated
   with canGo() before the step starts, so leaving the maze is
   impossible by construction. x/y are derived from tile+dir+prog.
   ============================================================ */
"use strict";

/* ---------------- Maze (28 x 31, classic layout) ----------------
   # wall   . pellet (coin)   o power pellet   - ghost door
   _ void (outside maze)      space = empty path (tunnel / house) */
const MAP = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.##### ## #####.######",
  "_____#.##### ## #####.#_____",
  "_____#.##          ##.#_____",
  "_____#.## ###--### ##.#_____",
  "######.## #      # ##.######",
  "      .   #      #   .      ",
  "######.## #      # ##.######",
  "_____#.## ######## ##.#_____",
  "_____#.##          ##.#_____",
  "_____#.## ######## ##.#_____",
  "######.## ######## ##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#o..##.......  .......##..o#",
  "###.##.##.########.##.##.###",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################",
];

const TILE = 20;
const COLS = MAP[0].length;           // 28
const ROWS = MAP.length;              // 31
const FIELD_W = COLS * TILE;          // 560
const FIELD_H = ROWS * TILE;          // 620
const HUD_TOP = 44;
const HUD_BOT = 36;
const W = FIELD_W;
const H = HUD_TOP + FIELD_H + HUD_BOT;

const DIRS = { up: { x: 0, y: -1 }, left: { x: -1, y: 0 }, down: { x: 0, y: 1 }, right: { x: 1, y: 0 } };
const DIR_ORDER = [DIRS.up, DIRS.left, DIRS.down, DIRS.right]; // classic tie-break priority

const DOOR = { c1: 13, c2: 14, r: 12 };
const HOUSE = { minC: 11, maxC: 16, minR: 13, maxR: 15 };
const TUNNEL_ROW = 14;

const SCATTER = {
  blinky: { c: 25, r: -2 },
  pinky:  { c: 2,  r: -2 },
  inky:   { c: 27, r: 32 },
  clyde:  { c: 0,  r: 32 },
};

const MODE_SCHEDULE = [7, 20, 7, 20, 5, 20, 5, Infinity]; // scatter/chase alternation (s)
const FRUIT_VALUES = [100, 300, 500, 700, 1000, 2000, 3000, 5000];

/* ---------------- Tile helpers ---------------- */
function isWallChar(ch) { return ch === "#" || ch === "_"; }

function tileChar(c, r) {
  if (r < 0 || r >= ROWS) return "#";
  if (c < 0 || c >= COLS) return r === TUNNEL_ROW ? " " : "#";
  return MAP[r][c];
}

function walkable(c, r, forEyes) {
  const ch = tileChar(c, r);
  if (isWallChar(ch)) return false;
  if (ch === "-") return !!forEyes; // door: only returning eyes pass
  if (c >= HOUSE.minC && c <= HOUSE.maxC && r >= HOUSE.minR && r <= HOUSE.maxR) {
    return !!forEyes; // ghost-house interior off-limits on the grid
  }
  return true;
}

function canGo(c, r, d, forEyes) {
  return walkable(c + d.x, r + d.y, forEyes);
}

// tile under a pixel position (works for grid + house free positions)
function tileOf(e) {
  return { c: Math.floor(e.x / TILE), r: Math.floor(e.y / TILE) };
}

// derive pixel position from tile + direction + progress (0..1)
function syncPos(e) {
  e.x = e.c * TILE + TILE / 2 + e.dir.x * e.prog * TILE;
  e.y = e.r * TILE + TILE / 2 + e.dir.y * e.prog * TILE;
}

// tunnel teleport at tile arrival: virtual cols -2..-1 <-> 28..29
function wrapTile(e) {
  if (e.r !== TUNNEL_ROW) return;
  if (e.c < -2) e.c += 32;
  else if (e.c > 29) e.c -= 32;
}

// reverse direction mid-leg without teleporting the sprite
function reverseEntity(e) {
  if (e.prog > 0) {
    e.c += e.dir.x;
    e.r += e.dir.y;
    e.prog = 1 - e.prog;
  }
  e.dir = { x: -e.dir.x, y: -e.dir.y };
}

/* ---------------- The stepping core ----------------
   Moves an entity along its dir. Decisions (onArrive) run exactly on
   tile centers; every leg is pre-validated with canGo so a wall can
   never be entered. onEnter fires when a new tile is entered and may
   return false to stop further movement this frame. */
function stepEntity(e, dist, opts) {
  let guard = 0;
  while (dist > 1e-6 && !e.stopped && guard++ < 64) {
    if (e.prog === 0) {
      opts.onArrive(e);
      if (e.stopped) break;
      if (!canGo(e.c, e.r, e.dir, opts.eyesPass)) { e.stopped = true; break; }
    }
    const remain = (1 - e.prog) * TILE;
    const m = Math.min(dist, remain);
    e.prog += m / TILE;
    dist -= m;
    if (e.prog >= 1 - 1e-9) {
      e.c += e.dir.x;
      e.r += e.dir.y;
      e.prog = 0;
      wrapTile(e);
      if (opts.onEnter && opts.onEnter(e) === false) break;
    }
  }
}

/* ---------------- Pellets ---------------- */
let pellets = new Map(); // "c,r" -> { power }
function buildPellets() {
  pellets = new Map();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = MAP[r][c];
      if (ch === "." || ch === "o") pellets.set(c + "," + r, { power: ch === "o" });
    }
  }
}
const totalPellets = () => pellets.size;

/* ---------------- Audio (WebAudio, no assets) ---------------- */
const Sound = {
  ctx: null, master: null, muted: false,
  sirenOsc: null, sirenGain: null, sirenLfo: null, sirenLfoGain: null,
  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem("pacman-arcade-muted", m ? "1" : "0"); } catch (e) {}
    if (this.master) this.master.gain.value = m ? 0 : 1;
  },
  tone(f0, f1, dur, type = "square", vol = 0.1, delay = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t0);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (e) {}
  },
  chomp(alt)  { this.tone(alt ? 540 : 430, alt ? 430 : 540, 0.06, "square", 0.07); },
  power()     { this.tone(140, 620, 0.4, "sawtooth", 0.09); },
  eatGhost()  { this.tone(180, 950, 0.35, "square", 0.1); },
  fruitSnd()  { this.tone(880, 1400, 0.15, "square", 0.1); this.tone(1400, 880, 0.15, "square", 0.1, 0.12); },
  extraLife() { [660, 880, 1100, 1320].forEach((f, i) => this.tone(f, f, 0.12, "square", 0.09, i * 0.11)); },
  start()     { [392, 523, 659, 784, 659, 1046].forEach((f, i) => this.tone(f, f, 0.14, "triangle", 0.1, i * 0.15)); },
  death() {
    this.tone(680, 60, 0.9, "sawtooth", 0.12);
    this.tone(340, 30, 0.9, "square", 0.07, 0.05);
    this.tone(120, 220, 0.2, "square", 0.1, 1.0);
    this.tone(120, 220, 0.2, "square", 0.1, 1.25);
  },
  sirenStart(frightened) {
    if (!this.ctx || this.sirenOsc) { this.sirenSet(frightened); return; }
    try {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenLfo = this.ctx.createOscillator();
      this.sirenLfoGain = this.ctx.createGain();
      this.sirenOsc.type = "triangle";
      this.sirenLfo.type = "sine";
      this.sirenOsc.frequency.value = frightened ? 190 : 130;
      this.sirenLfo.frequency.value = frightened ? 2.2 : 0.45;
      this.sirenLfoGain.gain.value = frightened ? 55 : 32;
      this.sirenGain.gain.value = 0.03;
      this.sirenLfo.connect(this.sirenLfoGain);
      this.sirenLfoGain.connect(this.sirenOsc.frequency);
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.master);
      this.sirenOsc.start();
      this.sirenLfo.start();
    } catch (e) { this.sirenStop(); }
  },
  sirenSet(frightened) {
    if (!this.sirenOsc) return;
    try {
      this.sirenOsc.frequency.value = frightened ? 190 : 130;
      this.sirenLfo.frequency.value = frightened ? 2.2 : 0.45;
      this.sirenLfoGain.gain.value = frightened ? 55 : 32;
    } catch (e) {}
  },
  sirenStop() {
    try {
      if (this.sirenOsc) { this.sirenOsc.stop(); this.sirenOsc = null; }
      if (this.sirenLfo) { this.sirenLfo.stop(); this.sirenLfo = null; }
      if (this.sirenGain) { this.sirenGain.disconnect(); this.sirenGain = null; }
    } catch (e) {}
  },
};
try { Sound.muted = localStorage.getItem("pacman-arcade-muted") === "1"; } catch (e) {}

/* ---------------- Game state ---------------- */
const G = {
  state: "attract", // attract | ready | playing | dying | levelclear | gameover | paused
  prevState: "attract",
  score: 0, hi: 0, lives: 3, level: 1,
  dotsEaten: 0, ghostCombo: 0,
  readyT: 0, dyingT: 0, clearT: 0, freezeT: 0,
  modeIndex: 0, modeT: 0, mode: "scatter",
  frightT: 0,
  fruit: null, fruitSpawned: { a: false, b: false },
  extraLifeGiven: false,
  popups: [],
  t: 0, // global clock for animations
};

try { G.hi = parseInt(localStorage.getItem("pacman-arcade-hi") || "0", 10) || 0; } catch (e) {}

/* pac lives on the grid: tile (c,r) + prog toward the next tile */
const pac = {
  c: 13, r: 23, prog: 0, x: 270, y: 470,
  dir: DIRS.left, nextDir: null,
  stopped: false, eatPhase: 0, deathT: 0,
};

const GHOST_DEFS = [
  { name: "blinky", color: "#ff0000", house: null,          release: 0,   start: { c: 13, r: 11 } },
  { name: "pinky",  color: "#ffb8ff", house: { x: 270, y: 290 }, release: 1.5 },
  { name: "inky",   color: "#00ffff", house: { x: 230, y: 290 }, release: 4.5 },
  { name: "clyde",  color: "#ffb852", house: { x: 330, y: 290 }, release: 7.5 },
];

const ghosts = GHOST_DEFS.map((d) => ({
  ...d,
  defRelease: d.release,
  c: 13, r: 11, prog: 0, x: 270, y: 230,
  dir: DIRS.left, state: d.house ? "house" : "normal",
  frightened: false, bob: Math.random() * Math.PI * 2,
}));

function levelSpeedMul() { return Math.min(1.3, 1 + (G.level - 1) * 0.06); }
function pacmanSpeed()  { return 130 * Math.min(1.2, 1 + (G.level - 1) * 0.04); }
function ghostSpeed(g) {
  const t = tileOf(g);
  const inTunnel = t.r === TUNNEL_ROW && (t.c <= 5 || t.c >= 22);
  if (g.state === "eyes") return 260;
  if (g.state === "frightened") return 66;
  let s = 118 * levelSpeedMul();
  if (inTunnel) s *= 0.55;
  return s;
}
function frightDuration() { return Math.max(2, 7 - G.level); }

/* ---------------- Resets ---------------- */
function resetPositions() {
  pac.c = 13; pac.r = 23; pac.prog = 0;
  pac.dir = DIRS.left; pac.nextDir = null; pac.stopped = false; pac.eatPhase = 0;
  syncPos(pac);
  for (const g of ghosts) {
    g.frightened = false;
    g.dirV = -1;
    if (g.house) {
      g.x = g.house.x; g.y = g.house.y;
      g.state = "house";
      g.release = g.defRelease;
    } else {
      g.c = g.start.c; g.r = g.start.r; g.prog = 0;
      g.dir = DIRS.left; g.state = "normal";
      syncPos(g);
    }
  }
  G.modeIndex = 0; G.modeT = MODE_SCHEDULE[0]; G.mode = "scatter";
  G.frightT = 0; G.freezeT = 0; G.fruit = null;
  G.popups.length = 0;
}

function resetLevel() {
  buildPellets();
  G.dotsEaten = 0;
  G.fruitSpawned = { a: false, b: false };
  resetPositions();
}

function startGame() {
  G.score = 0; G.lives = 3; G.level = 1; G.extraLifeGiven = false;
  resetLevel();
  G.state = "ready"; G.readyT = 2.3;
  Sound.start();
}

/* ---------------- Ghost AI ---------------- */
function ghostTarget(g) {
  if (g.state === "eyes") return { c: DOOR.c1, r: DOOR.r };
  if (G.mode === "scatter") return SCATTER[g.name];
  const p = tileOf(pac);
  switch (g.name) {
    case "blinky": return p;
    case "pinky":  return { c: p.c + pac.dir.x * 4, r: p.r + pac.dir.y * 4 };
    case "inky": {
      const b = tileOf(ghosts[0]);
      const ax = p.c + pac.dir.x * 2, ay = p.r + pac.dir.y * 2;
      return { c: ax * 2 - b.c, r: ay * 2 - b.r };
    }
    case "clyde": {
      const m = tileOf(g);
      return Math.hypot(p.c - m.c, p.r - m.r) > 8 ? p : SCATTER.clyde;
    }
  }
  return p;
}

function ghostArrive(g) {
  const opts = [];
  for (const d of DIR_ORDER) {
    if (d.x === -g.dir.x && d.y === -g.dir.y) continue; // no reversing
    if (!canGo(g.c, g.r, d, g.state === "eyes")) continue;
    opts.push(d);
  }
  if (opts.length === 0) { g.dir = { x: -g.dir.x, y: -g.dir.y }; return; }
  if (g.state === "frightened") {
    g.dir = opts[(Math.random() * opts.length) | 0];
    return;
  }
  const target = ghostTarget(g);
  let best = Infinity, choice = opts[0];
  for (const d of opts) {
    const nc = g.c + d.x, nr = g.r + d.y;
    const dd = (nc - target.c) * (nc - target.c) + (nr - target.r) * (nr - target.r);
    if (dd < best) { best = dd; choice = d; }
  }
  g.dir = choice;
}

/* free (non-grid) movement inside the house / through the door */
function moveGhostHouse(g, dt) {
  const spd = 90 * dt;
  if (g.state === "house") {
    g.y += g.dirV * 30 * dt;
    if (g.y < 282) { g.y = 282; g.dirV = 1; }
    if (g.y > 298) { g.y = 298; g.dirV = -1; }
    g.release -= dt;
    if (g.release <= 0) g.state = "leaving";
  } else if (g.state === "leaving") {
    if (Math.abs(g.x - 270) > 1) {
      g.x += Math.sign(270 - g.x) * Math.min(spd, Math.abs(270 - g.x));
    } else if (g.y > 230) {
      g.x = 270;
      g.y = Math.max(230, g.y - spd);
      if (g.y === 230) {
        // resume grid movement exactly on the tile center above the door
        g.state = G.frightT > 0 ? "frightened" : "normal";
        g.dir = Math.random() < 0.5 ? DIRS.left : DIRS.right;
        g.c = 13; g.r = 11; g.prog = 0;
        syncPos(g);
      }
    }
  } else if (g.state === "entering") {
    if (g.y < 290) {
      g.y = Math.min(290, g.y + spd * 1.5);
    } else {
      const hx = g.house ? g.house.x : 270;
      if (Math.abs(g.x - hx) > 1) {
        g.x += Math.sign(hx - g.x) * Math.min(spd, Math.abs(hx - g.x));
      } else {
        g.state = "house";
        g.release = 0.7;
        g.dirV = -1;
      }
    }
  }
}

function updateGhost(g, dt) {
  if (g.state === "house" || g.state === "leaving" || g.state === "entering") {
    moveGhostHouse(g, dt);
    return;
  }
  stepEntity(g, ghostSpeed(g) * dt, {
    eyesPass: g.state === "eyes",
    onArrive: ghostArrive,
    onEnter: (e) => {
      if (e.state === "eyes" && e.r === DOOR.r && e.c >= DOOR.c1 && e.c <= DOOR.c2) {
        e.x = 270;
        e.y = DOOR.r * TILE + 10;
        e.state = "entering";
        return false;
      }
      return true;
    },
  });
  syncPos(g);
}

/* ---------------- Pac-Man ---------------- */
function pacArrive(p) {
  if (p.nextDir && canGo(p.c, p.r, p.nextDir, false)) p.dir = p.nextDir;
  p.stopped = !canGo(p.c, p.r, p.dir, false);
}

function updatePac(dt) {
  // instant reversal is always allowed, even mid-leg
  if (pac.nextDir && pac.nextDir.x === -pac.dir.x && pac.nextDir.y === -pac.dir.y) {
    reverseEntity(pac);
    pac.nextDir = null;
    pac.stopped = false;
  }
  if (pac.stopped && pac.nextDir && canGo(pac.c, pac.r, pac.nextDir, false)) {
    pac.dir = pac.nextDir;
    pac.stopped = false;
  }
  stepEntity(pac, pacmanSpeed() * dt, {
    eyesPass: false,
    onArrive: pacArrive,
    onEnter: (e) => eatAt(e.c, e.r),
  });
  pac.eatPhase += pacmanSpeed() * dt * 0.35;
  syncPos(pac);
}

function eatAt(c, r) {
  const key = c + "," + r;
  const p = pellets.get(key);
  if (!p) return;
  pellets.delete(key);
  G.dotsEaten++;
  addScore(p.power ? 50 : 10);
  Sound.chomp(p.power || G.dotsEaten % 2 === 0);
  if (p.power) {
    G.frightT = frightDuration();
    G.ghostCombo = 0;
    for (const g of ghosts) {
      if (g.state === "normal") {
        g.state = "frightened";
        reverseEntity(g);
      } else if (g.state === "house" || g.state === "leaving") g.frightened = true;
    }
    Sound.power();
    Sound.sirenStart(true);
  }
  // fruit spawns at 70 and 170 dots (classic)
  if (G.dotsEaten === 70 && !G.fruitSpawned.a) { G.fruitSpawned.a = true; G.fruit = { t: 9.5 }; }
  if (G.dotsEaten === 170 && !G.fruitSpawned.b) { G.fruitSpawned.b = true; G.fruit = { t: 9.5 }; }
  if (totalPellets() === 0) {
    G.state = "levelclear";
    G.clearT = 0;
    Sound.sirenStop();
  }
}

function addScore(n) {
  G.score += n;
  if (G.score > G.hi) {
    G.hi = G.score;
    try { localStorage.setItem("pacman-arcade-hi", String(G.hi)); } catch (e) {}
  }
  if (!G.extraLifeGiven && G.score >= 10000) {
    G.extraLifeGiven = true;
    G.lives++;
    Sound.extraLife();
    popup(pac.x, pac.y - 14, "1UP!", "#00ff88");
  }
}

function popup(x, y, text, color) {
  G.popups.push({ x, y, text, color: color || "#0ff", t: 1.0 });
}

/* ---------------- Death & collisions ---------------- */
function startDeath() {
  G.state = "dying";
  G.dyingT = 0;
  pac.deathT = 0;
  Sound.sirenStop();
  Sound.death();
}

function checkCollisions() {
  for (const g of ghosts) {
    if (g.state !== "normal" && g.state !== "frightened") continue;
    if (Math.abs(g.x - pac.x) < 11 && Math.abs(g.y - pac.y) < 11) {
      if (g.state === "frightened") {
        const pts = 200 << G.ghostCombo;
        G.ghostCombo = Math.min(3, G.ghostCombo + 1);
        addScore(pts);
        popup(g.x, g.y, String(pts), "#00ffff");
        g.state = "eyes";
        G.freezeT = 0.55;
        Sound.eatGhost();
      } else {
        startDeath();
        return;
      }
    }
  }
  if (G.fruit && G.fruit.t > 0) {
    if (Math.abs(270 - pac.x) < 12 && Math.abs(350 - pac.y) < 12) {
      const pts = FRUIT_VALUES[Math.min(G.level - 1, FRUIT_VALUES.length - 1)];
      addScore(pts);
      popup(270, 350, String(pts), "#ff5db1");
      G.fruit = null;
      Sound.fruitSnd();
    }
  }
}

/* ---------------- Main update ---------------- */
function update(dt) {
  G.t += dt;

  if (G.state === "attract" || G.state === "gameover" || G.state === "paused") return;

  for (let i = G.popups.length - 1; i >= 0; i--) {
    const p = G.popups[i];
    p.t -= dt; p.y -= 14 * dt;
    if (p.t <= 0) G.popups.splice(i, 1);
  }

  if (G.state === "ready") {
    G.readyT -= dt;
    if (G.readyT <= 0) {
      G.state = "playing";
      Sound.sirenStart(false);
    }
    return;
  }

  if (G.state === "dying") {
    G.dyingT += dt;
    if (G.dyingT >= 1.9) {
      G.lives--;
      if (G.lives > 0) {
        resetPositions();
        G.state = "ready"; G.readyT = 1.6;
      } else {
        G.state = "gameover";
      }
    }
    return;
  }

  if (G.state === "levelclear") {
    G.clearT += dt;
    if (G.clearT >= 2.2) {
      G.level++;
      resetLevel();
      G.state = "ready"; G.readyT = 1.8;
    }
    return;
  }

  if (G.freezeT > 0) { G.freezeT -= dt; return; }

  // scatter / chase schedule (pauses while frightened)
  if (G.frightT > 0) {
    G.frightT -= dt;
    if (G.frightT <= 0) {
      G.frightT = 0;
      for (const g of ghosts) {
        if (g.state === "frightened") g.state = "normal";
        g.frightened = false;
      }
      Sound.sirenStart(false);
    }
  } else {
    if (G.modeT !== Infinity) {
      G.modeT -= dt;
      if (G.modeT <= 0) {
        G.modeIndex++;
        G.mode = G.modeIndex % 2 === 0 ? "scatter" : "chase";
        G.modeT = MODE_SCHEDULE[Math.min(G.modeIndex, MODE_SCHEDULE.length - 1)];
        for (const g of ghosts) {
          if (g.state === "normal") reverseEntity(g);
        }
      }
    }
  }

  updatePac(dt);
  for (const g of ghosts) updateGhost(g, dt);
  checkCollisions();

  if (G.fruit) {
    G.fruit.t -= dt;
    if (G.fruit.t <= 0) G.fruit = null;
  }
}

/* ---------------- Rendering ---------------- */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const DPR = Math.min(2, window.devicePixelRatio || 1);
canvas.width = W * DPR;
canvas.height = H * DPR;
canvas.style.aspectRatio = W + " / " + H;
ctx.scale(DPR, DPR);

const mazeCanvas = document.createElement("canvas");
mazeCanvas.width = W * DPR;
mazeCanvas.height = FIELD_H * DPR;
const mctx = mazeCanvas.getContext("2d");
mctx.scale(DPR, DPR);

function renderMaze() {
  mctx.clearRect(0, 0, W, FIELD_H);
  mctx.lineWidth = 2.5;
  mctx.lineCap = "round";
  mctx.strokeStyle = "#2a3cff";
  mctx.shadowColor = "#2a3cff";
  mctx.shadowBlur = 6;

  const wall = (c, r) => isWallChar(tileChar(c, r));
  mctx.beginPath();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!wall(c, r)) continue;
      const x = c * TILE, y = r * TILE;
      if (!wall(c, r - 1)) { mctx.moveTo(x + 1, y + 1); mctx.lineTo(x + TILE - 1, y + 1); }
      if (!wall(c, r + 1)) { mctx.moveTo(x + 1, y + TILE - 1); mctx.lineTo(x + TILE - 1, y + TILE - 1); }
      if (!wall(c - 1, r)) { mctx.moveTo(x + 1, y + 1); mctx.lineTo(x + 1, y + TILE - 1); }
      if (!wall(c + 1, r)) { mctx.moveTo(x + TILE - 1, y + 1); mctx.lineTo(x + TILE - 1, y + TILE - 1); }
    }
  }
  mctx.stroke();

  mctx.shadowBlur = 0;
  mctx.fillStyle = "rgba(20, 28, 120, 0.35)";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!wall(c, r)) continue;
      mctx.fillRect(c * TILE + 3, r * TILE + 3, TILE - 6, TILE - 6);
    }
  }

  mctx.strokeStyle = "#ffb8ff";
  mctx.lineWidth = 3;
  mctx.beginPath();
  mctx.moveTo(DOOR.c1 * TILE, DOOR.r * TILE + TILE / 2);
  mctx.lineTo((DOOR.c2 + 1) * TILE, DOOR.r * TILE + TILE / 2);
  mctx.stroke();
}
renderMaze();

function drawPellets() {
  const blink = (G.t * 4) % 1 < 0.6;
  ctx.fillStyle = "#ffb8ae";
  for (const [key, p] of pellets) {
    const [c, r] = key.split(",").map(Number);
    const x = c * TILE + TILE / 2, y = HUD_TOP + r * TILE + TILE / 2;
    if (p.power) {
      if (!blink) continue;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  }
}

function drawFruit() {
  if (!G.fruit) return;
  const x = 270, y = HUD_TOP + 350;
  ctx.save();
  ctx.fillStyle = "#ff2d2d";
  ctx.beginPath(); ctx.arc(x - 5, y + 4, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 6, y + 2, 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#00c853";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 1);
  ctx.quadraticCurveTo(x + 2, y - 12, x + 9, y - 5);
  ctx.stroke();
  ctx.restore();
}

function drawPacmanShape(x, y, r, angle, mouth) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#ffe600";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, mouth, Math.PI * 2 - mouth);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPacman() {
  if (G.state === "dying") {
    // classic death: mouth opens until pacman vanishes
    const t = Math.min(1, G.dyingT / 1.4);
    const mouth = 0.25 + t * (Math.PI - 0.25);
    if (t < 1) drawPacmanShape(pac.x, HUD_TOP + pac.y, 9, -Math.PI / 2, mouth);
    return;
  }
  const mouth = 0.08 + 0.62 * Math.abs(Math.sin(pac.eatPhase));
  let angle = 0;
  if (pac.dir.y === -1) angle = -Math.PI / 2;
  else if (pac.dir.y === 1) angle = Math.PI / 2;
  else if (pac.dir.x === -1) angle = Math.PI;
  drawPacmanShape(pac.x, HUD_TOP + pac.y, 9, angle, mouth);
}

function drawGhostBody(x, y, color, frightened, flashing, dir, eyesOnly, bob) {
  const w = 18, h = 18;
  const top = y - h / 2 + (bob || 0);
  ctx.save();
  if (!eyesOnly) {
    ctx.fillStyle = frightened ? (flashing ? "#f4f4ff" : "#2121de") : color;
    ctx.beginPath();
    ctx.arc(x, top + 9, 9, Math.PI, 0);
    ctx.lineTo(x + 9, top + h - 3);
    const wob = Math.sin(G.t * 12) > 0 ? 3 : -3;
    ctx.lineTo(x + 6, top + h - 6 + wob * 0.4);
    ctx.lineTo(x + 3, top + h - 3);
    ctx.lineTo(x, top + h - 6 - wob * 0.4);
    ctx.lineTo(x - 3, top + h - 3);
    ctx.lineTo(x - 6, top + h - 6 + wob * 0.4);
    ctx.lineTo(x - 9, top + h - 3);
    ctx.closePath();
    ctx.fill();
  }
  if (frightened && !eyesOnly) {
    ctx.fillStyle = flashing ? "#ff3b3b" : "#ffb8ae";
    ctx.fillRect(x - 5, top + 6, 3, 3);
    ctx.fillRect(x + 2, top + 6, 3, 3);
    ctx.strokeStyle = flashing ? "#ff3b3b" : "#ffb8ae";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 6, top + 13);
    ctx.lineTo(x - 3, top + 11);
    ctx.lineTo(x, top + 13);
    ctx.lineTo(x + 3, top + 11);
    ctx.lineTo(x + 6, top + 13);
    ctx.stroke();
  } else {
    const ox = dir.x * 2, oy = dir.y * 2;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x - 3.5, top + 7, 3.4, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 3.5, top + 7, 3.4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2121de";
    ctx.beginPath();
    ctx.arc(x - 3.5 + ox, top + 7.5 + oy, 1.8, 0, Math.PI * 2);
    ctx.arc(x + 3.5 + ox, top + 7.5 + oy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGhosts() {
  if (G.state === "dying" || G.state === "gameover") return;
  const flashing = G.frightT > 0 && G.frightT < 2 && (G.frightT * 5) % 1 < 0.5;
  for (const g of ghosts) {
    const eyesOnly = g.state === "eyes" || g.state === "entering";
    const frightened = (g.state === "frightened" || ((g.state === "house" || g.state === "leaving") && G.frightT > 0)) && !eyesOnly;
    const bob = g.state === "house" ? Math.sin(G.t * 4 + g.bob) * 2 : 0;
    drawGhostBody(g.x, HUD_TOP + g.y, g.color, frightened, flashing, g.dir, eyesOnly, bob);
  }
}

function arcadeText(text, x, y, size, color, align = "center") {
  ctx.fillStyle = color;
  ctx.font = size + 'px "Press Start 2P", monospace';
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function drawHUD() {
  arcadeText("1UP", 40, 14, 9, "#fff");
  arcadeText(String(G.score).padStart(2, "0"), 40, 30, 9, "#fff");
  arcadeText("HIGH SCORE", W / 2, 14, 9, "#fff");
  arcadeText(String(G.hi).padStart(2, "0"), W / 2, 30, 9, "#fff");
  arcadeText("LV " + G.level, W - 44, 22, 9, "#ffb8ae");

  const y = HUD_TOP + FIELD_H + 20;
  for (let i = 0; i < Math.max(0, G.lives - 1); i++) {
    ctx.save();
    ctx.translate(26 + i * 26, y);
    ctx.fillStyle = "#ffe600";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 9, 0.3, Math.PI * 2 - 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  const shown = Math.min(G.level, 7);
  for (let i = 0; i < shown; i++) {
    const x = W - 30 - i * 24;
    ctx.fillStyle = "#ff2d2d";
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#00c853";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 4, y - 11); ctx.stroke();
  }
}

function drawAttract() {
  ctx.fillStyle = "rgba(0, 0, 8, 0.85)";
  ctx.fillRect(0, 0, W, H);

  arcadeText("PAC-MAN", W / 2, 110, 40, "#ffe600");
  arcadeText("A R C A D E", W / 2, 150, 12, "#7f9bff");

  const names = ["BLINKY", "PINKY", "INKY", "CLYDE"];
  ghosts.forEach((g, i) => {
    const x = W / 2 - 135 + i * 90;
    const y = 240 + Math.sin(G.t * 3 + i) * 4;
    drawGhostBody(x, y, g.color, false, false, DIRS.down, false, 0);
    arcadeText(names[i], x, y + 26, 7, g.color);
  });

  if ((G.t * 2) % 1 < 0.6) arcadeText("INSERT COIN", W / 2, 330, 14, "#ffe600");
  arcadeText("PRESS ENTER / TAP TO START", W / 2, 372, 9, "#fff");

  arcadeText("PANAH / WASD : GERAK   ·   P : PAUSE   ·   M : SUARA", W / 2, 420, 7, "#8a8fff");
  arcadeText("DI HP : SWIPE ATAU GUNAKAN TOMBOL ARAH", W / 2, 438, 7, "#8a8fff");

  arcadeText("KUMPULKAN SEMUA COIN · HINDARI HANTU", W / 2, 480, 7, "#ffb8ae");
  arcadeText("POWER PELLET = HANTU BISA DIMAKAN!", W / 2, 498, 7, "#ffb8ae");

  arcadeText("© 2026 HAQQIRAHMAN ARCADE", W / 2, 560, 7, "#555");
}

function drawOverlays() {
  const cy = HUD_TOP + 17 * TILE + 10;
  if (G.state === "ready") {
    if (G.readyT > 0.5 || (G.t * 4) % 1 < 0.6) arcadeText("READY!", W / 2, cy, 14, "#ffe600");
  } else if (G.state === "gameover") {
    arcadeText("GAME OVER", W / 2, cy, 16, "#ff3b3b");
    arcadeText("TEKAN ENTER / TAP UNTUK COBA LAGI", W / 2, cy + 30, 8, "#fff");
  } else if (G.state === "paused") {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, H);
    arcadeText("PAUSED", W / 2, H / 2 - 10, 16, "#ffe600");
    arcadeText("TEKAN P UNTUK LANJUT", W / 2, H / 2 + 20, 8, "#fff");
  }
  if (G.state === "attract") drawAttract();
}

function drawPopups() {
  for (const p of G.popups) {
    ctx.globalAlpha = Math.min(1, p.t * 2);
    arcadeText(p.text, p.x, HUD_TOP + p.y, 8, p.color);
    ctx.globalAlpha = 1;
  }
}

function render() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#000008";
  ctx.fillRect(0, 0, W, H);

  const blinkMaze = G.state === "levelclear" && (G.clearT * 4) % 1 < 0.5;
  if (!blinkMaze) ctx.drawImage(mazeCanvas, 0, HUD_TOP, W, FIELD_H);

  drawPellets();
  if (G.state !== "attract") {
    drawFruit();
    drawGhosts();
    drawPacman();
    drawPopups();
  }
  drawHUD();
  drawOverlays();
}

/* ---------------- Input ---------------- */
function setDir(name) {
  pac.nextDir = DIRS[name];
  Sound.init();
}

function primaryAction() {
  Sound.init();
  if (G.state === "attract" || G.state === "gameover") startGame();
  else if (G.state === "paused") {
    G.state = G.prevState;
    if (G.state === "playing") Sound.sirenStart(G.frightT > 0);
  }
}

document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  const dirMap = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
  if (dirMap[k]) {
    e.preventDefault();
    setDir(dirMap[k]);
    return;
  }
  if (k === "enter" || k === " ") {
    e.preventDefault();
    primaryAction();
  } else if (k === "p") {
    if (G.state === "playing" || G.state === "ready") {
      G.prevState = G.state; G.state = "paused"; Sound.sirenStop();
    } else if (G.state === "paused") {
      G.state = G.prevState;
      if (G.state === "playing") Sound.sirenStart(G.frightT > 0);
    }
  } else if (k === "m") {
    Sound.init();
    Sound.setMuted(!Sound.muted);
    syncMuteButton();
  }
});

/* touch: continuous swipe steering (no need to lift the finger), tap = start */
let touchAnchor = null;
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  Sound.init();
  const t = e.changedTouches[0];
  touchAnchor = { x: t.clientX, y: t.clientY };
}, { passive: false });
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (!touchAnchor) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchAnchor.x, dy = t.clientY - touchAnchor.y;
  if (Math.hypot(dx, dy) >= 22) {
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? "right" : "left");
    else setDir(dy > 0 ? "down" : "up");
    touchAnchor = { x: t.clientX, y: t.clientY }; // re-anchor for the next swipe
  }
}, { passive: false });
canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  touchAnchor = null;
  primaryAction(); // a tap (or swipe release) starts / resumes; no-op while playing
}, { passive: false });

/* on-screen d-pad (always visible) */
document.querySelectorAll("#dpad button").forEach((btn) => {
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    primaryAction();
    setDir(btn.dataset.dir);
  });
});

canvas.addEventListener("click", () => primaryAction());

const muteBtn = document.getElementById("mute");
function syncMuteButton() { muteBtn.textContent = Sound.muted ? "🔇 SUARA OFF" : "🔊 SUARA ON"; }
muteBtn.addEventListener("click", () => {
  Sound.init();
  Sound.setMuted(!Sound.muted);
  syncMuteButton();
});
syncMuteButton();

document.addEventListener("visibilitychange", () => {
  if (document.hidden && G.state === "playing") {
    G.prevState = "playing"; G.state = "paused"; Sound.sirenStop();
  }
});

/* ---------------- Main loop ----------------
   Driven by BOTH requestAnimationFrame and a setInterval fallback:
   some environments (embedded webviews, occluded windows, power
   saving) starve rAF completely, which would freeze the game. The
   >=8ms guard prevents double-stepping when both drivers fire. */
let last = performance.now();
function tick() {
  const now = performance.now();
  if (now - last < 8) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
}
setInterval(tick, 33);
requestAnimationFrame(tick);
resetLevel();
G.state = "attract";
requestAnimationFrame(tick);
