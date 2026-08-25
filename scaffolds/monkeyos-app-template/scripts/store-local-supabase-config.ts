import { AppIdentitySchema } from "../src/config";

const identity = AppIdentitySchema.parse(await Bun.file("monkeyos.identity.json").json());
const statusProcess = Bun.spawn(["bunx", "supabase", "status", "-o", "env"], {
  stdout: "pipe",
  stderr: "inherit",
});
const output = await new Response(statusProcess.stdout).text();
if ((await statusProcess.exited) !== 0) throw new Error("Local Supabase is not running");
const values = Object.fromEntries(
  output.split("\n").flatMap((line) => {
    const match = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    return match ? [[match[1]!, match[2]!.replace(/"$/, "")]] : [];
  }),
);
const supabaseUrl = values.API_URL;
const publishableKey = values.PUBLISHABLE_KEY ?? values.ANON_KEY;
if (!supabaseUrl || !publishableKey)
  throw new Error("Supabase status did not return public local client configuration");
await Bun.secrets.set({
  service: identity.secretService,
  name: "SUPABASE_URL",
  value: supabaseUrl,
});
await Bun.secrets.set({
  service: identity.secretService,
  name: "SUPABASE_PUBLISHABLE_KEY",
  value: publishableKey,
});
console.log(
  `Stored local Supabase client configuration for ${identity.secretService} without displaying values.`,
);
