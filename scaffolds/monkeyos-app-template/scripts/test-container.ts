const image = Bun.argv[2];
if (!image) throw new Error("Usage: bun scripts/test-container.ts <image>");
const name = `monkeyos-smoke-${crypto.randomUUID()}`;
const fixture = JSON.stringify({
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_container_smoke_value",
});
const run = Bun.spawn(
  [
    "docker",
    "run",
    "--detach",
    "--rm",
    "--name",
    name,
    "--publish",
    "127.0.0.1::3000",
    "--env",
    "APP_ENV=test",
    "--env",
    `TEST_CONFIG_JSON=${fixture}`,
    image,
  ],
  {
    stdout: "pipe",
    stderr: "inherit",
  },
);
if ((await run.exited) !== 0) process.exit(1);
try {
  const port = Bun.spawnSync(["docker", "port", name, "3000/tcp"])
    .stdout.toString()
    .trim()
    .split(":")
    .at(-1);
  if (!port) throw new Error("Docker did not publish the application port");
  let healthy = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(`http://127.0.0.1:${port}/healthz`).catch(() => undefined);
    if (response?.ok) {
      healthy = true;
      break;
    }
    await Bun.sleep(250);
  }
  if (!healthy) throw new Error("Container health endpoint did not become ready");
  const document = await fetch(`http://127.0.0.1:${port}/login`);
  if (!document.ok) throw new Error("Container did not serve the React Router document");
  const assetPath = (await document.text()).match(/\/assets\/[^"']+\.js/)?.[0];
  if (!assetPath) throw new Error("React Router document did not reference a generated asset");
  const asset = await fetch(`http://127.0.0.1:${port}${assetPath}`);
  if (!asset.ok || !asset.headers.get("cache-control")?.includes("immutable"))
    throw new Error("Bun adapter did not serve immutable generated assets correctly");
} finally {
  Bun.spawnSync(["docker", "stop", name], { stdout: "ignore", stderr: "ignore" });
}

export {};
