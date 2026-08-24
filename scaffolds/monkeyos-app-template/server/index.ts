import { extname, join, normalize } from "node:path";
import { loadConfig, publicConfig } from "../src/config";

const testConfig = process.env.TEST_CONFIG_JSON
  ? (JSON.parse(process.env.TEST_CONFIG_JSON) as Record<string, string>)
  : undefined;
const mode =
  process.env.APP_ENV === "production"
    ? "production"
    : process.env.APP_ENV === "test"
      ? "test"
      : "development";
const config = await loadConfig({ mode, ...(testConfig ? { explicit: testConfig } : {}) });
const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const server = Bun.serve({
  hostname: "0.0.0.0",
  port: Number(process.env.PORT ?? 3000),
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") {
      return Response.json(
        { status: "ok", version: config.version, sha: config.gitSha },
        { headers: { "cache-control": "no-store" } },
      );
    }
    if (url.pathname === "/api/config") {
      return Response.json(publicConfig(config), {
        headers: {
          "cache-control": "no-store",
          "content-security-policy": "default-src 'none'",
          "x-content-type-options": "nosniff",
        },
      });
    }
    const requested = normalize(url.pathname)
      .replace(/^\.\.(?:\/|\\|$)/, "")
      .replace(/^\//, "");
    const asset = Bun.file(join("dist", requested || "index.html"));
    if (requested && (await asset.exists())) {
      return new Response(asset, {
        headers: { "content-type": mimeTypes[extname(requested)] ?? "application/octet-stream" },
      });
    }
    const index = Bun.file("dist/index.html");
    if (!(await index.exists())) return new Response("Build not found", { status: 503 });
    return new Response(index, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy":
          "default-src 'self'; connect-src 'self' https: wss:; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'",
        "referrer-policy": "strict-origin-when-cross-origin",
        "x-content-type-options": "nosniff",
      },
    });
  },
});

console.log(`Application server listening on ${server.url}`);
