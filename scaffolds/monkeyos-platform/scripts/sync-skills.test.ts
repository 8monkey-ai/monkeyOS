import { expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

test("synchronizes skills and records a manifest", async () => {
  const root = await mkdtemp(join(tmpdir(), "monkeyos-sync-"));
  const source = join(root, "source");
  const target = join(root, "target");
  await mkdir(join(source, "test"), { recursive: true });
  await writeFile(join(source, "test", "SKILL.md"), "# Test\n");
  const process = Bun.spawn([
    "bun",
    join(import.meta.dir, "sync-skills.ts"),
    "--source",
    source,
    "--target",
    target,
    "--compatibility",
    "v1",
  ]);
  expect(await process.exited).toBe(0);
  const manifest = JSON.parse(await readFile(join(target, ".manifest.json"), "utf8"));
  expect(manifest.files["test/SKILL.md"]).toHaveLength(64);
});
