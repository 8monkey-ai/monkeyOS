import { z } from "zod";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

export const PublicConfigSchema = z.object({
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(20),
  appSchema: z.string().regex(/^[a-z][a-z0-9_]{0,47}$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  gitSha: z.string().regex(/^(?:development|test|[0-9a-f]{7,40})$/),
  externalSources: z.array(
    z.object({ name: z.string(), configured: z.boolean(), required: z.boolean() }),
  ),
});

const PrivateConfigSchema = PublicConfigSchema.extend({
  externalValues: z.record(z.string(), z.string()).default({}),
});

export type PublicConfig = z.infer<typeof PublicConfigSchema>;
export type PrivateConfig = z.infer<typeof PrivateConfigSchema>;

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

type SourceDeclaration = { name: string; required: boolean };
type LoadOptions = {
  mode?: "development" | "production" | "test";
  explicit?: Record<string, string>;
  declarations?: SourceDeclaration[];
};

async function secretValue(service: string, name: string): Promise<string | undefined> {
  if (typeof Bun !== "undefined") {
    const value = await Bun.secrets.get({ service, name });
    return value ?? undefined;
  }
  const result = spawnSync("bun", ["scripts/read-local-secret.ts", service, name], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (result.status !== 0) throw new Error(`Unable to read local credential: ${name}`);
  return result.stdout || undefined;
}

export async function loadConfig(options: LoadOptions = {}): Promise<PrivateConfig> {
  const mode =
    options.mode ?? (process.env.APP_ENV === "production" ? "production" : "development");
  const identity = await readJson<{
    schema: string;
    secretService: string;
  }>("monkeyos.identity.json");
  const packageJson = await readJson<{ version: string }>("package.json");
  const declarations =
    options.declarations ??
    (await readJson<SourceDeclaration[]>("config/external-data-sources.json"));
  const explicit = options.explicit ?? {};
  const resolve = async (name: string): Promise<string | undefined> => {
    if (mode === "test") return explicit[name];
    if (mode === "production") return process.env[name];
    return secretValue(identity.secretService, name);
  };
  const externalValues: Record<string, string> = {};
  for (const source of declarations) {
    const value = await resolve(source.name);
    if (value) externalValues[source.name] = value;
    if (source.required && !value)
      throw new Error(`Missing required local configuration: ${source.name}`);
  }
  return PrivateConfigSchema.parse({
    supabaseUrl: await resolve("SUPABASE_URL"),
    supabasePublishableKey: await resolve("SUPABASE_PUBLISHABLE_KEY"),
    appSchema: process.env.APP_SCHEMA ?? identity.schema,
    version: process.env.APP_VERSION ?? packageJson.version,
    gitSha: process.env.GIT_SHA ?? (mode === "test" ? "test" : "development"),
    externalValues,
    externalSources: declarations.map((source) => ({
      name: source.name,
      configured: source.name in externalValues,
      required: source.required,
    })),
  });
}

export function publicConfig(config: PrivateConfig): PublicConfig {
  const { externalValues: _, ...safe } = config;
  return PublicConfigSchema.parse(safe);
}

let runtimeConfig: Promise<PublicConfig> | undefined;

export function loadPublicRuntimeConfig(): Promise<PublicConfig> {
  runtimeConfig ??= (async () => {
    const mode =
      process.env.APP_ENV === "production"
        ? "production"
        : process.env.APP_ENV === "test"
          ? "test"
          : "development";
    const explicit = process.env.TEST_CONFIG_JSON
      ? (JSON.parse(process.env.TEST_CONFIG_JSON) as Record<string, string>)
      : undefined;
    return publicConfig(await loadConfig({ mode, ...(explicit ? { explicit } : {}) }));
  })();
  return runtimeConfig;
}
