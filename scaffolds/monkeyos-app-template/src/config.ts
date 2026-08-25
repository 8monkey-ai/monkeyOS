import { z } from "zod";

export const PublicConfigSchema = z.object({
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(20),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  gitSha: z.string().regex(/^(?:development|test|[0-9a-f]{7,40})$/),
  externalSources: z.array(
    z.object({ name: z.string(), configured: z.boolean(), required: z.boolean() }),
  ),
});

export const SourceDeclarationsSchema = z.array(
  z.object({ name: z.string(), required: z.boolean() }),
);

const PackageJsonSchema = z.object({ name: z.string().min(1), version: z.string() });

const PrivateConfigSchema = PublicConfigSchema.extend({
  externalValues: z.record(z.string(), z.string()).default({}),
});

export type PublicConfig = z.infer<typeof PublicConfigSchema>;
export type PrivateConfig = z.infer<typeof PrivateConfigSchema>;

type SourceDeclaration = z.infer<typeof SourceDeclarationsSchema>[number];
type LoadOptions = {
  mode?: "development" | "production" | "test";
  explicit?: Record<string, string>;
  declarations?: SourceDeclaration[];
};

async function secretValue(service: string, name: string): Promise<string | undefined> {
  const value = await Bun.secrets.get({ service, name });
  return value ?? undefined;
}

/**
 * The OS credential-store namespace for local development. It is derived from the repository
 * name rather than configured, and it is the only application-specific name in the repository.
 */
export async function secretService(): Promise<string> {
  const { name } = PackageJsonSchema.parse(await Bun.file("package.json").json());
  return `monkeyOS:${name}`;
}

export async function loadConfig(options: LoadOptions = {}): Promise<PrivateConfig> {
  const mode =
    options.mode ?? (process.env.APP_ENV === "production" ? "production" : "development");
  const packageJson = PackageJsonSchema.parse(await Bun.file("package.json").json());
  const declarations =
    options.declarations ??
    SourceDeclarationsSchema.parse(await Bun.file("config/external-data-sources.json").json());
  const explicit = options.explicit ?? {};
  const resolve = async (name: string): Promise<string | undefined> => {
    if (mode === "test") return explicit[name];
    if (mode === "production") return process.env[name];
    return secretValue(`monkeyOS:${packageJson.name}`, name);
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
      ? z.record(z.string(), z.string()).parse(JSON.parse(process.env.TEST_CONFIG_JSON))
      : undefined;
    return publicConfig(await loadConfig({ mode, ...(explicit ? { explicit } : {}) }));
  })();
  return runtimeConfig;
}
