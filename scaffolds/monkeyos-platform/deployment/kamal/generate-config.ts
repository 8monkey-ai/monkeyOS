import { mkdir, writeFile } from "node:fs/promises";
import { z } from "zod";
import { RuntimeArchitecture, parseRuntimeArchitecture } from "../../runtime/architecture";

const RuntimeHost = z
  .string()
  .trim()
  .min(1)
  .max(253)
  .refine((value) => {
    if (z.ipv4().safeParse(value).success || z.ipv6().safeParse(value).success) return true;
    return value.split(".").every((label) => /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/.test(label));
  }, "invalid runtime host");

const RuntimeHosts = z
  .array(RuntimeHost)
  .min(1)
  .superRefine((hosts, context) => {
    if (new Set(hosts).size !== hosts.length) {
      context.addIssue({ code: "custom", message: "runtime hosts must be unique" });
    }
  });

const Input = z.object({
  repository: z.string().regex(/^[A-Za-z0-9-]+\/[a-z0-9-]+$/),
  gitSha: z.string().regex(/^[0-9a-f]{40}$/),
  hostname: z.string().regex(/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/),
  hosts: RuntimeHosts,
  architecture: RuntimeArchitecture.default("arm64"),
  sshUser: z.string().regex(/^[a-z_][a-z0-9_-]{0,31}$/),
  registryUser: z.string().min(1),
  secrets: z.record(z.string().regex(/^[A-Z][A-Z0-9_]*$/), z.string()).default({}),
});

export function parseRuntimeHosts(value: string): string[] {
  return RuntimeHosts.parse(
    value
      .split(";")
      .map((host) => host.trim())
      .filter(Boolean),
  );
}

export function buildKamalConfig(raw: z.input<typeof Input>) {
  const input = Input.parse(raw);
  const [organization, repository] = input.repository.toLowerCase().split("/", 2) as [
    string,
    string,
  ];
  const service = repository.replaceAll("-", "_");
  const secretNames = Object.keys(input.secrets).sort();
  const yaml = [
    `service: ${service}`,
    `image: ghcr.io/${organization}/${repository}`,
    "servers:",
    "  web:",
    ...input.hosts.map((host) => `    - ${host}`),
    "proxy:",
    `  host: ${input.hostname}`,
    "  app_port: 3000",
    "  healthcheck:",
    "    path: /healthz",
    "    interval: 5",
    "    timeout: 5",
    "registry:",
    "  server: ghcr.io",
    `  username: ${input.registryUser}`,
    "  password:",
    "    - KAMAL_REGISTRY_PASSWORD",
    "ssh:",
    `  user: ${input.sshUser}`,
    "builder:",
    `  arch: ${input.architecture}`,
    "env:",
    "  clear:",
    "    APP_ENV: production",
    `    GIT_SHA: ${input.gitSha}`,
    ...(secretNames.length ? ["  secret:", ...secretNames.map((name) => `    - ${name}`)] : []),
    "boot:",
    "  limit: 1",
    "  wait: 5",
    "",
  ].join("\n");
  const secretFile = [
    "KAMAL_REGISTRY_PASSWORD=$KAMAL_REGISTRY_PASSWORD",
    ...secretNames.map((name) => `${name}=$${name}`),
    "",
  ].join("\n");
  return { yaml, secretFile, secrets: input.secrets, hosts: input.hosts };
}

if (import.meta.main) {
  const requiredEnvironment = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing protected deployment value: ${name}`);
    return value;
  };
  const appSecrets = JSON.parse(process.env.APP_ENV_JSON ?? "{}") as Record<string, string>;
  const config = buildKamalConfig({
    repository: requiredEnvironment("GITHUB_REPOSITORY"),
    gitSha: requiredEnvironment("DEPLOY_SHA"),
    hostname: requiredEnvironment("APP_HOSTNAME"),
    hosts: parseRuntimeHosts(requiredEnvironment("RUNTIME_HOST")),
    architecture: parseRuntimeArchitecture(process.env.RUNTIME_ARCH),
    sshUser: requiredEnvironment("DEPLOY_SSH_USER"),
    registryUser: requiredEnvironment("GITHUB_ACTOR"),
    secrets: appSecrets,
  });
  await mkdir("config", { recursive: true });
  await mkdir(".kamal", { recursive: true });
  await writeFile("config/deploy.yml", config.yaml, { mode: 0o600 });
  await writeFile("config/runtime-hosts", `${config.hosts.join("\n")}\n`, { mode: 0o600 });
  await writeFile(".kamal/secrets", config.secretFile, { mode: 0o600 });
  for (const [name, value] of Object.entries(config.secrets)) {
    console.log(`::add-mask::${value}`);
    await Bun.write(Bun.stdout, `Exporting protected runtime key ${name}\n`);
  }
}
