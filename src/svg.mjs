function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function renderGhost({ name, color, begin, dur, pathD }) {
  return `
  <!-- Ghost: ${name} -->
  <g>
    <g>
      <!-- Bobbing / floating hovering animation -->
      <animateTransform attributeName="transform" type="translate"
        values="0 -0.8; 0 0.8; 0 -0.8" dur="0.4s" repeatCount="indefinite" additive="sum"/>
      
      <!-- Ghost body with animated wiggling tentacles -->
      <path fill="${color}" d="M -5.5 -1 A 5.5 5.5 0 0 1 5.5 -1 L 5.5 5.5 Q 3.7 3.5 1.8 5.5 Q 0 3.5 -1.8 5.5 Q -3.7 3.5 -5.5 5.5 Z">
        <animate attributeName="d"
          values="
            M -5.5 -1 A 5.5 5.5 0 0 1 5.5 -1 L 5.5 5.5 Q 3.7 3.5 1.8 5.5 Q 0 3.5 -1.8 5.5 Q -3.7 3.5 -5.5 5.5 Z;
            M -5.5 -1 A 5.5 5.5 0 0 1 5.5 -1 L 5.5 4 Q 3.7 6 1.8 4 Q 0 6 -1.8 4 Q -3.7 6 -5.5 4 Z;
            M -5.5 -1 A 5.5 5.5 0 0 1 5.5 -1 L 5.5 5.5 Q 3.7 3.5 1.8 5.5 Q 0 3.5 -1.8 5.5 Q -3.7 3.5 -5.5 5.5 Z"
          dur="0.25s" repeatCount="indefinite"/>
      </path>

      <!-- Eyes (White Sclera) -->
      <ellipse cx="-2" cy="-1.5" rx="2.1" ry="2.5" fill="#ffffff"/>
      <ellipse cx="2.4" cy="-1.5" rx="2.1" ry="2.5" fill="#ffffff"/>

      <!-- Pupils (Classic Arcade Blue) looking forward -->
      <ellipse cx="-1.2" cy="-1.5" rx="1.1" ry="1.4" fill="#1e3a8a"/>
      <ellipse cx="3.2" cy="-1.5" rx="1.1" ry="1.4" fill="#1e3a8a"/>
    </g>

    <!-- Path motion without rotation to keep ghosts standing upright -->
    <animateMotion dur="${dur}" repeatCount="indefinite" begin="${begin}" path="${pathD}"/>
  </g>`;
}

export function buildPacmanSvg({ username, totalContributions, weeks }) {
  const cell = 11;
  const gap = 4;
  const step = cell + gap;
  const left = 28;
  const top = 74;
  const days = 7;

  const graphWidth = Math.max(1, weeks.length) * step;
  const width = graphWidth + left * 2;
  const height = 230;

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
        <rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2"
              fill="${palette[level]}" opacity="0.96">
          <title>${esc(day.date)} — ${count} contributions</title>
        </rect>`;

      route.push([x + cell / 2, y + cell / 2]);
    });
  });

  // Connect the end of the snake path back to start via bottom corridor to form a continuous closed circuit
  if (route.length > 1) {
    const [lastX] = route[route.length - 1];
    const [firstX, firstY] = route[0];
    const corridorY = top + days * step + 5; // y = 184 runway

    route.push([lastX, corridorY]);
    route.push([firstX - 14, corridorY]);
    route.push([firstX - 14, firstY]);
    route.push([firstX, firstY]);
  }

  const pathD = route.length
    ? route.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + " Z"
    : `M ${left} ${top} Z`;

  const duration = "52s";

  // 4 Pulsing Power Pellets at the 4 corners of the arcade grid
  const lastWeekX = left + (weeks.length - 1) * step + cell / 2;
  const firstWeekX = left + cell / 2;
  const topY = top + cell / 2;
  const bottomY = top + 6 * step + cell / 2;

  const powerPellets = `
    <!-- Pulsing Power Pellets in the 4 corners -->
    <circle cx="${firstWeekX}" cy="${topY}" r="4" fill="#ffd60a">
      <animate attributeName="r" values="3; 5.2; 3" dur="0.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6; 1; 0.6" dur="0.6s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${firstWeekX}" cy="${bottomY}" r="4" fill="#ffd60a">
      <animate attributeName="r" values="3; 5.2; 3" dur="0.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6; 1; 0.6" dur="0.6s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${lastWeekX}" cy="${topY}" r="4" fill="#ffd60a">
      <animate attributeName="r" values="3; 5.2; 3" dur="0.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6; 1; 0.6" dur="0.6s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${lastWeekX}" cy="${bottomY}" r="4" fill="#ffd60a">
      <animate attributeName="r" values="3; 5.2; 3" dur="0.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6; 1; 0.6" dur="0.6s" repeatCount="indefinite"/>
    </circle>
  `;

  // 4 Authentic Arcade Ghosts with precise delay offsets behind Pac-Man
  const ghosts = [
    { name: "Blinky (Red)",    color: "#ff0000", begin: "-0.84s" },
    { name: "Pinky (Pink)",    color: "#ffb8de", begin: "-0.56s" },
    { name: "Inky (Cyan)",     color: "#00ffff", begin: "-0.28s" },
    { name: "Clyde (Orange)",  color: "#ffb847", begin: "0s" }
  ].map(g => renderGhost({ ...g, dur: duration, pathD })).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     role="img" aria-label="Pac-Man contribution graph with ghosts for ${esc(username)}">
  <style>
    .bg { fill: #0d1117; }
    .border { stroke: #21262d; stroke-width: 1.5; }
    .title {
      fill: #f0f6fc;
      font: 700 16px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      letter-spacing: 0.5px;
    }
    .arcade-sub {
      fill: #e3b341;
      font: 700 11px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
      letter-spacing: 1px;
    }
    .meta {
      fill: #8b949e;
      font: 11px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    }
    .score {
      fill: #58a6ff;
      font: 700 12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    }
    .score-val {
      fill: #ffffff;
      font: 700 12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    }
    @media (prefers-color-scheme: light) {
      .bg { fill: #ffffff; }
      .border { stroke: #d0d7de; }
      .title { fill: #1f2328; }
      .meta { fill: #57606a; }
      .score { fill: #0969da; }
      .score-val { fill: #1f2328; }
    }
  </style>

  <!-- Background Canvas -->
  <rect class="bg" x="0" y="0" width="100%" height="100%" rx="12"/>
  <rect class="border" x="1" y="1" width="${width - 2}" height="${height - 2}" rx="12" fill="none"/>

  <!-- Arcade Header -->
  <text class="title" x="${left}" y="28">🕹️ PAC-MAN CONTRIBUTION ARCADE</text>
  <text class="arcade-sub" x="${left}" y="48">1UP <tspan class="score-val">${totalContributions * 10}</tspan>   HIGH SCORE <tspan class="score-val">${Math.max(totalContributions * 10, 9999)}</tspan></text>
  
  <text class="score" x="${width - left}" y="28" text-anchor="end">
    PLAYER <tspan class="score-val">${esc(username.toUpperCase())}</tspan>
  </text>
  <text class="meta" x="${width - left}" y="48" text-anchor="end">
    CONTRIBUTIONS: ${totalContributions}
  </text>

  <!-- Contribution Heatmap Grid -->
  ${squares}

  <!-- Pulsing Power Pellets -->
  ${powerPellets}

  <!-- Characters Layer -->
  <!-- Pac-Man (Leader) -->
  <g>
    <circle cx="0" cy="0" r="${cell * 0.48}" fill="#ffd60a"/>
    <path d="M 0 0 L ${cell * 0.65} ${-cell * 0.4} L ${cell * 0.65} ${cell * 0.4} Z"
          fill="#0d1117">
      <animate attributeName="d"
        values="
          M 0 0 L ${cell * 0.65} ${-cell * 0.4} L ${cell * 0.65} ${cell * 0.4} Z;
          M 0 0 L ${cell * 0.65} -0.5 L ${cell * 0.65} 0.5 Z;
          M 0 0 L ${cell * 0.65} ${-cell * 0.4} L ${cell * 0.65} ${cell * 0.4} Z"
        dur="0.25s" repeatCount="indefinite"/>
    </path>
    <circle cx="${cell * 0.15}" cy="${-cell * 0.22}" r="1" fill="#111827"/>
    <animateMotion dur="${duration}" repeatCount="indefinite" rotate="auto" begin="-1.20s" path="${pathD}"/>
  </g>

  <!-- 4 Chasing Ghosts: Blinky, Pinky, Inky, Clyde -->
  ${ghosts}

  <!-- Arcade Footer -->
  <text class="meta" x="${left}" y="${height - 18}">
    🔴 BLINKY  🌸 PINKY  🔷 INKY  🟠 CLYDE  •  CHASING PAC-MAN THROUGH ${totalContributions} CONTRIBUTIONS
  </text>
  <text class="meta" x="${width - left}" y="${height - 18}" text-anchor="end">
    LIVES: 🟡 🟡 🟡 • BONUS 🍒
  </text>
</svg>`;
}
