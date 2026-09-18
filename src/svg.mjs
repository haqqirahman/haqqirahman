function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildPacmanSvg({ username, totalContributions, weeks }) {
  const cell = 11;
  const gap = 4;
  const step = cell + gap; // 15
  const left = 32;
  const top = 80;
  const days = 7;

  const weekCount = Math.max(1, weeks.length);
  const graphWidth = weekCount * step;
  const width = graphWidth + left * 2;
  const height = 250;

  const palette = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

  let squares = "";
  const route = [];

  weeks.forEach((week, wi) => {
    const ordered = wi % 2 === 0
      ? week.contributionDays
      : [...week.contributionDays].reverse();

    ordered.forEach((day, oi) => {
      const di = wi % 2 === 0 ? oi : (days - 1 - oi);
      const x = left + wi * step;
      const y = top + di * step;
      const count = day.contributionCount ?? 0;

      let level = 0;
      if (count > 0) level = 1;
      if (count >= 3) level = 2;
      if (count >= 6) level = 3;
      if (count >= 10) level = 4;

      squares += `
        <rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2.5"
              fill="${palette[level]}" opacity="0.95">
          <title>${esc(day.date)} — ${count} contributions</title>
        </rect>`;

      route.push([x + cell / 2, y + cell / 2]);
    });
  });

  // Closed circuit: bottom corridor runway returning back to start point
  if (route.length > 1) {
    const [lastX] = route[route.length - 1];
    const [firstX, firstY] = route[0];
    const bottomCorridorY = top + days * step + 8; // y = 193

    route.push([lastX, bottomCorridorY]);
    route.push([firstX - 16, bottomCorridorY]);
    route.push([firstX - 16, firstY]);
    route.push([firstX, firstY]);
  }

  const pathD = route.length
    ? route.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + " Z"
    : `M ${left} ${top} Z`;

  const dur = "48s";

  // Coordinates for Power Pellets (4 corners)
  const x1 = left + cell / 2;
  const y1 = top + cell / 2;
  const x2 = left + (weekCount - 1) * step + cell / 2;
  const y2 = top + 6 * step + cell / 2;
  const midX = width / 2;

  // Labyrinth Neon Obstacle Walls (Halangan Arcade Klasik)
  const mazeWalls = `
    <!-- OUTER MAZE DOUBLE BORDER (NEON BLUE) -->
    <rect x="${left - 12}" y="${top - 12}" width="${graphWidth + 24}" height="${days * step + 32}" rx="8"
          fill="none" stroke="#1d4ed8" stroke-width="2.5" opacity="0.85"/>
    <rect x="${left - 15}" y="${top - 15}" width="${graphWidth + 30}" height="${days * step + 38}" rx="11"
          fill="none" stroke="#1e40af" stroke-width="1.2" opacity="0.45"/>

    <!-- INNER OBSTACLES & DIVIDERS (HALANGAN) -->
    <!-- Top dividers -->
    <path d="M ${left + 4 * step} ${top - 6} L ${left + 14 * step} ${top - 6}" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
    <path d="M ${left + 20 * step} ${top - 6} L ${left + 32 * step} ${top - 6}" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
    <path d="M ${left + 38 * step} ${top - 6} L ${left + 48 * step} ${top - 6}" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>

    <!-- Bottom runway divider -->
    <path d="M ${left - 6} ${top + days * step} L ${left + graphWidth + 6} ${top + days * step}"
          stroke="#1d4ed8" stroke-width="1.8" stroke-dasharray="6 4" opacity="0.6"/>

    <!-- GHOST HOUSE / BASE (CENTER BOTTOM) -->
    <g transform="translate(${midX - 35}, ${top + days * step + 2})">
      <rect x="0" y="0" width="70" height="14" rx="3" fill="#0b0f19" stroke="#2563eb" stroke-width="1.5"/>
      <!-- Pink Ghost Gate -->
      <line x1="22" y1="0" x2="48" y2="0" stroke="#f472b6" stroke-width="2" stroke-dasharray="3 2"/>
      <text x="35" y="10" fill="#60a5fa" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">GHOSTS</text>
    </g>
  `;

  // Pellets / Coins along the bottom runway corridor
  let corridorCoins = "";
  for (let cx = left + 10; cx < left + graphWidth - 10; cx += 22) {
    corridorCoins += `<circle cx="${cx}" cy="${top + days * step + 8}" r="2" fill="#ffd60a" opacity="0.85"/>`;
  }

  // 4 Power Pellets (Bisa Jadi Kuat)
  const powerPellets = `
    <!-- Top-Left Energizer (Eaten at ~18s to trigger Power Mode) -->
    <g>
      <circle cx="${x1}" cy="${y1}" r="5" fill="#ffd60a">
        <animate attributeName="r" values="3.5; 6; 3.5" dur="0.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity"
                 values="1; 1; 0; 0; 0; 0; 1"
                 keyTimes="0; 0.375; 0.380; 0.900; 0.950; 0.999; 1"
                 dur="${dur}" repeatCount="indefinite"/>
      </circle>
    </g>
    <!-- Bottom-Left Energizer -->
    <circle cx="${x1}" cy="${y2}" r="5" fill="#ffd60a">
      <animate attributeName="r" values="3.5; 6; 3.5" dur="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.5s" repeatCount="indefinite"/>
    </circle>
    <!-- Top-Right Energizer -->
    <circle cx="${x2}" cy="${y1}" r="5" fill="#ffd60a">
      <animate attributeName="r" values="3.5; 6; 3.5" dur="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.5s" repeatCount="indefinite"/>
    </circle>
    <!-- Bottom-Right Energizer -->
    <circle cx="${x2}" cy="${y2}" r="5" fill="#ffd60a">
      <animate attributeName="r" values="3.5; 6; 3.5" dur="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.5s" repeatCount="indefinite"/>
    </circle>
  `;

  // Ghost generator with Frightened (Blue) Mode, Flashing Warning, and Normal mode
  function renderSmartGhost({ name, defaultColor, beginOffset }) {
    const colorValues = `${defaultColor}; ${defaultColor}; #1d4ed8; #1d4ed8; #ffffff; #1d4ed8; #ffffff; #1d4ed8; ${defaultColor}; ${defaultColor}`;
    const colorKeyTimes = `0; 0.374; 0.375; 0.583; 0.604; 0.625; 0.646; 0.666; 0.667; 1`;

    return `
    <!-- Ghost: ${name} -->
    <g>
      <!-- Ghost Root with Floating Bobbing -->
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0 -1; 0 1; 0 -1" dur="0.4s" repeatCount="indefinite" additive="sum"/>

        <!-- Ghost Body with Animated Tentacles & State Color Switching -->
        <path d="M -5.5 -1 A 5.5 5.5 0 0 1 5.5 -1 L 5.5 5.5 Q 3.7 3.5 1.8 5.5 Q 0 3.5 -1.8 5.5 Q -3.7 3.5 -5.5 5.5 Z" fill="${defaultColor}">
          <animate attributeName="fill"
            values="${colorValues}" keyTimes="${colorKeyTimes}" dur="${dur}" repeatCount="indefinite"/>
          <animate attributeName="d"
            values="
              M -5.5 -1 A 5.5 5.5 0 0 1 5.5 -1 L 5.5 5.5 Q 3.7 3.5 1.8 5.5 Q 0 3.5 -1.8 5.5 Q -3.7 3.5 -5.5 5.5 Z;
              M -5.5 -1 A 5.5 5.5 0 0 1 5.5 -1 L 5.5 4 Q 3.7 6 1.8 4 Q 0 6 -1.8 4 Q -3.7 6 -5.5 4 Z;
              M -5.5 -1 A 5.5 5.5 0 0 1 5.5 -1 L 5.5 5.5 Q 3.7 3.5 1.8 5.5 Q 0 3.5 -1.8 5.5 Q -3.7 3.5 -5.5 5.5 Z"
            dur="0.25s" repeatCount="indefinite"/>
        </path>

        <!-- Normal Eyes (White with Blue pupils) -->
        <g>
          <animate attributeName="opacity"
            values="1; 1; 0; 0; 1; 1"
            keyTimes="0; 0.374; 0.375; 0.666; 0.667; 1"
            dur="${dur}" repeatCount="indefinite"/>
          <ellipse cx="-2" cy="-1.5" rx="2" ry="2.4" fill="#ffffff"/>
          <ellipse cx="2.4" cy="-1.5" rx="2" ry="2.4" fill="#ffffff"/>
          <ellipse cx="-1.2" cy="-1.5" rx="1.1" ry="1.4" fill="#1e3a8a"/>
          <ellipse cx="3.2" cy="-1.5" rx="1.1" ry="1.4" fill="#1e3a8a"/>
        </g>

        <!-- Frightened Face (Small yellow eyes & wavy mouth) -->
        <g opacity="0">
          <animate attributeName="opacity"
            values="0; 0; 1; 1; 0; 0"
            keyTimes="0; 0.374; 0.375; 0.666; 0.667; 1"
            dur="${dur}" repeatCount="indefinite"/>
          <rect x="-3" y="-2.5" width="2" height="2" fill="#ffd60a" rx="0.5"/>
          <rect x="1.5" y="-2.5" width="2" height="2" fill="#ffd60a" rx="0.5"/>
          <path d="M -3.5 1.5 Q -2 0.5 -0.5 1.5 Q 1 0.5 2.5 1.5 Q 3.5 0.5 4 1.5"
                fill="none" stroke="#ffd60a" stroke-width="1" stroke-linecap="round"/>
        </g>
      </g>

      <!-- Path Motion along Maze without rotation (keeps ghosts upright) -->
      <animateMotion dur="${dur}" repeatCount="indefinite" begin="${beginOffset}" path="${pathD}"/>
    </g>`;
  }

  const ghosts = [
    renderSmartGhost({ name: "Blinky (Red)",   defaultColor: "#ff0000", beginOffset: "-0.80s" }),
    renderSmartGhost({ name: "Pinky (Pink)",   defaultColor: "#ffb8de", beginOffset: "-0.54s" }),
    renderSmartGhost({ name: "Inky (Cyan)",    defaultColor: "#00ffff", beginOffset: "-0.28s" }),
    renderSmartGhost({ name: "Clyde (Orange)", defaultColor: "#ffb847", beginOffset: "0s" })
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     role="img" aria-label="Authentic Pac-Man Arcade Contribution Graph for ${esc(username)}">
  <style>
    .bg { fill: #080c14; }
    .title {
      fill: #f0f6fc;
      font: 700 16px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      letter-spacing: 0.5px;
    }
    .score-lbl {
      fill: #e3b341;
      font: 700 11px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
      letter-spacing: 1px;
    }
    .score-val {
      fill: #ffffff;
      font: 700 12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    }
    .meta {
      fill: #8b949e;
      font: 11px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    }
    .mode-badge {
      font: 700 11px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
      letter-spacing: 1.5px;
    }
    .ready-banner {
      fill: #ffeb3b;
      font: 900 18px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
      letter-spacing: 3px;
      filter: drop-shadow(0 0 6px rgba(255, 235, 59, 0.7));
    }
    @media (prefers-color-scheme: light) {
      .bg { fill: #ffffff; }
      .title { fill: #1f2328; }
      .meta { fill: #57606a; }
      .score-lbl { fill: #b08800; }
      .score-val { fill: #1f2328; }
    }
  </style>

  <!-- Background Arcade Cabinet -->
  <rect class="bg" x="0" y="0" width="100%" height="100%" rx="14"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="14" fill="none" stroke="#21262d" stroke-width="1.5"/>

  <!-- ARCADE HEADER -->
  <text class="title" x="${left}" y="28">🕹️ PAC-MAN ARCADE: CONTRIBUTION EDITION</text>
  
  <text class="score-lbl" x="${left}" y="48">
    1UP <tspan class="score-val">${totalContributions * 10}</tspan>
    &nbsp;&nbsp;&nbsp;&nbsp;HIGH SCORE <tspan class="score-val">${Math.max(totalContributions * 10, 9999)}</tspan>
  </text>
  
  <!-- REAL-TIME STATUS BADGE (Changes between CHASE, POWER UP, and RESPAWN) -->
  <g transform="translate(${midX}, 44)">
    <!-- Status 1: CHASE MODE (0 - 18s and 32 - 40s) -->
    <text class="mode-badge" x="0" y="0" fill="#f87171" text-anchor="middle" opacity="1">
      <animate attributeName="opacity"
        values="1; 1; 0; 0; 1; 1; 0; 0; 1"
        keyTimes="0; 0.374; 0.375; 0.666; 0.667; 0.833; 0.834; 0.999; 1"
        dur="${dur}" repeatCount="indefinite"/>
      ⚠️ GHOST CHASE ACTIVE
    </text>

    <!-- Status 2: POWER MODE! (18s - 32s) -->
    <text class="mode-badge" x="0" y="0" fill="#38bdf8" text-anchor="middle" opacity="0">
      <animate attributeName="opacity"
        values="0; 0; 1; 1; 0; 0"
        keyTimes="0; 0.374; 0.375; 0.666; 0.667; 1"
        dur="${dur}" repeatCount="indefinite"/>
      ⚡ POWER PELLET: HUNT THE GHOSTS! ⚡
    </text>

    <!-- Status 3: READY / RESPAWN (40s - 48s) -->
    <text class="mode-badge" x="0" y="0" fill="#facc15" text-anchor="middle" opacity="0">
      <animate attributeName="opacity"
        values="0; 0; 1; 1; 0"
        keyTimes="0; 0.833; 0.834; 0.999; 1"
        dur="${dur}" repeatCount="indefinite"/>
      ✨ RESPAWNING... GET READY! ✨
    </text>
  </g>

  <text class="score-lbl" x="${width - left}" y="28" text-anchor="end">
    PLAYER <tspan class="score-val">${esc(username.toUpperCase())}</tspan>
  </text>
  <text class="meta" x="${width - left}" y="48" text-anchor="end">
    CONTRIBUTIONS: ${totalContributions}
  </text>

  <!-- Labyrinth Neon Maze Walls (Halangan) -->
  ${mazeWalls}

  <!-- Corridor Pellets (Coins) -->
  ${corridorCoins}

  <!-- Contribution Heatmap Grid -->
  ${squares}

  <!-- 4 Pulsing Power Pellets (Bisa Jadi Kuat) -->
  ${powerPellets}

  <!-- +200 BONUS SCORE POPUP (When eating ghost during power mode at ~22s) -->
  <g opacity="0">
    <animate attributeName="opacity"
      values="0; 0; 1; 1; 0; 0"
      keyTimes="0; 0.44; 0.46; 0.52; 0.54; 1"
      dur="${dur}" repeatCount="indefinite"/>
    <animateTransform attributeName="transform" type="translate"
      values="${x1 + 40} ${y1 + 10}; ${x1 + 40} ${y1 - 12}"
      keyTimes="0; 1" dur="1.2s" begin="21.5s" repeatCount="indefinite"/>
    <text x="0" y="0" fill="#38bdf8" font-size="12" font-family="monospace" font-weight="900" text-anchor="middle">
      +200
    </text>
  </g>

  <!-- ================= CHARACTERS LAYER ================= -->

  <!-- PAC-MAN (Leader, with Power Aura, Chomp, Death Spin & Respawn) -->
  <g>
    <!-- Master Motion along Maze Path -->
    <animateMotion dur="${dur}" repeatCount="indefinite" rotate="auto" begin="-1.15s" path="${pathD}"/>

    <!-- Death Shrink & Spin Transform (At 40s - 43s) -->
    <g>
      <!-- Scale Animation: normal 1 -> shrinks to 0 at death (40s - 43s) -> respawns at 45s -->
      <animateTransform attributeName="transform" type="scale"
        values="1; 1; 1; 0.1; 0; 0; 1; 1"
        keyTimes="0; 0.833; 0.835; 0.880; 0.885; 0.937; 0.940; 1"
        dur="${dur}" repeatCount="indefinite" additive="sum"/>
      
      <animateTransform attributeName="transform" type="rotate"
        values="0; 0; 0; 1080; 1080; 0; 0"
        keyTimes="0; 0.833; 0.835; 0.880; 0.937; 0.940; 1"
        dur="${dur}" repeatCount="indefinite" additive="sum"/>

      <!-- Golden Power Aura Ring (Active when Pac-Man is Strong: 18s - 32s) -->
      <circle cx="0" cy="0" r="9" fill="none" stroke="#ffd60a" stroke-width="2" stroke-dasharray="3 2" opacity="0">
        <animate attributeName="opacity"
          values="0; 0; 0.9; 0.9; 0; 0"
          keyTimes="0; 0.374; 0.375; 0.666; 0.667; 1"
          dur="${dur}" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1s" repeatCount="indefinite"/>
      </circle>

      <!-- Yellow Pac-Man Body -->
      <circle cx="0" cy="0" r="${cell * 0.48}" fill="#ffd60a"/>

      <!-- Chomping Animated Mouth -->
      <path d="M 0 0 L ${cell * 0.65} ${-cell * 0.4} L ${cell * 0.65} ${cell * 0.4} Z" fill="#080c14">
        <animate attributeName="d"
          values="
            M 0 0 L ${cell * 0.65} ${-cell * 0.4} L ${cell * 0.65} ${cell * 0.4} Z;
            M 0 0 L ${cell * 0.65} -0.5 L ${cell * 0.65} 0.5 Z;
            M 0 0 L ${cell * 0.65} ${-cell * 0.4} L ${cell * 0.65} ${cell * 0.4} Z"
          dur="0.22s" repeatCount="indefinite"/>
      </path>

      <!-- Pac-Man Eye -->
      <circle cx="${cell * 0.15}" cy="${-cell * 0.22}" r="1" fill="#111827"/>
    </g>
  </g>

  <!-- THE 4 GHOSTS (Blinky, Pinky, Inky, Clyde) -->
  ${ghosts}

  <!-- DEATH BURST SPARKS (At 42s when Pac-Man dies) -->
  <g transform="translate(${x1 + 60}, ${y1 + 45})" opacity="0">
    <animate attributeName="opacity"
      values="0; 0; 1; 1; 0; 0"
      keyTimes="0; 0.874; 0.875; 0.895; 0.896; 1"
      dur="${dur}" repeatCount="indefinite"/>
    <!-- 4 popping sparks -->
    <circle cx="-5" cy="-5" r="1.5" fill="#facc15"/>
    <circle cx="5"  cy="-5" r="1.5" fill="#facc15"/>
    <circle cx="-5" cy="5"  r="1.5" fill="#facc15"/>
    <circle cx="5"  cy="5"  r="1.5" fill="#facc15"/>
  </g>

  <!-- "READY!" ARCADE BANNER (Flashes at 44s - 47s during respawn) -->
  <g transform="translate(${midX}, ${top + 45})" opacity="0">
    <animate attributeName="opacity"
      values="0; 0; 1; 0.2; 1; 0.2; 1; 0; 0"
      keyTimes="0; 0.916; 0.917; 0.935; 0.950; 0.965; 0.979; 0.980; 1"
      dur="${dur}" repeatCount="indefinite"/>
    <rect x="-60" y="-16" width="120" height="24" rx="4" fill="#0b0f19" stroke="#ffeb3b" stroke-width="1.5"/>
    <text class="ready-banner" x="0" y="2" text-anchor="middle">READY!</text>
  </g>

  <!-- ================= ARCADE FOOTER ================= -->
  <!-- Lives counter (drops from 3 to 2 during death sequence at 42s) -->
  <g transform="translate(${left}, ${height - 14})">
    <text class="meta" x="0" y="0">LIVES:</text>
    <circle cx="52" cy="-4" r="5" fill="#ffd60a"/>
    <circle cx="68" cy="-4" r="5" fill="#ffd60a"/>
    <!-- 3rd Life Pac-Man: disappears at death (42s) and returns at respawn (47s) -->
    <circle cx="84" cy="-4" r="5" fill="#ffd60a">
      <animate attributeName="opacity"
        values="1; 1; 0; 0; 1; 1"
        keyTimes="0; 0.875; 0.876; 0.979; 0.980; 1"
        dur="${dur}" repeatCount="indefinite"/>
    </circle>
  </g>

  <!-- Middle footer text -->
  <text class="meta" x="${midX}" y="${height - 14}" text-anchor="middle">
    🔴 BLINKY &nbsp; 🌸 PINKY &nbsp; 🔷 INKY &nbsp; 🟠 CLYDE &nbsp;•&nbsp; ${totalContributions} CONTRIBUTIONS
  </text>

  <!-- Right fruit bonus -->
  <text class="meta" x="${width - left}" y="${height - 14}" text-anchor="end">
    BONUS: 🍒 CHERRY (100 PTS)
  </text>
</svg>`;
}
