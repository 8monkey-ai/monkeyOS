import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

type Finding = { level: "BLOCKING" | "IMPORTANT"; message: string };
async function exists(path: string) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}
async function walk(root: string, current = root): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (
      ["node_modules", ".git", ".react-router", "build", "dist", "test-results"].includes(
        entry.name,
      )
    )
      continue;
    const path = join(current, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(root, path)));
    else files.push(relative(root, path));
  }
  return files.sort();
}

export async function auditRepository(root: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const file of [
    "README.md",
    "BUSINESS.md",
    "CHANGELOG.md",
    "AGENTS.md",
    "components.json",
    "package.json",
    "bun.lock",
    "Dockerfile",
    "server.ts",
    "react-router.config.ts",
    "src/root.tsx",
    "src/routes.ts",
  ]) {
    if (!(await exists(join(root, file))))
      findings.push({ level: "BLOCKING", message: `Missing required ${file}` });
  }
  const business = await readFile(join(root, "BUSINESS.md"), "utf8");
  const files = await walk(root);
  const skills = files.filter((file) => /^business\/skills\/[^/]+\/SKILL\.md$/.test(file));
  if (!skills.length)
    findings.push({ level: "BLOCKING", message: "No application-owned business skill" });
  for (const file of skills) {
    if (!business.includes(file))
      findings.push({ level: "BLOCKING", message: `Unreferenced business skill: ${file}` });
    const slug = file.split("/")[2]!;
    if (/(?:-v\d+|-new|-old|-20\d\d(?:-\d\d)?)$/.test(slug))
      findings.push({ level: "BLOCKING", message: `Version-duplicated business skill: ${slug}` });
  }
  for (const match of business.matchAll(/business\/skills\/([^/)]+)\/SKILL\.md/g)) {
    if (!(await exists(join(root, "business", "skills", match[1]!, "SKILL.md"))))
      findings.push({ level: "BLOCKING", message: `Missing routed business skill: ${match[1]}` });
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
  if (!packageJson.version || !changelog.includes(`## ${packageJson.version}`))
    findings.push({ level: "BLOCKING", message: "Version is absent from CHANGELOG.md" });
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
  for (const [script, command] of Object.entries({
    dev: "bun --conditions=development ./node_modules/@react-router/dev/bin.cjs dev",
    build: "bun ./node_modules/@react-router/dev/bin.cjs build",
    start: "bun server.ts",
  })) {
    if (packageJson.scripts?.[script] !== command) {
      findings.push({
        level: "BLOCKING",
        message: `${script} must use the standard React Router Framework Mode command`,
      });
    }
  }
  if (!packageJson.scripts?.typecheck?.includes("@react-router/dev/bin.cjs typegen")) {
    findings.push({ level: "BLOCKING", message: "typecheck must generate React Router types" });
  }
  for (const dependency of ["@react-router/node", "@react-router/serve", "@types/node"]) {
    if (packageJson.dependencies?.[dependency] || packageJson.devDependencies?.[dependency]) {
      findings.push({
        level: "BLOCKING",
        message: `Direct Node dependency is forbidden: ${dependency}`,
      });
    }
  }
  for (const legacy of [
    "index.html",
    "src/main.tsx",
    "src/app.tsx",
    "server/index.ts",
    "scripts/dev.ts",
  ]) {
    if (await exists(join(root, legacy))) {
      findings.push({
        level: "BLOCKING",
        message: `Legacy custom application entry remains: ${legacy}`,
      });
    }
  }
  const viteConfig = await readFile(join(root, "vite.config.ts"), "utf8");
  if (!viteConfig.includes("@react-router/dev/vite") || !viteConfig.includes("reactRouter()")) {
    findings.push({ level: "BLOCKING", message: "Vite is not using React Router Framework Mode" });
  }
  if (/\b(?:server|build)\s*:/.test(viteConfig)) {
    findings.push({ level: "BLOCKING", message: "Vite contains custom server/build plumbing" });
  }
  const agents = await readFile(join(root, "AGENTS.md"), "utf8");
  for (const principle of [
    "TanStack Query",
    "stable query keys",
    "Pages and visual components",
    "RLS",
  ]) {
    if (!agents.includes(principle)) {
      findings.push({ level: "BLOCKING", message: `AGENTS.md does not enforce ${principle}` });
    }
  }
  for (const file of files.filter((file) =>
    /^(?:src\/routes|src\/components)\/.*\.tsx$/.test(file),
  )) {
    const source = await readFile(join(root, file), "utf8");
    if (/\.(?:from|rpc)\s*\(/.test(source)) {
      findings.push({
        level: "BLOCKING",
        message: `${file} accesses Supabase data directly; use a typed TanStack Query hook`,
      });
    }
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
  const dockerfilePath = join(root, "Dockerfile");
  if (await exists(dockerfilePath)) {
    const dockerfile = await readFile(dockerfilePath, "utf8");
    if (!dockerfile.includes("FROM oven/bun:alpine") || /FROM\s+node:/i.test(dockerfile)) {
      findings.push({
        level: "BLOCKING",
        message: "Docker must use only the moving Bun base",
      });
    }
    if (!dockerfile.includes('CMD ["bun", "server.ts"]')) {
      findings.push({
        level: "BLOCKING",
        message: "Docker must run the thin Bun-native React Router adapter",
      });
    }
  }
  const server = await readFile(join(root, "server.ts"), "utf8");
  if (!server.includes("Bun.serve") || !server.includes("createRequestHandler")) {
    findings.push({
      level: "BLOCKING",
      message: "server.ts must remain a thin Bun/React Router adapter",
    });
  }
  for (const workflow of ["ci.yml", "deploy.yml", "audit.yml"]) {
    const content = await readFile(join(root, ".github", "workflows", workflow), "utf8");
    if (!content.includes("monkeyos-platform/.github/workflows/") || !content.includes("@v1"))
      findings.push({
        level: "BLOCKING",
        message: `${workflow} is not a protected central @v1 caller`,
      });
  }
  const sources = JSON.parse(
    await readFile(join(root, "config", "external-data-sources.json"), "utf8"),
  ) as Array<Record<string, unknown>>;
  for (const source of sources) {
    if (Object.keys(source).some((key) => /url|password|secret|token/i.test(key)))
      findings.push({
        level: "BLOCKING",
        message: "External declarations contain a secret-value field",
      });
    if (source.access !== "read-only")
      findings.push({ level: "IMPORTANT", message: `${String(source.name)} is not read-only` });
  }
  return findings;
}

if (import.meta.main) {
  const findings = await auditRepository(process.cwd());
  for (const finding of findings) console.log(`${finding.level}: ${finding.message}`);
  if (findings.some((finding) => finding.level === "BLOCKING")) process.exit(1);
  console.log(`Repository contract audit passed with ${findings.length} non-blocking finding(s).`);
}
