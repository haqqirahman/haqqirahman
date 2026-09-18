function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildPacmanSvg({
  username,
  totalContributions,
  weeks
}) {
  const CELL = 12;
  const GAP = 5;
  const STEP = CELL + GAP;

  const LEFT = 40;
  const TOP = 72;

  const DAYS = 7;

  const graphWidth =
    weeks.length * STEP;

  const width =
    graphWidth + LEFT * 2;

  const height = 245;

  const levelColors = [
    "#161b22",
    "#0e7490",
    "#0891b2",
    "#06b6d4",
    "#22d3ee"
  ];

  let squares = "";
  let dots = "";

  const points = [];

  weeks.forEach((week, weekIndex) => {
    const days =
      week.contributionDays;

    const orderedDays =
      weekIndex % 2 === 0
        ? days
        : [...days].reverse();

    orderedDays.forEach((day, orderedIndex) => {
      const realDayIndex =
        weekIndex % 2 === 0
          ? orderedIndex
          : DAYS - 1 - orderedIndex;

      const x =
        LEFT + weekIndex * STEP;

      const y =
        TOP + realDayIndex * STEP;

      const count =
        day.contributionCount;

      let level = 0;

      if (count > 0) level = 1;
      if (count >= 3) level = 2;
      if (count >= 6) level = 3;
      if (count >= 10) level = 4;

      squares += `
        <rect
          x="${x}"
          y="${y}"
          width="${CELL}"
          height="${CELL}"
          rx="3"
          fill="${levelColors[level]}"
        >
          <title>${escapeXml(day.date)} — ${count} contributions</title>
        </rect>
      `;

      if (count === 0) {
        dots += `
          <circle
            cx="${x + CELL / 2}"
            cy="${y + CELL / 2}"
            r="1.6"
            fill="#475569"
            opacity="0.65"
          />
        `;
      }

      points.push(
        `${x + CELL / 2},${y + CELL / 2}`
      );
    });
  });

  const motionPath =
    points
      .map((point, index) => {
        const [x, y] =
          point.split(",");

        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  const ghostY =
    TOP + 3 * STEP + CELL / 2;

  const lastX =
    LEFT +
    Math.max(0, weeks.length - 1) *
      STEP +
    CELL / 2;

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
>

<style>

  .background {
    fill: #0d1117;
  }

  .title {
    fill: #f8fafc;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    font-weight: 700;
  }

  .subtitle {
    fill: #94a3b8;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .arcade {
    fill: #22d3ee;
    font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      monospace;
    font-weight: 700;
  }

</style>

<rect
  class="background"
  width="100%"
  height="100%"
  rx="16"
/>

<rect
  x="1"
  y="1"
  width="${width - 2}"
  height="${height - 2}"
  rx="16"
  fill="none"
  stroke="#1e293b"
  stroke-width="2"
/>

<text
  x="${LEFT}"
  y="30"
  class="title"
  font-size="18"
>
  🎮 CONTRIBUTION ARCADE
</text>

<text
  x="${LEFT}"
  y="51"
  class="subtitle"
  font-size="12"
>
  PLAYER: ${escapeXml(username)}
</text>

<text
  x="${width - LEFT}"
  y="31"
  class="arcade"
  text-anchor="end"
  font-size="12"
>
  SCORE ${totalContributions}
</text>

${squares}

${dots}

<!-- Ghosts -->

<text
  x="${Math.max(LEFT, lastX - 100)}"
  y="${ghostY + 6}"
  font-size="19"
>
  👻
</text>

<text
  x="${Math.max(LEFT, lastX - 70)}"
  y="${ghostY + 6}"
  font-size="19"
>
  👾
</text>

<!-- Pac-Man -->

<g>

  <path
    d="
      M 0 0
      L 10 -7
      A 12 12 0 1 1 10 7
      Z
    "
    fill="#ffd60a"
  />

  <circle
    cx="3"
    cy="-6"
    r="1.5"
    fill="#111827"
  />

  <animateMotion
    dur="42s"
    repeatCount="indefinite"
    rotate="auto"
    path="${motionPath}"
  />

</g>

<text
  x="${LEFT}"
  y="${height - 25}"
  class="subtitle"
  font-size="11"
>
  PAC-MAN IS EATING ${totalContributions} CONTRIBUTIONS • INSERT COIN_
</text>

</svg>
`;
}
