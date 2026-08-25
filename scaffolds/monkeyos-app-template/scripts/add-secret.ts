import { createInterface } from "node:readline/promises";
import { AppIdentitySchema, SourceDeclarationsSchema } from "../src/config";

const name = Bun.argv[2];
if (!name || !/^[A-Z][A-Z0-9_]*$/.test(name)) {
  console.error("Usage: bun run secret:add <DECLARED_NAME>");
  process.exit(2);
}
const identity = AppIdentitySchema.parse(await Bun.file("monkeyos.identity.json").json());
const declarations = SourceDeclarationsSchema.parse(
  await Bun.file("config/external-data-sources.json").json(),
);
const allowed = new Set([
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  ...declarations.map((source) => source.name),
]);
if (!allowed.has(name)) throw new Error(`${name} is not declared by the application`);

const terminal = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
let value = "";
try {
  if (process.stdin.isTTY)
    Bun.spawnSync(["stty", "-echo"], { stdin: "inherit", stdout: "inherit", stderr: "inherit" });
  value = await terminal.question(`Value for ${name} (input hidden): `);
} finally {
  if (process.stdin.isTTY)
    Bun.spawnSync(["stty", "echo"], { stdin: "inherit", stdout: "inherit", stderr: "inherit" });
  terminal.close();
  console.log();
}
if (!value) throw new Error("Secret value was empty; nothing stored");
await Bun.secrets.set({ service: identity.secretService, name, value });
value = "";
console.log(`${name} stored in the OS credential store for ${identity.secretService}.`);
