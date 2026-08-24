import { z } from "zod";

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

type SourceDeclaration = { name: string; required: boolean };
type LoadOptions = {
  mode?: "development" | "production" | "test";
  explicit?: Record<string, string>;
  declarations?: SourceDeclaration[];
};

async function secretValue(service: string, name: string): Promise<string | undefined> {
  const value = await Bun.secrets.get({ service, name });
  return value ?? undefined;
}

export async function loadConfig(options: LoadOptions = {}): Promise<PrivateConfig> {
  const mode =
    options.mode ?? (process.env.APP_ENV === "production" ? "production" : "development");
  const identity = (await Bun.file("monkeyos.identity.json").json()) as {
    schema: string;
    secretService: string;
  };
  const packageJson = (await Bun.file("package.json").json()) as { version: string };
  const declarations =
    options.declarations ??
    ((await Bun.file("config/external-data-sources.json").json()) as SourceDeclaration[]);
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
