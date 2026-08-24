import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

type Manifest = { source: string; compatibility: string; files: Record<string, string> };

function argument(name: string, fallback?: string): string {
  const index = Bun.argv.indexOf(name);
  const value = index >= 0 ? Bun.argv[index + 1] : fallback;
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function filesUnder(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const output: string[] = [];
  for (const entry of entries) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) output.push(...(await filesUnder(root, path)));
    else if (entry.isFile()) output.push(relative(root, path));
  }
  return output.sort();
}

const source = argument("--source", join(import.meta.dir, "..", "skills"));
const target = argument("--target", join(process.cwd(), ".monkeyos", "skills"));
const compatibility = argument("--compatibility", "v1");
const manifestPath = join(target, ".manifest.json");
let previous: Manifest | undefined;
try {
  previous = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
} catch {
  previous = undefined;
}

const files = await filesUnder(source);
const nextFiles: Record<string, string> = {};
for (const file of files) {
  const bytes = await readFile(join(source, file));
  nextFiles[file] = new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
  await mkdir(dirname(join(target, file)), { recursive: true });
  await copyFile(join(source, file), join(target, file));
}
for (const oldFile of Object.keys(previous?.files ?? {})) {
  if (!(oldFile in nextFiles)) await rm(join(target, oldFile), { force: true });
}
const manifest: Manifest = { source: "monkeyos-platform/skills", compatibility, files: nextFiles };
await mkdir(target, { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Synchronized ${files.length} monkeyOS-managed files into ${target}`);
