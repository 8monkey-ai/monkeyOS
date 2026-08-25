const status = Bun.spawnSync(["supabase", "status", "-o", "env"]);
if (status.exitCode !== 0) throw new Error("Local Supabase must be running before browser tests");
const values = Object.fromEntries(
  status.stdout
    .toString()
    .split("\n")
    .flatMap((line) => {
      const match = line.match(/^([A-Z_]+)="?(.*?)"?$/);
      return match ? [[match[1]!, match[2]!.replace(/"$/, "")]] : [];
    }),
);
const testConfig = {
  SUPABASE_URL: values.API_URL ?? "http://127.0.0.1:54321",
  SUPABASE_PUBLISHABLE_KEY: values.PUBLISHABLE_KEY ?? values.ANON_KEY ?? "",
};
const server = Bun.spawn(["bun", "run", "dev", "--", "--host", "127.0.0.1"], {
  env: { ...process.env, APP_ENV: "test", TEST_CONFIG_JSON: JSON.stringify(testConfig) },
  stdout: "inherit",
  stderr: "inherit",
});
const shutdown = () => server.kill();
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.exit(await server.exited);
