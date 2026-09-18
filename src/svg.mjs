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
  const top = 56;
  const days = 7;

  const weekCount = Math.max(1, weeks.length);
  const graphWidth = weekCount * step;
  const width = graphWidth + left * 2;
  const height = top + days * step + 32; // ~193px compact arcade frame

  const palette = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

  // Grid squares
  let squares = "";
  weeks.forEach((week, wi) => {
    week.contributionDays.forEach((day, di) => {
      const x = left + wi * step;
      const y = top + di * step;
      const count = day.contributionCount ?? 0;

      let level = 0;
      if (count > 0) level = 1;
      if (count >= 3) level = 2;
      if (count >= 6) level = 3;
      if (count >= 10) level = 4;

      squares += `
        <rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2"
              fill="${palette[level]}" opacity="0.95">
          <title>${esc(day.date)} — ${count} contributions</title>
        </rect>`;
    });
  });

  // Helper to get pixel center coordinate for cell (col, row)
  const pt = (c, r) => [left + c * step + cell / 2, top + r * step + cell / 2];

  // Dynamic labyrinth route with combined turns, horizontal sweeps, dives, and loops (not a simple vertical snake!)
  const routePoints = [
    pt(0, 0),
    pt(6, 0),
    pt(6, 2),
    pt(14, 2),
    pt(14, 4),
    pt(8, 4),
    pt(8, 6),
    pt(20, 6),
    pt(20, 3),
    pt(25, 3),
    pt(25, 1),
    pt(32, 1),
    pt(32, 3),
    pt(38, 3),
    pt(38, 0),
    pt(46, 0),
    pt(46, 3),
    pt(52, 3),
    pt(52, 6),
    pt(42, 6),
    pt(42, 4),
    pt(34, 4),
    pt(34, 6),
    pt(24, 6),
    pt(24, 4),
    pt(16, 4),
    pt(16, 1),
    pt(2, 1),
    pt(2, 5),
    pt(0, 5),
    pt(0, 0)
  ];

  const pathD = routePoints.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + " Z";

  const dur = "54s";

  // Authentic white/silver maze walls matching the user's reference image
  const gx = (c) => left + c * step - gap / 2;
  const gy = (r) => top + r * step - gap / 2;

  const mazeWalls = `
    <!-- Labyrinth Walls (White / Silver with rounded bends like the reference image) -->
    <g fill="none" stroke="#e2e8f0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.88">
      <!-- Section 1 (Left: cols 0 - 15) -->
      <path d="M ${gx(5)} ${top - 4} L ${gx(5)} ${gy(3)} L ${gx(1)} ${gy(3)}"/>
      <path d="M ${gx(7)} ${gy(1)} L ${gx(13)} ${gy(1)} L ${gx(13)} ${gy(4)} L ${gx(7)} ${gy(4)} L ${gx(7)} ${gy(5)}"/>
      <path d="M ${gx(1)} ${gy(5)} L ${gx(5)} ${gy(5)}"/>
      <path d="M ${gx(9)} ${gy(6)} L ${gx(15)} ${gy(6)}"/>

      <!-- Section 2 (Center-Left: cols 15 - 26) -->
      <path d="M ${gx(15)} ${gy(2)} L ${gx(24)} ${gy(2)}"/>
      <path d="M ${gx(20)} ${gy(2)} L ${gx(20)} ${gy(5)}"/>
      <path d="M ${gx(17)} ${gy(4)} L ${gx(24)} ${gy(4)}"/>
      <path d="M ${gx(22)} ${gy(5)} L ${gx(25)} ${gy(5)}"/>

      <!-- Section 3 (Center Arch / Divider: cols 26 - 28) -->
      <path d="M ${gx(26)} ${top - 6} L ${gx(26)} ${gy(2)}"/>
      <path d="M ${gx(28)} ${top - 6} L ${gx(28)} ${gy(2)}"/>
      <path d="M ${gx(25)} ${gy(3)} L ${gx(29)} ${gy(3)}"/>
      <path d="M ${gx(27)} ${gy(4)} L ${gx(27)} ${gy(6)}"/>

      <!-- Section 4 (Center-Right: cols 28 - 40) -->
      <path d="M ${gx(30)} ${gy(2)} L ${gx(37)} ${gy(2)}"/>
      <path d="M ${gx(33)} ${gy(2)} L ${gx(33)} ${gy(5)}"/>
      <path d="M ${gx(30)} ${gy(4)} L ${gx(37)} ${gy(4)}"/>
      <path d="M ${gx(35)} ${gy(5)} L ${gx(39)} ${gy(5)}"/>

      <!-- Section 5 (Right: cols 40 - 53) -->
      <path d="M ${gx(41)} ${top - 4} L ${gx(41)} ${gy(3)} L ${gx(45)} ${gy(3)}"/>
      <path d="M ${gx(43)} ${gy(1)} L ${gx(50)} ${gy(1)} L ${gx(50)} ${gy(4)}"/>
      <path d="M ${gx(45)} ${gy(5)} L ${gx(52)} ${gy(5)}"/>
      <path d="M ${gx(48)} ${gy(2)} L ${gx(48)} ${gy(6)}"/>
    </g>
  `;

  // Months labels along top matching reference image
  const monthLabels = [
    { name: "Apr", col: 1 },
    { name: "May", col: 5 },
    { name: "Jun", col: 10 },
    { name: "Jul", col: 14 },
    { name: "Aug", col: 18 },
    { name: "Sep", col: 23 },
    { name: "Oct", col: 27 },
    { name: "Nov", col: 32 },
    { name: "Dec", col: 36 },
    { name: "Jan", col: 40 },
    { name: "Feb", col: 45 },
    { name: "Mar", col: 49 }
  ].map(m => `<text x="${left + m.col * step}" y="${top - 12}" fill="#64748b" font-size="10" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">${m.name}</text>`).join("");

  // Power Pellets in the 4 corners
  const [p1x, p1y] = pt(0, 0);
  const [p2x, p2y] = pt(Math.min(52, weekCount - 1), 0);
  const [p3x, p3y] = pt(0, 6);
  const [p4x, p4y] = pt(Math.min(52, weekCount - 1), 6);

  const powerPellets = `
    <!-- 4 Pulsing Power Pellets at maze junctions -->
    <circle cx="${p1x}" cy="${p1y}" r="4.5" fill="#ffd60a">
      <animate attributeName="r" values="3; 5.5; 3" dur="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${p2x}" cy="${p2y}" r="4.5" fill="#ffd60a">
      <animate attributeName="r" values="3; 5.5; 3" dur="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${p3x}" cy="${p3y}" r="4.5" fill="#ffd60a">
      <animate attributeName="r" values="3; 5.5; 3" dur="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${p4x}" cy="${p4y}" r="4.5" fill="#ffd60a">
      <animate attributeName="r" values="3; 5.5; 3" dur="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.5s" repeatCount="indefinite"/>
    </circle>
  `;

  // Ghost generator with Scared Blue state when Pac-Man is Strong
  function renderSmartGhost({ name, defaultColor, beginOffset }) {
    const colorValues = `${defaultColor}; ${defaultColor}; #1d4ed8; #1d4ed8; #ffffff; #1d4ed8; #ffffff; #1d4ed8; ${defaultColor}; ${defaultColor}`;
    const colorKeyTimes = `0; 0.350; 0.351; 0.550; 0.575; 0.600; 0.625; 0.650; 0.651; 1`;

    return `
    <!-- Ghost: ${name} -->
    <g>
      <!-- Ghost Bobbing -->
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0 -1; 0 1; 0 -1" dur="0.4s" repeatCount="indefinite" additive="sum"/>

        <!-- Ghost Body with Animated Wavy Skirt & Color State -->
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
            keyTimes="0; 0.350; 0.351; 0.650; 0.651; 1"
            dur="${dur}" repeatCount="indefinite"/>
          <ellipse cx="-2" cy="-1.5" rx="2" ry="2.4" fill="#ffffff"/>
          <ellipse cx="2.4" cy="-1.5" rx="2" ry="2.4" fill="#ffffff"/>
          <ellipse cx="-1.2" cy="-1.5" rx="1.1" ry="1.4" fill="#1e3a8a"/>
          <ellipse cx="3.2" cy="-1.5" rx="1.1" ry="1.4" fill="#1e3a8a"/>
        </g>

        <!-- Frightened Face (Scared Ghost expression: small yellow eyes & wavy mouth) -->
        <g opacity="0">
          <animate attributeName="opacity"
            values="0; 0; 1; 1; 0; 0"
            keyTimes="0; 0.350; 0.351; 0.650; 0.651; 1"
            dur="${dur}" repeatCount="indefinite"/>
          <rect x="-3" y="-2.5" width="2" height="2" fill="#ffd60a" rx="0.5"/>
          <rect x="1.5" y="-2.5" width="2" height="2" fill="#ffd60a" rx="0.5"/>
          <path d="M -3.5 1.5 Q -2 0.5 -0.5 1.5 Q 1 0.5 2.5 1.5 Q 3.5 0.5 4 1.5"
                fill="none" stroke="#ffd60a" stroke-width="1" stroke-linecap="round"/>
        </g>
      </g>

      <!-- Path Motion along Maze -->
      <animateMotion dur="${dur}" repeatCount="indefinite" begin="${beginOffset}" path="${pathD}"/>
    </g>`;
  }

  // Spaced out along the maze
  const ghosts = [
    renderSmartGhost({ name: "Blinky (Red)",   defaultColor: "#ff0000", beginOffset: "-0.90s" }),
    renderSmartGhost({ name: "Pinky (Pink)",   defaultColor: "#ffb8de", beginOffset: "-1.80s" }),
    renderSmartGhost({ name: "Inky (Cyan)",    defaultColor: "#00ffff", beginOffset: "-2.70s" }),
    renderSmartGhost({ name: "Clyde (Orange)", defaultColor: "#ffb847", beginOffset: "-3.60s" })
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     role="img" aria-label="Authentic Pac-Man Maze Contribution Graph for ${esc(username)}">
  <style>
    .bg { fill: #0d1117; }
    .ready-banner {
      fill: #ffeb3b;
      font: 900 16px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
      letter-spacing: 2px;
    }
    @media (prefers-color-scheme: light) {
      .bg { fill: #ffffff; }
    }
  </style>

  <!-- Background Canvas -->
  <rect class="bg" x="0" y="0" width="100%" height="100%" rx="8"/>

  <!-- Month Labels along Top -->
  ${monthLabels}

  <!-- Contribution Heatmap Grid -->
  ${squares}

  <!-- Labyrinth Maze Walls (Halangan) -->
  ${mazeWalls}

  <!-- Pulsing Corner Power Pellets -->
  ${powerPellets}

  <!-- +200 BONUS SCORE POPUP (When eating ghost during power mode at ~22s) -->
  <g opacity="0">
    <animate attributeName="opacity"
      values="0; 0; 1; 1; 0; 0"
      keyTimes="0; 0.40; 0.42; 0.48; 0.50; 1"
      dur="${dur}" repeatCount="indefinite"/>
    <text x="${left + 26 * step}" y="${top + 2 * step}" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="900" text-anchor="middle">
      +200
    </text>
  </g>

  <!-- ================= CHARACTERS LAYER ================= -->

  <!-- PAC-MAN (Leader, with Power Aura, Chomp, Death Spin & Respawn) -->
  <g>
    <!-- Master Motion along Dynamic Maze Path -->
    <animateMotion dur="${dur}" repeatCount="indefinite" rotate="auto" begin="0s" path="${pathD}"/>

    <!-- Death Shrink & Spin Transform (At 42s - 45s) -->
    <g>
      <!-- Scale Animation: normal 1 -> shrinks to 0 at death (42s - 45s) -> respawns at 48s -->
      <animateTransform attributeName="transform" type="scale"
        values="1; 1; 1; 0.1; 0; 0; 1; 1"
        keyTimes="0; 0.777; 0.780; 0.820; 0.825; 0.880; 0.885; 1"
        dur="${dur}" repeatCount="indefinite" additive="sum"/>
      
      <animateTransform attributeName="transform" type="rotate"
        values="0; 0; 0; 1080; 1080; 0; 0"
        keyTimes="0; 0.777; 0.780; 0.820; 0.880; 0.885; 1"
        dur="${dur}" repeatCount="indefinite" additive="sum"/>

      <!-- Golden Power Aura Ring (Active when Pac-Man is Strong: 19s - 35s) -->
      <circle cx="0" cy="0" r="8.5" fill="none" stroke="#ffd60a" stroke-width="1.8" stroke-dasharray="3 2" opacity="0">
        <animate attributeName="opacity"
          values="0; 0; 0.9; 0.9; 0; 0"
          keyTimes="0; 0.350; 0.351; 0.650; 0.651; 1"
          dur="${dur}" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1s" repeatCount="indefinite"/>
      </circle>

      <!-- Yellow Pac-Man Body -->
      <circle cx="0" cy="0" r="${cell * 0.48}" fill="#ffd60a"/>

      <!-- Chomping Animated Mouth -->
      <path d="M 0 0 L ${cell * 0.65} ${-cell * 0.4} L ${cell * 0.65} ${cell * 0.4} Z" fill="#0d1117">
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

  <!-- THE 4 GHOSTS (Blinky, Pinky, Inky, Clyde) traversing the labyrinth -->
  ${ghosts}

  <!-- "READY!" ARCADE BANNER (Flashes at 45s - 48s during respawn) -->
  <g transform="translate(${left + 26 * step}, ${top + 3 * step})" opacity="0">
    <animate attributeName="opacity"
      values="0; 0; 1; 0.2; 1; 0.2; 1; 0; 0"
      keyTimes="0; 0.833; 0.834; 0.850; 0.865; 0.880; 0.890; 0.895; 1"
      dur="${dur}" repeatCount="indefinite"/>
    <rect x="-50" y="-14" width="100" height="20" rx="3" fill="#0b0f19" stroke="#ffeb3b" stroke-width="1.2"/>
    <text class="ready-banner" x="0" y="2" text-anchor="middle">READY!</text>
  </g>
</svg>`;
}
