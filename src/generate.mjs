import fs from "node:fs";
import path from "node:path";
import { buildPacmanSvg } from "./svg.mjs";

function getArgument(name, fallback = null) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return fallback;
  }

  return process.argv[index + 1] ?? fallback;
}

const username = getArgument("--user");
const outputFile = getArgument("--out", "dist/pacman.svg");

if (!username) {
  console.error("Missing --user argument.");
  process.exit(1);
}

const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("GITHUB_TOKEN is not available.");
  process.exit(1);
}

const query = `
query($login: String!) {
  user(login: $login) {
    login
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
            color
          }
        }
      }
    }
  }
}
`;

async function getContributions() {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-profile-pacman"
    },
    body: JSON.stringify({
      query,
      variables: {
        login: username
      }
    })
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API returned ${response.status}: ${response.statusText}`
    );
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(JSON.stringify(result.errors, null, 2));
  }

  if (!result.data?.user) {
    throw new Error(`GitHub user "${username}" was not found.`);
  }

  return result.data.user;
}

async function main() {
  console.log(`Generating Pac-Man for ${username}...`);

  const user = await getContributions();

  const calendar =
    user.contributionsCollection.contributionCalendar;

  const svg = buildPacmanSvg({
    username: user.login,
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks
  });

  fs.mkdirSync(path.dirname(outputFile), {
    recursive: true
  });

  fs.writeFileSync(outputFile, svg, "utf8");

  console.log(`Pac-Man SVG generated: ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
