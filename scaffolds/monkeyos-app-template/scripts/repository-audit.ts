import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { z } from "zod";

type Finding = { level: "BLOCKING" | "IMPORTANT"; message: string };
const StringRecord = z.record(z.string(), z.string());
const PackageJsonSchema = z.object({
  name: z.string().min(1),
  version: z.string().optional(),
  engines: z.object({ bun: z.string().optional() }).optional(),
  packageManager: z.string().optional(),
  scripts: StringRecord.optional(),
  dependencies: StringRecord.optional(),
  devDependencies: StringRecord.optional(),
});
const OxlintSchema = z.object({
  categories: z.object({ correctness: z.literal("warn"), suspicious: z.literal("warn") }),
  plugins: z.array(z.string()),
  rules: z.record(z.string(), z.unknown()),
  options: z.object({
    reportUnusedDisableDirectives: z.literal("deny"),
    typeAware: z.literal(true),
    typeCheck: z.literal(true),
  }),
});
const TsconfigSchema = z.object({ compilerOptions: z.record(z.string(), z.unknown()).optional() });
const ExternalDeclarationsSchema = z.array(z.record(z.string(), z.unknown()));
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
  return files.toSorted();
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
    "bunfig.toml",
    ".oxlintrc.json",
    ".oxfmtrc.json",
    "tsconfig.json",
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
  const packageJson = PackageJsonSchema.parse(
    JSON.parse(await readFile(join(root, "package.json"), "utf8")),
  );
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
    const components = z
      .object({ style: z.string().optional() })
      .parse(JSON.parse(await readFile(componentsPath, "utf8")));
    if (components.style !== "base-nova") {
      findings.push({ level: "BLOCKING", message: "shadcn must use the CLI Base UI nova preset" });
    }
  }
  if (packageJson.scripts?.["ui:add"] !== "shadcn add") {
    findings.push({ level: "BLOCKING", message: "ui:add must invoke the official shadcn CLI" });
  }
  for (const [script, command] of Object.entries({
    dev: "BUN_OPTIONS=--conditions=development react-router dev",
    build: "react-router build",
    start: "bun server.ts",
    typegen: "react-router typegen",
    lint: "oxlint --deny-warnings .",
  })) {
    if (packageJson.scripts?.[script] !== command) {
      findings.push({
        level: "BLOCKING",
        message: `${script} must use the standard React Router Framework Mode command`,
      });
    }
  }
  const oxlint = OxlintSchema.parse(
    JSON.parse(await readFile(join(root, ".oxlintrc.json"), "utf8")),
  );
  if (
    !oxlint.plugins.includes("react") ||
    !oxlint.plugins.includes("jsx-a11y") ||
    oxlint.rules["react/jsx-no-constructed-context-values"] !== "warn" ||
    oxlint.rules["react/react-in-jsx-scope"] !== "off"
  ) {
    findings.push({
      level: "BLOCKING",
      message: "Oxlint must enforce React, accessibility, and stable Context values",
    });
  }
  const oxfmt = z
    .object({
      printWidth: z.literal(100),
      sortTailwindcss: z.object({
        stylesheet: z.literal("./src/app.css"),
        functions: z.array(z.string()),
      }),
    })
    .parse(JSON.parse(await readFile(join(root, ".oxfmtrc.json"), "utf8")));
  if (
    !oxfmt.sortTailwindcss.functions.includes("cn") ||
    !oxfmt.sortTailwindcss.functions.includes("cva")
  ) {
    findings.push({
      level: "BLOCKING",
      message: "Oxfmt must sort Tailwind classes in cn() and cva()",
    });
  }
  if (!packageJson.devDependencies?.["oxlint-tsgolint"]) {
    findings.push({ level: "BLOCKING", message: "Missing oxlint-tsgolint" });
  }
  if (Object.values(packageJson.scripts ?? {}).some((script) => script.includes("tsc --noEmit"))) {
    findings.push({ level: "BLOCKING", message: "Oxlint type checking replaces tsc --noEmit" });
  }
  for (const script of ["dev:test", "test:container"]) {
    if (script in (packageJson.scripts ?? {})) {
      findings.push({
        level: "BLOCKING",
        message: `${script} must not restore application-owned test orchestration`,
      });
    }
  }
  const tsconfig = TsconfigSchema.parse(
    JSON.parse(await readFile(join(root, "tsconfig.json"), "utf8")),
  );
  const compilerOptions = tsconfig.compilerOptions ?? {};
  for (const [option, expected] of Object.entries({
    target: "ESNext",
    module: "Preserve",
    moduleResolution: "Bundler",
    moduleDetection: "force",
    verbatimModuleSyntax: true,
    isolatedModules: true,
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    noUncheckedSideEffectImports: true,
    noUncheckedIndexedAccess: true,
    exactOptionalPropertyTypes: true,
  })) {
    if (compilerOptions[option] !== expected) {
      findings.push({
        level: "BLOCKING",
        message: `tsconfig compilerOptions.${option} must be ${JSON.stringify(expected)}`,
      });
    }
  }
  for (const redundant of [
    "allowJs",
    "allowSyntheticDefaultImports",
    "esModuleInterop",
    "forceConsistentCasingInFileNames",
    "resolveJsonModule",
    "useDefineForClassFields",
  ]) {
    if (redundant in compilerOptions) {
      findings.push({
        level: "BLOCKING",
        message: `tsconfig contains redundant compatibility option: ${redundant}`,
      });
    }
  }
  const bunfig = await readFile(join(root, "bunfig.toml"), "utf8");
  if (!/^\[run\]\s*$[\s\S]*^bun\s*=\s*true\s*$/m.test(bunfig)) {
    findings.push({ level: "BLOCKING", message: "bunfig.toml must run package CLIs with Bun" });
  }
  for (const legacy of [
    "index.html",
    "src/main.tsx",
    "src/app.tsx",
    "server/index.ts",
    "scripts/dev.ts",
    "scripts/dev-test.ts",
    "scripts/test-container.ts",
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
  if (
    !viteConfig.includes("@vitejs/plugin-react") ||
    !/compiler\s*:\s*true/.test(viteConfig) ||
    !viteConfig.includes('plugin.name === "vite:react-compiler"')
  ) {
    findings.push({
      level: "BLOCKING",
      message:
        "Vite must select only the Oxc Rust compiler transform from the official React plugin",
    });
  }
  for (const dependency of ["@vitejs/plugin-react", "oxc-transform-react"]) {
    if (!packageJson.devDependencies?.[dependency]) {
      findings.push({
        level: "BLOCKING",
        message: `Missing Oxc React Compiler dependency: ${dependency}`,
      });
    }
  }
  for (const legacy of ["babel-plugin-react-compiler", "vite-plugin-babel"]) {
    if (packageJson.devDependencies?.[legacy] || viteConfig.includes(legacy)) {
      findings.push({
        level: "BLOCKING",
        message: `Legacy Babel React Compiler integration remains: ${legacy}`,
      });
    }
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
  for (const file of files.filter((candidate) =>
    /^(?:src\/routes|src\/components)\/.*\.tsx$/.test(candidate),
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
  // The application owns exactly one Supabase project and therefore the default `public` schema.
  // Nothing may reintroduce a per-application schema name or a stored identity file.
  if (await exists(join(root, "monkeyos.identity.json"))) {
    findings.push({
      level: "BLOCKING",
      message:
        "monkeyos.identity.json returned; identity is derived from the repository name, not stored",
    });
  }
  if (packageJson.scripts?.["db:types"]?.includes("--schema")) {
    findings.push({
      level: "BLOCKING",
      message: "db:types must generate the default schema without a --schema selection",
    });
  }
  const supabaseConfig = await readFile(join(root, "supabase", "config.toml"), "utf8");
  // The two values that carry the repository name must agree. A half-finished rename is the only
  // way identity can now go wrong, and it would silently split the credential namespace from the
  // local container prefix.
  const projectId = /^project_id\s*=\s*"([^"]*)"/m.exec(supabaseConfig)?.[1];
  if (!projectId) {
    findings.push({ level: "BLOCKING", message: "supabase/config.toml declares no project_id" });
  } else if (projectId !== packageJson.name) {
    findings.push({
      level: "BLOCKING",
      message: `supabase/config.toml project_id ${projectId} does not match the package name ${packageJson.name}`,
    });
  }
  for (const setting of ["schemas", "extra_search_path"]) {
    if (new RegExp(`^${setting}\\s*=`, "m").test(supabaseConfig)) {
      findings.push({
        level: "BLOCKING",
        message: `supabase/config.toml must leave ${setting} at the default that exposes public`,
      });
    }
  }
  for (const file of files.filter((candidate) => /^src\/.*\.tsx?$/.test(candidate))) {
    const source = await readFile(join(root, file), "utf8");
    if (/db\s*:\s*\{\s*schema/.test(source) || /SupabaseClient<\s*Database\s*,/.test(source)) {
      findings.push({
        level: "BLOCKING",
        message: `${file} selects a Supabase schema; the application owns the default public schema`,
      });
    }
  }

  // Row level security, not schema isolation, is what keeps a new table unreachable. This check is
  // independent of any schema name and is the reason the default schema is safe to own.
  const migrations = files.filter((candidate) => /^supabase\/migrations\/.*\.sql$/.test(candidate));
  if (!migrations.length)
    findings.push({ level: "BLOCKING", message: "No Supabase migration is present" });
  let migrationSql = "";
  for (const file of migrations) migrationSql += `\n${await readFile(join(root, file), "utf8")}`;
  const secured = new Set(
    [
      ...migrationSql.matchAll(
        /alter\s+table\s+(?:only\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s+enable\s+row\s+level\s+security/gi,
      ),
    ].map((match) => match[1]!.toLowerCase()),
  );
  for (const match of migrationSql.matchAll(
    /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?/gi,
  )) {
    const table = match[1]!.toLowerCase();
    if (!secured.has(table)) {
      findings.push({
        level: "BLOCKING",
        message: `Table ${table} is created without row level security`,
      });
    }
  }
  if (/disable\s+row\s+level\s+security/i.test(migrationSql)) {
    findings.push({ level: "BLOCKING", message: "A migration disables row level security" });
  }
  if (/create\s+schema/i.test(migrationSql)) {
    findings.push({
      level: "BLOCKING",
      message: "A migration creates a schema; the application owns the default public schema",
    });
  }

  // The baseline is platform-owned and byte-identical across applications.
  const manifestPath = join(root, ".monkeyos", "baseline.manifest.json");
  if (!(await exists(manifestPath))) {
    findings.push({ level: "BLOCKING", message: "Missing .monkeyos/baseline.manifest.json" });
  } else {
    const manifest = z
      .object({ files: StringRecord })
      .parse(JSON.parse(await readFile(manifestPath, "utf8")));
    for (const [file, expected] of Object.entries(manifest.files)) {
      const path = join(root, "supabase", "migrations", file);
      if (!(await exists(path))) {
        findings.push({
          level: "BLOCKING",
          message: `Missing platform baseline migration: ${file}`,
        });
        continue;
      }
      const actual = new Bun.CryptoHasher("sha256").update(await readFile(path)).digest("hex");
      if (actual !== expected) {
        findings.push({
          level: "BLOCKING",
          message: `Platform baseline ${file} does not match its recorded checksum; restore the platform-owned file instead of editing it`,
        });
      }
    }
  }

  const sources = ExternalDeclarationsSchema.parse(
    JSON.parse(await readFile(join(root, "config", "external-data-sources.json"), "utf8")),
  );
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
