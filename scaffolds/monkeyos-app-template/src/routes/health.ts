import { loadPublicRuntimeConfig } from "../config";

export async function loader() {
  const config = await loadPublicRuntimeConfig();
  return Response.json(
    { status: "ok", version: config.version, sha: config.gitSha },
    { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } },
  );
}
