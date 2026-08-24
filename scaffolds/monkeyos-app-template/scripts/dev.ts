const isTest = Bun.argv.includes("--test");
let testValues = { SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_PUBLISHABLE_KEY: "" };
if (isTest) {
  const status = Bun.spawnSync(["bunx", "supabase", "status", "-o", "env"]);
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
  testValues = {
    SUPABASE_URL: values.API_URL ?? testValues.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: values.PUBLISHABLE_KEY ?? values.ANON_KEY ?? "",
  };
}
const environment = {
  ...process.env,
  APP_ENV: isTest ? "test" : "development",
  ...(isTest ? { TEST_CONFIG_JSON: JSON.stringify(testValues) } : {}),
};

const api = Bun.spawn(["bun", "server/index.ts"], {
  env: environment,
  stdout: "inherit",
  stderr: "inherit",
});
const vite = Bun.spawn(["bunx", "vite"], {
  env: environment,
  stdout: "inherit",
  stderr: "inherit",
});
const shutdown = () => {
  api.kill();
  vite.kill();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
const exitCode = await Promise.race([api.exited, vite.exited]);
shutdown();
process.exit(exitCode);

export {};
