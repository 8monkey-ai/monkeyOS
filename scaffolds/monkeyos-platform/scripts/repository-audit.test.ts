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

test("rejects routine Supabase access from visual components", async () => {
  const root = await mkdtemp(join(tmpdir(), "monkeyos-audit-ui-"));
  await Promise.all(
    ["README.md", "CHANGELOG.md"].map((file) => writeFile(join(root, file), "## 1.0.0\n")),
  );
  await writeFile(
    join(root, "AGENTS.md"),
    "shadcn/ui BUSINESS.md TanStack Query stable query keys Pages and visual components RLS Bun.secrets Dependabot",
  );
  await writeFile(join(root, "BUSINESS.md"), "[Process](business/skills/process/SKILL.md)\n");
  await writeFile(join(root, "package.json"), '{"version":"1.0.0"}');
  await mkdir(join(root, "business/skills/process"), { recursive: true });
  await writeFile(join(root, "business/skills/process/SKILL.md"), "# Process\n");
  await mkdir(join(root, "src/pages"), { recursive: true });
  await writeFile(
    join(root, "src/pages/process.tsx"),
    'export const load = (supabase: any) => supabase.from("records").select();\n',
  );

  const findings = await auditRepository(root);

  expect(findings.map((finding) => finding.message).join("\n")).toContain(
    "src/pages/process.tsx accesses Supabase data directly",
  );
});
