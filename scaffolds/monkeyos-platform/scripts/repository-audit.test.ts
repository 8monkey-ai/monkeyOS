import { expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { auditRepository } from "./repository-audit";

test("detects versioned and unreferenced business skills", async () => {
  const root = await mkdtemp(join(tmpdir(), "monkeyos-audit-"));
  await Promise.all(["README.md", "AGENTS.md"].map((file) => writeFile(join(root, file), "ok")));
  await writeFile(join(root, "BUSINESS.md"), "# Business\n");
  await writeFile(join(root, "CHANGELOG.md"), "## 1.0.0\n");
  await writeFile(join(root, "package.json"), '{"version":"1.0.0"}');
  await mkdir(join(root, "business/skills/returns-v2"), { recursive: true });
  await writeFile(join(root, "business/skills/returns-v2/SKILL.md"), "# Returns\n");
  const findings = await auditRepository(root);
  expect(findings.map((finding) => finding.message).join("\n")).toContain("Version-duplicated");
  expect(findings.map((finding) => finding.message).join("\n")).toContain("Unreferenced");
});
