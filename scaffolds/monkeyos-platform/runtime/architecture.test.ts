import { expect, test } from "bun:test";
import { dockerPlatform, parseRuntimeArchitecture } from "./architecture";

test("defaults the portable runtime contract to ARM64", () => {
  expect(parseRuntimeArchitecture(undefined)).toBe("arm64");
  expect(dockerPlatform(parseRuntimeArchitecture(undefined))).toBe("linux/arm64");
});

test("supports AMD and Intel through the OCI AMD64 architecture", () => {
  expect(parseRuntimeArchitecture(" AMD64 ")).toBe("amd64");
  expect(dockerPlatform(parseRuntimeArchitecture("amd64"))).toBe("linux/amd64");
  expect(() => parseRuntimeArchitecture("x86_64")).toThrow();
});
