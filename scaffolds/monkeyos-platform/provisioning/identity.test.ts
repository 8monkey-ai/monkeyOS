import { describe, expect, test } from "bun:test";
import { deriveIdentity } from "./identity";

describe("repository identity", () => {
  test("derives only deployment coordinates", () => {
    expect(
      deriveIdentity({
        organization: "Example-Co",
        repository: "finance-reporting",
        appsDomain: "apps.example.com",
      }),
    ).toEqual({
      hostname: "finance-reporting.apps.example.com",
      imageRepository: "ghcr.io/example-co/finance-reporting",
    });
  });

  test("rejects unsafe names", () => {
    expect(() =>
      deriveIdentity({
        organization: "Example-Co",
        repository: "Finance Reporting",
        appsDomain: "apps.example.com",
      }),
    ).toThrow();
  });

  test("accepts names that a per-application schema would have had to normalize", () => {
    // Nothing becomes a PostgreSQL identifier, so punctuation and length are GitHub's concern only
    // and two repositories that once collided when normalized are now independent.
    for (const repository of ["finance-reporting", "finance.reporting", `a-${"b".repeat(60)}`]) {
      expect(
        deriveIdentity({ organization: "Example-Co", repository, appsDomain: "apps.example.com" })
          .hostname,
      ).toBe(`${repository}.apps.example.com`);
    }
  });
});
