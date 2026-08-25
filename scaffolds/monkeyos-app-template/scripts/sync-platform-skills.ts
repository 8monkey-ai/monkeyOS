import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Synchronizes the protected `v1` platform skills. The platform repository lives in the same
 * organization as this one, so the organization is read from the repository itself rather than
 * stored in a configuration file.
 */
async function platformRepository(): Promise<string> {
  const configured = process.env.MONKEYOS_PLATFORM_REPO;
  if (configured) return configured;
  const view = Bun.spawn(["gh", "repo", "view", "--json", "owner", "--jq", ".owner.login"], {
    stdout: "pipe",
    stderr: "inherit",
  });
  const owner = (await new Response(view.stdout).text()).trim();
  if ((await view.exited) !== 0 || !owner) {
    throw new Error(
      "Could not determine the organization from this repository. Set MONKEYOS_PLATFORM_REPO.",
    );
  }
  return `${owner}/monkeyos-platform`;
}

const temporary = await mkdtemp(join(tmpdir(), "monkeyos-platform-"));
try {
  const clone = Bun.spawn([
    "gh",
    "repo",
    "clone",
    await platformRepository(),
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
