import { z } from "zod";

export const ProvisionOptions = z.object({
  repository: z.string().regex(/^[A-Za-z0-9-]+\/[a-z0-9-]+$/),
  appsDomain: z.string(),
  initialAdminEmail: z.string().email(),
  deployersTeamId: z.string().regex(/^\d+$/),
  apply: z.boolean().default(false),
});

export function parseProvisionArgs(args: string[]) {
  const values = new Map<string, string>();
  let apply = false;
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (key === "--apply") {
      apply = true;
      continue;
    }
    const value = args[index + 1];
    if (!key?.startsWith("--") || !value) throw new Error(`Invalid argument near ${key ?? "end"}`);
    values.set(key.slice(2), value);
    index += 1;
  }
  return ProvisionOptions.parse({
    repository: values.get("repository"),
    appsDomain: values.get("apps-domain"),
    initialAdminEmail: values.get("initial-admin-email"),
    deployersTeamId: values.get("deployers-team-id"),
    apply,
  });
}
