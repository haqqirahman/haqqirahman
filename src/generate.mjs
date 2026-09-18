import fs from "node:fs";
import path from "node:path";
import { buildPacmanSvg } from "./svg.mjs";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}

const username = arg("--user");
const outFile = arg("--out", "dist/pacman.svg");
const token = process.env.GITHUB_TOKEN;

if (!username) {
  console.error("Missing --user argument");
  process.exit(1);
}

if (!token) {
  console.error("GITHUB_TOKEN is not available");
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
          }
        }
      }
    }
  }
}
`;

async function fetchContributions() {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-profile-pacman"
    },
    body: JSON.stringify({
      query,
      variables: { login: username }
    })
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors.map(e => e.message).join("; "));
  }

  if (!result.data?.user) {
    throw new Error(`GitHub user "${username}" was not found`);
  }

  return result.data.user;
}

async function main() {
  console.log(`Generating Pac-Man graph for ${username}...`);

  const user = await fetchContributions();
  const calendar = user.contributionsCollection.contributionCalendar;

  const svg = buildPacmanSvg({
    username: user.login,
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks
  });

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, svg, "utf8");

  console.log(`Created ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
