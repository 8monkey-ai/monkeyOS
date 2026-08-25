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

/**
 * Deployment coordinates, and nothing else. Each application owns one Supabase project and
 * therefore the default `public` schema, so there is no schema or role name to derive, no
 * normalization to a PostgreSQL identifier, and no cross-repository collision to detect. An
 * application's own credential-store namespace is derived from its `package.json` name.
 */
export type ApplicationIdentity = {
  hostname: string;
  imageRepository: string;
};

export function deriveIdentity(input: z.input<typeof RepositoryRef>): ApplicationIdentity {
  const value = RepositoryRef.parse(input);
  return {
    hostname: `${value.repository}.${value.appsDomain}`,
    imageRepository: `ghcr.io/${value.organization.toLowerCase()}/${value.repository}`,
  };
}
