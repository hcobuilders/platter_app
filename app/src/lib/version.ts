// Railway injects RAILWAY_GIT_COMMIT_SHA at build and runtime for every
// deployment; local dev has no such thing, so it falls back to "dev".
export function getBuildVersion(): string {
  const sha = process.env.RAILWAY_GIT_COMMIT_SHA;
  return sha ? sha.slice(0, 7) : "dev";
}
