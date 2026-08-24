import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const identity = (await Bun.file("monkeyos.identity.json").json()) as { organization: string };
const temporary = await mkdtemp(join(tmpdir(), "monkeyos-platform-"));
try {
  const clone = Bun.spawn([
    "gh",
    "repo",
    "clone",
    `${identity.organization}/monkeyos-platform`,
    temporary,
    "--",
    "--depth=1",
    "--branch=v1",
  ]);
  if ((await clone.exited) !== 0) throw new Error("Could not fetch protected monkeyOS v1 skills");
  const sync = Bun.spawn(
    [
      "bun",
      join(temporary, "scripts", "sync-skills.ts"),
      "--source",
      join(temporary, "skills"),
      "--target",
      join(process.cwd(), ".monkeyos", "skills"),
      "--compatibility",
      "v1",
    ],
    { stdout: "inherit", stderr: "inherit" },
  );
  if ((await sync.exited) !== 0) throw new Error("Skill synchronization failed");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
