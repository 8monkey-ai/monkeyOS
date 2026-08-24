import { expect, test } from "bun:test";
import { buildKamalConfig, parseRuntimeHosts } from "./generate-config";

test("builds a flexible default-ARM trusted Kamal config", () => {
  const result = buildKamalConfig({
    repository: "Acme/finance-reporting",
    gitSha: "a".repeat(40),
    hostname: "finance-reporting.apps.example.com",
    hosts: ["192.0.2.10", "runtime-02.example.com", "2001:db8::10"],
    sshUser: "deployer",
    registryUser: "github-actions",
    secrets: { SUPABASE_URL: "secret" },
  });
  expect(result.yaml).toContain("image: ghcr.io/acme/finance-reporting");
  expect(result.yaml).toContain(
    "    - 192.0.2.10\n    - runtime-02.example.com\n    - 2001:db8::10",
  );
  expect(result.yaml).toContain("  arch: arm64");
  expect(result.hosts).toEqual(["192.0.2.10", "runtime-02.example.com", "2001:db8::10"]);
  expect(result.yaml).not.toContain("SUPABASE_URL: secret");
});

test("builds for AMD and Intel x86-64 hosts through AMD64", () => {
  const result = buildKamalConfig({
    repository: "Acme/finance-reporting",
    gitSha: "b".repeat(40),
    hostname: "finance-reporting.apps.example.com",
    hosts: ["runtime.example.com"],
    architecture: "amd64",
    sshUser: "deployer",
    registryUser: "github-actions",
  });
  expect(result.yaml).toContain("  arch: amd64");
});

test("parses the protected semicolon-delimited host list", () => {
  expect(parseRuntimeHosts("host-01.example.com; 192.0.2.11;2001:db8::10")).toEqual([
    "host-01.example.com",
    "192.0.2.11",
    "2001:db8::10",
  ]);
  expect(() => parseRuntimeHosts("host.example.com;host.example.com")).toThrow();
  expect(() => parseRuntimeHosts(" ; ")).toThrow();
});

test("rejects non-SHA tags", () => {
  expect(() =>
    buildKamalConfig({
      repository: "Acme/finance",
      gitSha: "latest",
      hostname: "finance.apps.example.com",
      hosts: ["192.0.2.10"],
      sshUser: "deployer",
      registryUser: "github-actions",
    }),
  ).toThrow();
});
