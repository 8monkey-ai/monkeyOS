import type { ApplicationIdentity } from "./identity";

export function renderApplicationFile(
  source: string,
  organization: string,
  identity: ApplicationIdentity,
): string {
  const replacements: Array<[string, string]> = [
    ["monkeyOS:monkeyos-org/monkeyos-app-template", identity.secretService],
    ["monkeyos-app-template.apps.example.invalid", identity.hostname],
    ["monkeyos_app_template_runtime", identity.runtimeRole],
    ["monkeyos_app_template_dev", identity.developerRole],
    ["monkeyos_app_template", identity.schema],
    ["monkeyos-app-template", identity.application],
    ["monkeyos-org", organization],
  ];
  let rendered = source;
  for (const [from, to] of replacements) rendered = rendered.replaceAll(from, to);
  return rendered;
}
