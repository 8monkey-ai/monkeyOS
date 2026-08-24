import { z } from "zod";

const repositoryPattern = /^[a-z0-9](?:[a-z0-9._-]{0,98}[a-z0-9])?$/;
const organizationPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

export const RepositoryRef = z.object({
  organization: z.string().regex(organizationPattern, "invalid GitHub organization"),
  repository: z
    .string()
    .regex(repositoryPattern, "repository must be lower-case and use GitHub-safe punctuation"),
  appsDomain: z
    .string()
    .min(3)
    .regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/),
});

export type ApplicationIdentity = {
  application: string;
  schema: string;
  developerRole: string;
  runtimeRole: string;
  imageRepository: string;
  hostname: string;
  secretService: string;
};

export function normalizeRepositoryName(repository: string): string {
  if (!repositoryPattern.test(repository)) {
    throw new Error(`Invalid repository name: ${repository}`);
  }
  const normalized = repository.replaceAll(/[-.]/g, "_");
  if (!/^[a-z][a-z0-9_]{0,47}$/.test(normalized)) {
    throw new Error(
      "Normalized application identity must start with a letter and be at most 48 characters",
    );
  }
  return normalized;
}

export function deriveIdentity(input: z.input<typeof RepositoryRef>): ApplicationIdentity {
  const value = RepositoryRef.parse(input);
  const schema = normalizeRepositoryName(value.repository);
  return {
    application: value.repository,
    schema,
    developerRole: `${schema}_dev`,
    runtimeRole: `${schema}_runtime`,
    imageRepository: `ghcr.io/${value.organization.toLowerCase()}/${value.repository}`,
    hostname: `${value.repository}.${value.appsDomain}`,
    secretService: `monkeyOS:${value.organization}/${value.repository}`,
  };
}

export function assertNoIdentityCollisions(repositories: string[]): void {
  const seen = new Map<string, string>();
  for (const repository of repositories) {
    const normalized = normalizeRepositoryName(repository);
    const existing = seen.get(normalized);
    if (existing) {
      throw new Error(
        `Repository identity collision: ${existing} and ${repository} both normalize to ${normalized}`,
      );
    }
    seen.set(normalized, repository);
  }
}
