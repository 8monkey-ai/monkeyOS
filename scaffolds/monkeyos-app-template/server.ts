import { createRequestHandler, type ServerBuild } from "react-router";

const clientRoot = `${import.meta.dir}/build/client`;
const serverBuildPath = "./build/server/index.js";
const serverBuild = (await import(serverBuildPath)) as unknown as ServerBuild;
const handleFrameworkRequest = createRequestHandler(serverBuild, "production");

async function staticResponse(request: Request): Promise<Response | undefined> {
  if (request.method !== "GET" && request.method !== "HEAD") return;
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(request.url).pathname);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
  const relativePath = pathname.replace(/^\/+/, "");
  if (!relativePath || relativePath.includes("\\") || relativePath.split("/").includes(".."))
    return;
  const file = Bun.file(`${clientRoot}/${relativePath}`);
  if (!(await file.exists())) return;
  const headers = new Headers({
    "cache-control": relativePath.startsWith("assets/")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=3600",
    "content-length": String(file.size),
    "content-type": file.type,
  });
  return new Response(request.method === "HEAD" ? null : file, { headers });
}

const server = Bun.serve({
  hostname: Bun.env.HOST ?? "0.0.0.0",
  port: Number(Bun.env.PORT ?? 3000),
  async fetch(request) {
    return (await staticResponse(request)) ?? handleFrameworkRequest(request);
  },
});

console.log(`monkeyOS listening on ${server.url}`);
