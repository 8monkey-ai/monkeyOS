import { join } from "node:path";
import { renderApplicationFile } from "./app-template";
import { assertNoIdentityCollisions, deriveIdentity } from "./identity";
import { renderTemplate, sqlLiteral } from "./render";
import { parseProvisionArgs } from "./types";

type Command = { executable: string; args: string[]; stdin?: string; redacted?: boolean };

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

async function rewriteTemplateIdentity(repositoryRef: string): Promise<void> {
  const headSha = await capture("gh", [
    "api",
    `repos/${repositoryRef}/git/ref/heads/main`,
    "--jq",
    ".object.sha",
  ]);
  const baseTree = await capture("gh", [
    "api",
    `repos/${repositoryRef}/git/commits/${headSha}`,
    "--jq",
    ".tree.sha",
  ]);
  const tree = JSON.parse(
    await capture("gh", ["api", `repos/${repositoryRef}/git/trees/${baseTree}?recursive=1`]),
  ) as {
    tree: Array<{ path: string; mode: string; type: string; sha: string; size?: number }>;
  };
  const changes: Array<{ path: string; mode: string; type: "blob"; sha: string }> = [];
  for (const entry of tree.tree) {
    if (entry.type !== "blob" || (entry.size ?? 0) > 1_000_000) continue;
    const blob = JSON.parse(
      await capture("gh", ["api", `repos/${repositoryRef}/git/blobs/${entry.sha}`]),
    ) as { content: string; encoding: string };
    if (blob.encoding !== "base64") continue;
    const bytes = Buffer.from(blob.content.replaceAll("\n", ""), "base64");
    let source: string;
    try {
      source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      continue;
    }
    const rendered = renderApplicationFile(source, organization, identity);
    if (rendered === source) continue;
    const blobProcess = Bun.spawn(
      ["gh", "api", "--method", "POST", `repos/${repositoryRef}/git/blobs`, "--input", "-"],
      {
        stdin: new Blob([JSON.stringify({ content: rendered, encoding: "utf-8" })]),
        stdout: "pipe",
        stderr: "inherit",
      },
    );
    const blobOutput = await new Response(blobProcess.stdout).text();
    if ((await blobProcess.exited) !== 0) throw new Error(`Could not rewrite ${entry.path}`);
    changes.push({
      path: entry.path,
      mode: entry.mode,
      type: "blob",
      sha: (JSON.parse(blobOutput) as { sha: string }).sha,
    });
  }
  if (!changes.length) return;
  const treeProcess = Bun.spawn(
    ["gh", "api", "--method", "POST", `repos/${repositoryRef}/git/trees`, "--input", "-"],
    {
      stdin: new Blob([JSON.stringify({ base_tree: baseTree, tree: changes })]),
      stdout: "pipe",
      stderr: "inherit",
    },
  );
  const treeOutput = await new Response(treeProcess.stdout).text();
  if ((await treeProcess.exited) !== 0)
    throw new Error("Could not create provisioned identity tree");
  const newTree = (JSON.parse(treeOutput) as { sha: string }).sha;
  const commitProcess = Bun.spawn(
    ["gh", "api", "--method", "POST", `repos/${repositoryRef}/git/commits`, "--input", "-"],
    {
      stdin: new Blob([
        JSON.stringify({
          message: "chore: derive application identity from repository",
          tree: newTree,
          parents: [headSha],
        }),
      ]),
      stdout: "pipe",
      stderr: "inherit",
    },
  );
  const commitOutput = await new Response(commitProcess.stdout).text();
  if ((await commitProcess.exited) !== 0) throw new Error("Could not commit provisioned identity");
  await run(
    githubJson("PATCH", `repos/${repositoryRef}/git/refs/heads/main`, {
      sha: (JSON.parse(commitOutput) as { sha: string }).sha,
      force: false,
    }),
  );
}

const options = parseProvisionArgs(Bun.argv.slice(2));
const [organization, repository] = options.repository.split("/", 2) as [string, string];
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

const sqlTemplate = await Bun.file(join(root, "supabase", "admin", "provision-app.sql")).text();
const sql = renderTemplate(sqlTemplate, {
  APP_SCHEMA: identity.schema,
  DEV_ROLE: identity.developerRole,
  RUNTIME_ROLE: identity.runtimeRole,
  INITIAL_ADMIN_EMAIL_SQL: sqlLiteral(options.initialAdminEmail),
});

const plan = {
  mode: options.apply ? "apply" : "dry-run",
  repository: options.repository,
  identity,
  mutations: [
    "verify repository and normalized-name uniqueness",
    "install app schema and schema-scoped roles in Supabase",
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
const repositoryNames = (
  await capture("gh", [
    "api",
    "--paginate",
    `orgs/${organization}/repos?per_page=100`,
    "--jq",
    ".[].name",
  ])
)
  .split("\n")
  .filter(Boolean);
assertNoIdentityCollisions(repositoryNames);
await rewriteTemplateIdentity(options.repository);
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
