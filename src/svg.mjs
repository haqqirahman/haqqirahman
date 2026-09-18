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
  const step = cell + gap;
  const left = 28;
  const top = 74;
  const days = 7;

  const graphWidth = Math.max(1, weeks.length) * step;
  const width = graphWidth + left * 2;
  const height = 220;

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

  const pathD = route.length
    ? route.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ")
    : `M ${left} ${top}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     role="img" aria-label="Pac-Man contribution graph for ${esc(username)}">
  <style>
    .bg { fill: #0d1117; }
    .title {
      fill: #f0f6fc;
      font: 700 17px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }
    .meta {
      fill: #8b949e;
      font: 12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    }
    .score {
      fill: #58a6ff;
      font: 700 12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    }
    @media (prefers-color-scheme: light) {
      .bg { fill: #ffffff; }
      .title { fill: #1f2328; }
      .meta { fill: #57606a; }
    }
  </style>

  <rect class="bg" x="0" y="0" width="100%" height="100%" rx="14"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="14"
        fill="none" stroke="#30363d"/>

  <text class="title" x="${left}" y="30">🎮 CONTRIBUTION ARCADE</text>
  <text class="meta" x="${left}" y="51">PLAYER: ${esc(username)}</text>
  <text class="score" x="${width - left}" y="31" text-anchor="end">
    SCORE ${totalContributions}
  </text>

  ${squares}

  <g>
    <circle cx="0" cy="0" r="${cell * 0.48}" fill="#ffd60a"/>
    <path d="M 0 0 L ${cell * 0.62} ${-cell * 0.38} L ${cell * 0.62} ${cell * 0.38} Z"
          fill="#0d1117">
      <animate attributeName="d"
        values="
          M 0 0 L ${cell * 0.62} ${-cell * 0.38} L ${cell * 0.62} ${cell * 0.38} Z;
          M 0 0 L ${cell * 0.62} -1 L ${cell * 0.62} 1 Z;
          M 0 0 L ${cell * 0.62} ${-cell * 0.38} L ${cell * 0.62} ${cell * 0.38} Z"
        dur="0.35s" repeatCount="indefinite"/>
    </path>
    <circle cx="${cell * 0.15}" cy="${-cell * 0.22}" r="1.1" fill="#111827"/>
    <animateMotion dur="48s" repeatCount="indefinite" rotate="auto" path="${pathD}"/>
  </g>

  <text class="meta" x="${left}" y="${height - 24}">
    PAC-MAN IS EATING ${totalContributions} CONTRIBUTIONS • INSERT COIN_
  </text>
</svg>`;
}
