// Minimum patched releases from the Node.js security advisory of 2026-10-21.
// Unknown majors and prereleases require an explicit compatibility review.
export const minimumNodeVersions = ["22.23.4", "24.22.1", "26.12.1"];
export const nodeEngineRange = minimumNodeVersions.map(version => `^${version}`).join(" || ");

export function assertSupportedNode(version = process.versions.node) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  const current = match?.slice(1).map(Number);
  const minimum = current && minimumNodeVersions
    .map(value => value.split(".").map(Number))
    .find(value => value[0] === current[0]);
  if (!minimum || current[1] < minimum[1] ||
      (current[1] === minimum[1] && current[2] < minimum[2])) {
    throw new Error(`Unsupported Node.js ${version}. Required: ${nodeEngineRange}. Run nvm install && nvm use, or install a patched supported release. See docs/RUNTIME-SECURITY-2026-10-22.md.`);
  }
}
