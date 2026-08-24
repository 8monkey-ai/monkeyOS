import { z } from "zod";

export const RuntimeArchitecture = z.enum(["arm64", "amd64"]);
export type RuntimeArchitecture = z.infer<typeof RuntimeArchitecture>;

export function parseRuntimeArchitecture(value: string | undefined): RuntimeArchitecture {
  return RuntimeArchitecture.parse(value?.trim().toLowerCase() || "arm64");
}

export function dockerPlatform(architecture: RuntimeArchitecture): string {
  return `linux/${architecture}`;
}
