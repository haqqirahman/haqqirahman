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
  const top = 54;
  const days = 7;

  const weekCount = Math.max(1, weeks.length);
  const graphWidth = weekCount * step;
  const width = graphWidth + left * 2;
  const height = top + days * step + 28; // ~187px clean compact arcade frame

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

  // Helper for cell center coordinate
  const pt = (c, r) => [left + c * step + cell / 2, top + r * step + cell / 2];

  // Natural arcade maze route:
  // Pac-Man navigates around maze islands through genuine horizontal and vertical corridors
  const routePoints = [
    pt(2, 0),
    pt(14, 0),
    pt(14, 2),
    pt(8, 2),
    pt(8, 4),
    pt(20, 4),
    pt(20, 6),
    pt(32, 6),
    pt(32, 4),
    pt(44, 4),
    pt(44, 2),
    pt(52, 2),
    pt(52, 0),
    pt(38, 0),
    pt(38, 2),
    pt(26, 2),
    pt(26, 5),
    pt(14, 5),
    pt(14, 6),
    pt(0, 6),
    pt(0, 0),
    pt(2, 0)
  ];

  const pathD = routePoints.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + " Z";

  const dur = "45s";

  // Authentic maze walls placed strictly in the dead zones between corridors
  // Styled with classic arcade neon blue rounded borders
  const ox = (c) => left + c * step - 2;
  const oy = (r) => top + r * step - 2;
  const ow = (cols) => cols * step - gap;
  const oh = (rows) => rows * step - gap;

  const mazeWalls = `
    <!-- OUTER MAZE PERIMETER (NEON BLUE) -->
    <rect x="${left - 6}" y="${top - 6}" width="${graphWidth + 12}" height="${days * step + 12}" rx="7"
          fill="none" stroke="#2563eb" stroke-width="2" opacity="0.9"/>
    <rect x="${left - 8}" y="${top - 8}" width="${graphWidth + 16}" height="${days * step + 16}" rx="9"
          fill="none" stroke="#1d4ed8" stroke-width="1" opacity="0.4"/>

    <!-- INNER MAZE ISLANDS (HALANGAN LABIRIN - CHARACTERS NAVIGATE AROUND THEM) -->
    <g fill="#0b1120" stroke="#3b82f6" stroke-width="1.8" stroke-linejoin="round" opacity="0.85">
      <!-- Island 1: between Row 0-2 and Col 2-8 -->
      <rect x="${ox(2)}" y="${oy(1)}" width="${ow(6)}" height="${oh(1)}" rx="3"/>
      
      <!-- Island 2: between Row 2-4 and Col 9-14 -->
      <rect x="${ox(9)}" y="${oy(3)}" width="${ow(5)}" height="${oh(1)}" rx="3"/>

      <!-- Island 3: between Row 4-6 and Col 1-8 -->
      <rect x="${ox(1)}" y="${oy(5)}" width="${ow(7)}" height="${oh(1)}" rx="3"/>

      <!-- Island 4: between Row 0-2 and Col 15-25 -->
      <rect x="${ox(15)}" y="${oy(1)}" width="${ow(10)}" height="${oh(1)}" rx="3"/>

      <!-- Island 5: center divider column (ghost house gate) -->
      <rect x="${ox(21)}" y="${oy(5)}" width="${ow(5)}" height="${oh(1)}" rx="3"/>

      <!-- Island 6: between Row 4-6 and Col 27-32 -->
      <rect x="${ox(27)}" y="${oy(5)}" width="${ow(5)}" height="${oh(1)}" rx="3"/>

      <!-- Island 7: between Row 2-4 and Col 27-37 -->
      <rect x="${ox(27)}" y="${oy(3)}" width="${ow(10)}" height="${oh(1)}" rx="3"/>

      <!-- Island 8: between Row 4-6 and Col 33-43 -->
      <rect x="${ox(33)}" y="${oy(5)}" width="${ow(10)}" height="${oh(1)}" rx="3"/>

      <!-- Island 9: between Row 0-2 and Col 39-51 -->
      <rect x="${ox(39)}" y="${oy(1)}" width="${ow(12)}" height="${oh(1)}" rx="3"/>

      <!-- Island 10: between Row 2-4 and Col 45-51 -->
      <rect x="${ox(45)}" y="${oy(3)}" width="${ow(6)}" height="${oh(1)}" rx="3"/>
    </g>
  `;

  // Month labels along top
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

  // 4 Flashing Power Pellets at strategic junctions
  const [p1x, p1y] = pt(14, 0);
  const [p2x, p2y] = pt(Math.min(52, weekCount - 1), 0);
  const [p3x, p3y] = pt(0, 6);
  const [p4x, p4y] = pt(Math.min(32, weekCount - 1), 6);

  const powerPellets = `
    <!-- Power Pellets: Flashing yellow energizers -->
    <circle cx="${p1x}" cy="${p1y}" r="4.5" fill="#ffd60a">
      <animate attributeName="r" values="3.2; 5.5; 3.2" dur="0.45s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.45s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${p2x}" cy="${p2y}" r="4.5" fill="#ffd60a">
      <animate attributeName="r" values="3.2; 5.5; 3.2" dur="0.45s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.45s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${p3x}" cy="${p3y}" r="4.5" fill="#ffd60a">
      <animate attributeName="r" values="3.2; 5.5; 3.2" dur="0.45s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.45s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${p4x}" cy="${p4y}" r="4.5" fill="#ffd60a">
      <animate attributeName="r" values="3.2; 5.5; 3.2" dur="0.45s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.45s" repeatCount="indefinite"/>
    </circle>
  `;

  // Ghost generator:
  // Normal State: 0s to 28s -> defaultColor
  // Scared Blue State (when Pac-Man is Strong): 28s to 37s -> #1d4ed8
  // Flashing Warning: 37s to 40s -> #ffffff / #1d4ed8
  // Normal State: 40s to 45s -> defaultColor
  function renderSmartGhost({ name, defaultColor, beginOffset }) {
    const colorValues = `${defaultColor}; ${defaultColor}; #1d4ed8; #1d4ed8; #ffffff; #1d4ed8; #ffffff; #1d4ed8; ${defaultColor}; ${defaultColor}`;
    const colorKeyTimes = `0; 0.621; 0.622; 0.822; 0.844; 0.866; 0.888; 0.910; 0.911; 1`;

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
            keyTimes="0; 0.621; 0.622; 0.910; 0.911; 1"
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
            keyTimes="0; 0.621; 0.622; 0.910; 0.911; 1"
            dur="${dur}" repeatCount="indefinite"/>
          <rect x="-3" y="-2.5" width="2" height="2" fill="#ffd60a" rx="0.5"/>
          <rect x="1.5" y="-2.5" width="2" height="2" fill="#ffd60a" rx="0.5"/>
          <path d="M -3.5 1.5 Q -2 0.5 -0.5 1.5 Q 1 0.5 2.5 1.5 Q 3.5 0.5 4 1.5"
                fill="none" stroke="#ffd60a" stroke-width="1" stroke-linecap="round"/>
        </g>
      </g>

      <!-- Path Motion along Maze: ghosts trail BEHIND Pac-Man -->
      <animateMotion dur="${dur}" repeatCount="indefinite" begin="${beginOffset}" path="${pathD}"/>
    </g>`;
  }

  // GHOSTS ARE CHASING PAC-MAN:
  // Pac-Man is at begin="-3.2s" (FURTHEST IN FRONT)
  // Blinky is at begin="-2.4s" (0.8s behind Pac-Man)
  // Pinky is at begin="-1.6s" (0.8s behind Blinky)
  // Inky is at begin="-0.8s" (0.8s behind Pinky)
  // Clyde is at begin="0s" (0.8s behind Inky, AT THE BACK)
  const ghosts = [
    renderSmartGhost({ name: "Blinky (Red)",   defaultColor: "#ff0000", beginOffset: "-2.4s" }),
    renderSmartGhost({ name: "Pinky (Pink)",   defaultColor: "#ffb8de", beginOffset: "-1.6s" }),
    renderSmartGhost({ name: "Inky (Cyan)",    defaultColor: "#00ffff", beginOffset: "-0.8s" }),
    renderSmartGhost({ name: "Clyde (Orange)", defaultColor: "#ffb847", beginOffset: "0s" })
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

  <!-- Labyrinth Maze Walls (Halangan) -->
  ${mazeWalls}

  <!-- Contribution Heatmap Grid -->
  ${squares}

  <!-- Pulsing Power Pellets -->
  ${powerPellets}

  <!-- +200 BONUS SCORE POPUP (When Pac-Man catches a ghost during power mode at ~32s) -->
  <g opacity="0">
    <animate attributeName="opacity"
      values="0; 0; 1; 1; 0; 0"
      keyTimes="0; 0.68; 0.70; 0.76; 0.78; 1"
      dur="${dur}" repeatCount="indefinite"/>
    <text x="${left + 38 * step}" y="${top + 2 * step}" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="900" text-anchor="middle">
      +200
    </text>
  </g>

  <!-- ================= CHARACTERS LAYER ================= -->

  <!-- PAC-MAN (IN FRONT LEADING THE RUN, with Power Aura, Chomp, Death Spin & Respawn) -->
  <g>
    <!-- Master Motion along Dynamic Maze Path (begin="-3.2s" puts Pac-Man in FRONT) -->
    <animateMotion dur="${dur}" repeatCount="indefinite" rotate="auto" begin="-3.2s" path="${pathD}"/>

    <!-- Death Shrink & Spin Transform (At 41s - 43.5s) -->
    <g>
      <!-- Scale Animation: normal 1 -> shrinks to 0 at death (41s - 43s) -> respawns at 44s -->
      <animateTransform attributeName="transform" type="scale"
        values="1; 1; 1; 0.1; 0; 0; 1; 1"
        keyTimes="0; 0.900; 0.905; 0.945; 0.950; 0.978; 0.980; 1"
        dur="${dur}" repeatCount="indefinite" additive="sum"/>
      
      <animateTransform attributeName="transform" type="rotate"
        values="0; 0; 0; 1080; 1080; 0; 0"
        keyTimes="0; 0.900; 0.905; 0.945; 0.978; 0.980; 1"
        dur="${dur}" repeatCount="indefinite" additive="sum"/>

      <!-- Golden Power Aura Ring (Active when Pac-Man is Strong: 28s - 38s) -->
      <circle cx="0" cy="0" r="8.5" fill="none" stroke="#ffd60a" stroke-width="1.8" stroke-dasharray="3 2" opacity="0">
        <animate attributeName="opacity"
          values="0; 0; 0.95; 0.95; 0; 0"
          keyTimes="0; 0.621; 0.622; 0.844; 0.845; 1"
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

  <!-- THE 4 GHOSTS (Blinky, Pinky, Inky, Clyde) CHASING BEHIND PAC-MAN -->
  ${ghosts}

  <!-- "READY!" ARCADE BANNER (Flashes at 43s - 45s during respawn) -->
  <g transform="translate(${left + 26 * step}, ${top + 3 * step})" opacity="0">
    <animate attributeName="opacity"
      values="0; 0; 1; 0.2; 1; 0.2; 1; 0; 0"
      keyTimes="0; 0.950; 0.951; 0.965; 0.975; 0.985; 0.995; 0.999; 1"
      dur="${dur}" repeatCount="indefinite"/>
    <rect x="-45" y="-12" width="90" height="20" rx="3" fill="#0b1120" stroke="#ffeb3b" stroke-width="1.2"/>
    <text class="ready-banner" x="0" y="2" text-anchor="middle">READY!</text>
  </g>
</svg>`;
}
