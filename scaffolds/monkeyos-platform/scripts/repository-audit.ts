import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

type Finding = { level: "BLOCKING" | "IMPORTANT"; message: string };

async function exists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function walk(root: string, current = root): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "test-results"].includes(entry.name)) continue;
    const path = join(current, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(root, path)));
    else output.push(relative(root, path));
  }
  return output.sort();
}

export async function auditRepository(root: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const required = [
    "README.md",
    "BUSINESS.md",
    "CHANGELOG.md",
    "AGENTS.md",
    "components.json",
    "package.json",
    "bun.lock",
    "Dockerfile",
  ];
  for (const file of required) {
    if (!(await exists(join(root, file))))
      findings.push({ level: "BLOCKING", message: `Missing required ${file}` });
  }
  if (!(await exists(join(root, "BUSINESS.md")))) return findings;

  const business = await readFile(join(root, "BUSINESS.md"), "utf8");
  const files = await walk(root);
  const skillFiles = files.filter((file) => /^business\/skills\/[^/]+\/SKILL\.md$/.test(file));
  if (skillFiles.length === 0)
    findings.push({ level: "BLOCKING", message: "No application-owned business skill" });
  for (const file of skillFiles) {
    if (!business.includes(file))
      findings.push({ level: "BLOCKING", message: `Unreferenced business skill: ${file}` });
    const slug = file.split("/")[2]!;
    if (/(?:-v\d+|-new|-old|-20\d\d(?:-\d\d)?)$/.test(slug)) {
      findings.push({
        level: "BLOCKING",
        message: `Version-duplicated business skill name: ${slug}`,
      });
    }
  }
  const routed = [...business.matchAll(/business\/skills\/([^/)]+)\/SKILL\.md/g)].map(
    (match) => match[1]!,
  );
  for (const slug of new Set(routed)) {
    if (!(await exists(join(root, "business", "skills", slug, "SKILL.md")))) {
      findings.push({ level: "BLOCKING", message: `BUSINESS.md routes to missing skill: ${slug}` });
    }
  }
  if (new Set(routed).size !== routed.length) {
    findings.push({
      level: "IMPORTANT",
      message: "BUSINESS.md contains duplicate business-skill routes",
    });
  }

  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as {
    version?: string;
    engines?: { bun?: string };
    packageManager?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const changelog = await readFile(join(root, "CHANGELOG.md"), "utf8");
  if (!packageJson.version || !changelog.includes(`## ${packageJson.version}`)) {
    findings.push({
      level: "BLOCKING",
      message: "package.json version is not represented in CHANGELOG.md",
    });
  }
  if (packageJson.engines?.bun || packageJson.packageManager?.startsWith("bun@")) {
    findings.push({
      level: "BLOCKING",
      message: "Bun must follow latest stable rather than a repository-pinned runtime version",
    });
  }
  const componentsPath = join(root, "components.json");
  if (await exists(componentsPath)) {
    const components = JSON.parse(await readFile(componentsPath, "utf8")) as { style?: string };
    if (components.style !== "base-nova") {
      findings.push({ level: "BLOCKING", message: "shadcn must use the CLI Base UI nova preset" });
    }
  }
  if (packageJson.scripts?.["ui:add"] !== "bunx --bun shadcn@latest add") {
    findings.push({ level: "BLOCKING", message: "ui:add must invoke the official shadcn CLI" });
  }
  for (const component of [
    "button",
    "card",
    "dialog",
    "input",
    "select",
    "sidebar",
    "table",
    "textarea",
  ]) {
    if (!(await exists(join(root, "src", "components", "ui", `${component}.tsx`)))) {
      findings.push({ level: "BLOCKING", message: `Missing CLI-managed shadcn ${component}` });
    }
  }
  const sidebarPath = join(root, "src", "components", "ui", "sidebar.tsx");
  if (await exists(sidebarPath)) {
    const sidebar = await readFile(sidebarPath, "utf8");
    if (!sidebar.includes("@base-ui/react/use-render") || !sidebar.includes("SidebarMenuButton")) {
      findings.push({
        level: "BLOCKING",
        message: "Sidebar is not the Base UI shadcn registry component",
      });
    }
  }
  for (const [name, range] of Object.entries({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  })) {
    if (!range.startsWith("^")) {
      findings.push({
        level: "BLOCKING",
        message: `Dependency ${name} must accept compatible minor/patch releases`,
      });
    }
  }
  const dockerfilePath = join(root, "Dockerfile");
  if (await exists(dockerfilePath)) {
    const dockerfile = await readFile(dockerfilePath, "utf8");
    if (!dockerfile.includes("FROM oven/bun:alpine")) {
      findings.push({ level: "BLOCKING", message: "Docker must use the latest stable Bun image" });
    }
  }
  const agents = await readFile(join(root, "AGENTS.md"), "utf8");
  for (const principle of [
    "shadcn/ui",
    "BUSINESS.md",
    "TanStack Query",
    "stable query keys",
    "Pages and visual components",
    "RLS",
    "Bun.secrets",
    "Dependabot",
  ]) {
    if (!agents.includes(principle)) {
      findings.push({ level: "BLOCKING", message: `AGENTS.md does not enforce ${principle}` });
    }
  }
  for (const file of files.filter((file) =>
    /^(?:src\/pages|src\/components)\/.*\.tsx$/.test(file),
  )) {
    const source = await readFile(join(root, file), "utf8");
    if (/\.(?:from|rpc)\s*\(/.test(source)) {
      findings.push({
        level: "BLOCKING",
        message: `${file} accesses Supabase data directly; use a typed TanStack Query hook`,
      });
    }
  }
  for (const workflow of ["ci.yml", "deploy.yml", "audit.yml"]) {
    const path = join(root, ".github", "workflows", workflow);
    if (!(await exists(path)))
      findings.push({ level: "BLOCKING", message: `Missing managed workflow caller: ${workflow}` });
    else if (!(await readFile(path, "utf8")).includes("monkeyos-platform/.github/workflows/")) {
      findings.push({
        level: "BLOCKING",
        message: `${workflow} is not a thin central workflow caller`,
      });
    }
  }
  const declarationPath = join(root, "config", "external-data-sources.json");
  if (await exists(declarationPath)) {
    const declarations = JSON.parse(await readFile(declarationPath, "utf8")) as Array<
      Record<string, unknown>
    >;
    for (const declaration of declarations) {
      if (Object.keys(declaration).some((key) => /url|password|secret|token/i.test(key))) {
        findings.push({
          level: "BLOCKING",
          message:
            "External source declarations may contain names and contracts, never secret values or URL fields",
        });
      }
      if (declaration.access !== "read-only") {
        findings.push({
          level: "IMPORTANT",
          message: `External source ${String(declaration.name)} is not declared read-only`,
        });
      }
    }
  }
  return findings;
}

if (import.meta.main) {
  const rootIndex = Bun.argv.indexOf("--root");
  const root = rootIndex >= 0 ? Bun.argv[rootIndex + 1]! : process.cwd();
  const findings = await auditRepository(root);
  for (const finding of findings) console.log(`${finding.level}: ${finding.message}`);
  if (findings.some((finding) => finding.level === "BLOCKING")) process.exit(1);
  console.log(`Repository contract audit passed with ${findings.length} non-blocking finding(s).`);
}
