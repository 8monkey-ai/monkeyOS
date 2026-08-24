import { describe, expect, test } from "bun:test";
import { assertNoIdentityCollisions, deriveIdentity, normalizeRepositoryName } from "./identity";

describe("repository identity", () => {
  test("normalizes multi-word repositories once", () => {
    expect(normalizeRepositoryName("finance-reporting")).toBe("finance_reporting");
    expect(
      deriveIdentity({
        organization: "Example-Co",
        repository: "finance-reporting",
        appsDomain: "apps.example.com",
      }),
    ).toEqual({
      application: "finance-reporting",
      schema: "finance_reporting",
      developerRole: "finance_reporting_dev",
      runtimeRole: "finance_reporting_runtime",
      imageRepository: "ghcr.io/example-co/finance-reporting",
      hostname: "finance-reporting.apps.example.com",
      secretService: "monkeyOS:Example-Co/finance-reporting",
    });
  });

  test("rejects unsafe and overlong names", () => {
    expect(() => normalizeRepositoryName("Finance Reporting")).toThrow();
    expect(() => normalizeRepositoryName(`a-${"b".repeat(48)}`)).toThrow();
  });

  test("detects normalized collisions", () => {
    expect(() => assertNoIdentityCollisions(["finance-reporting", "finance_reporting"])).toThrow();
  });
});
