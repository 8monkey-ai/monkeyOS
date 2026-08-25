import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { deriveIdentity } from "./identity";
import { renderTemplate, sqlLiteral } from "./render";
import { parseProvisionArgs } from "./types";

type Command = { executable: string; args: string[]; stdin?: string; redacted?: boolean };
const GitContentSchema = z.object({
  content: z.string(),
  encoding: z.string(),
  sha: z.string(),
});

async function run(command: Command): Promise<void> {
  const process = Bun.spawn([command.executable, ...command.args], {
    stdin: command.stdin ? new Blob([command.stdin]) : undefined,
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await process.exited) !== 0) throw new Error(`${command.executable} failed`);
}

async function capture(executable: string, args: string[]): Promise<string> {
  const process = Bun.spawn([executable, ...args], { stdout: "pipe", stderr: "inherit" });
  const output = await new Response(process.stdout).text();
  if ((await process.exited) !== 0) throw new Error(`${executable} failed`);
  return output.trim();
}

function githubJson(method: string, endpoint: string, body: unknown): Command {
  return {
    executable: "gh",
    args: ["api", "--method", method, endpoint, "--input", "-"],
    stdin: JSON.stringify(body),
  };
}

async function workflowUpdate(repository: string, path: string, content: string): Promise<Command> {
  const check = Bun.spawn(["gh", "api", `repos/${repository}/contents/${path}`, "--jq", ".sha"], {
    stdout: "pipe",
    stderr: "ignore",
  });
  const sha = (await new Response(check.stdout).text()).trim();
  await check.exited;
  return githubJson("PUT", `repos/${repository}/contents/${path}`, {
    message: `chore: manage ${path} from monkeyOS platform`,
    content: Buffer.from(content).toString("base64"),
    ...(sha ? { sha } : {}),
  });
}

/**
 * Adopts the repository name. Only two values in an application are named after it, and neither is
 * read by application code: the `package.json` name that namespaces the developer credential store,
 * and the local Supabase container prefix. There is no schema, role, hostname, or image name to
 * propagate into source, so this replaces the former whole-repository text rewrite.
 */
const nameRewrites = [
  { path: "package.json", pattern: /^(\s*"name":\s*)"[^"]*"/m, label: "package name" },
  {
    path: "supabase/config.toml",
    pattern: /^(project_id\s*=\s*)"[^"]*"/m,
    label: "Supabase project id",
  },
] as const;

async function adoptRepositoryName(repositoryRef: string, name: string): Promise<void> {
  const quoted = JSON.stringify(name);
  for (const rewrite of nameRewrites) {
    const file = GitContentSchema.parse(
      JSON.parse(await capture("gh", ["api", `repos/${repositoryRef}/contents/${rewrite.path}`])),
    );
    if (file.encoding !== "base64") throw new Error(`Unexpected encoding for ${rewrite.path}`);
    const source = Buffer.from(file.content.replaceAll("\n", ""), "base64").toString("utf8");
    const rendered = source.replace(rewrite.pattern, (_, prefix: string) => `${prefix}${quoted}`);
    if (rendered === source) {
      if (rewrite.pattern.test(source)) continue;
      throw new Error(`Could not set the ${rewrite.label} in ${rewrite.path}`);
    }
    await run(
      githubJson("PUT", `repos/${repositoryRef}/contents/${rewrite.path}`, {
        message: `chore: adopt ${name} as the application name`,
        content: Buffer.from(rendered).toString("base64"),
        sha: file.sha,
      }),
    );
  }
}

const options = parseProvisionArgs(Bun.argv.slice(2));
const [organization, repository] = z
  .tuple([z.string().min(1), z.string().min(1)])
  .parse(options.repository.split("/", 2));
const identity = deriveIdentity({ organization, repository, appsDomain: options.appsDomain });
const root = join(import.meta.dir, "..");

const workflowFiles = ["ci.yml", "deploy.yml", "audit.yml"];
const renderedWorkflows = await Promise.all(
  workflowFiles.map(async (filename) => ({
    path: `.github/workflows/${filename}`,
    content: renderTemplate(await Bun.file(join(import.meta.dir, "templates", filename)).text(), {
      ORGANIZATION: organization,
    }),
  })),
);

const environmentBody = {
  wait_timer: 0,
  prevent_self_review: true,
  reviewers: [{ type: "Team", id: Number(options.deployersTeamId) }],
  deployment_branch_policy: { protected_branches: true, custom_branch_policies: false },
};

const rulesetBody = {
  name: "monkeyOS main compatibility",
  target: "branch",
  enforcement: "active",
  conditions: { ref_name: { include: ["refs/heads/main"], exclude: [] } },
  rules: [
    { type: "deletion" },
    { type: "non_fast_forward" },
    {
      type: "required_status_checks",
      parameters: {
        strict_required_status_checks_policy: true,
        required_status_checks: [{ context: "ci / quality" }],
      },
    },
  ],
  bypass_actors: [],
};

// The baseline is applied from the same canonical file every application receives verbatim, so the
// provisioned database and the application's migration history cannot describe different schemas.
const baselineDirectory = join(root, "supabase", "baseline");
const baselineFile = z
  .string()
  .regex(/^(\d{14})_([a-z0-9_]+)\.sql$/)
  .parse(
    (await readdir(baselineDirectory)).filter((entry) => entry.endsWith(".sql")).toSorted()[0],
  );
const [, baselineVersion, baselineName] = /^(\d{14})_([a-z0-9_]+)\.sql$/.exec(baselineFile)!;
const baselineSql = await Bun.file(join(baselineDirectory, baselineFile)).text();
const adminSql = renderTemplate(
  await Bun.file(join(root, "supabase", "admin", "provision-app.sql")).text(),
  {
    BASELINE_VERSION: baselineVersion!,
    BASELINE_NAME: baselineName!,
    INITIAL_ADMIN_EMAIL_SQL: sqlLiteral(options.initialAdminEmail),
  },
);
const sql = `${baselineSql}\n${adminSql}`;

const plan = {
  mode: options.apply ? "apply" : "dry-run",
  repository: options.repository,
  identity,
  baseline: baselineFile,
  mutations: [
    "verify the repository exists",
    "adopt the repository name in package.json and supabase/config.toml",
    "apply the canonical baseline to the application's own Supabase project and record it in migration history",
    "create app_dev and app_runtime roles scoped to the default public schema",
    "create protected production environment with Deployer reviewers and no self-review",
    "set platform-owned environment variables for hostname, pool, and SSH identity; consume organization RUNTIME_ARCH",
    "install thin managed workflow callers",
    "protect main with the central quality status check",
    "add the existing exact-email Auth user as the initial app admin",
  ],
};
console.log(JSON.stringify(plan, null, 2));

if (!options.apply) process.exit(0);

const requiredEnvironment = ["SUPABASE_DB_URL", "RUNTIME_HOST", "DEPLOY_SSH_USER"] as const;
for (const name of requiredEnvironment) {
  if (!process.env[name]) throw new Error(`Missing platform-admin environment value: ${name}`);
}

await run({ executable: "gh", args: ["api", `repos/${options.repository}`, "--silent"] });
await adoptRepositoryName(options.repository, repository);
await run({
  executable: "psql",
  args: [process.env.SUPABASE_DB_URL!, "--set", "ON_ERROR_STOP=1", "--no-psqlrc"],
  stdin: sql,
  redacted: true,
});
await run(
  githubJson("PUT", `repos/${options.repository}/environments/production`, environmentBody),
);

const variables = {
  APP_HOSTNAME: identity.hostname,
  RUNTIME_HOST: process.env.RUNTIME_HOST!,
  DEPLOY_SSH_USER: process.env.DEPLOY_SSH_USER!,
};
for (const [name, value] of Object.entries(variables)) {
  await run(
    githubJson("POST", `repos/${options.repository}/environments/production/variables`, {
      name,
      value,
    }),
  );
}
for (const workflow of renderedWorkflows) {
  await run(await workflowUpdate(options.repository, workflow.path, workflow.content));
}
await run(githubJson("POST", `repos/${options.repository}/rulesets`, rulesetBody));
console.log(`Provisioned ${options.repository} without creating monkeyOS registry state.`);
