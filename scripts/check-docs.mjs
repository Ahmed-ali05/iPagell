import { readFile, readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Deliberately offline: check repository-local Markdown destinations, not live URLs.
const root = fileURLToPath(new URL("../", import.meta.url));
const files = ["README.md", "CONTRIBUTING.md", "SECURITY.md", "CHANGELOG.md", "AGENTS.md"];
for (const name of await readdir(resolve(root, "docs"))) {
  if (name.endsWith(".md")) files.push(`docs/${name}`);
}
let links = 0;
const failures = [];
const destinations = new Map();
for (const file of files) {
  const content = await readFile(resolve(root, file), "utf8");
  const prose = content.replace(/```[\s\S]*?```/g, "");
  for (const match of prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const destination = match[1].trim().replace(/^<|>$/g, "");
    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(destination)) continue;
    const path = decodeURIComponent(destination.split("#")[0]);
    if (!path) continue;
    links++;
    try {
      const target = resolve(root, dirname(file), path);
      await stat(target);
      const repositoryPath = relative(root, target).split(sep).join("/");
      const references = destinations.get(repositoryPath) ?? [];
      references.push(`${file}: collegamento a un percorso ignorato da Git → ${destination}`);
      destinations.set(repositoryPath, references);
    } catch {
      failures.push(`${file}: collegamento inesistente → ${destination}`);
    }
  }
}
// Existing local previews can hide broken links in a clean checkout. Do not
// reject new source files awaiting a commit; reject Git-ignored destinations.
if (destinations.size) {
  const ignored = spawnSync("git", ["-C", root, "check-ignore", "--stdin", "-z"], {
    input: `${[...destinations.keys()].join("\0")}\0`,
    encoding: "utf8",
  });
  if (ignored.error || ![0, 1].includes(ignored.status)) {
    failures.push(`Impossibile verificare i percorsi ignorati da Git: ${ignored.error?.message ?? ignored.stderr.trim()}`);
  } else for (const path of ignored.stdout.split("\0").filter(Boolean)) {
    failures.push(...destinations.get(path));
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`${files.length} documenti, ${links} collegamenti locali verificati.`);
  console.log("Rifiutati anche i collegamenti a percorsi ignorati da Git.");
  console.log("Esclusi: URL esterni, ancore, link reference-style e correttezza del contenuto.");
}
