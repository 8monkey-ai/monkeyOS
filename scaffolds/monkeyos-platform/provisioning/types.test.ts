import { expect, test } from "bun:test";
import { parseProvisionArgs } from "./types";

test("parses dry-run provision input", () => {
  expect(
    parseProvisionArgs([
      "--repository",
      "example/finance",
      "--apps-domain",
      "apps.example.com",
      "--initial-admin-email",
      "admin@example.com",
      "--deployers-team-id",
      "123",
    ]).apply,
  ).toBe(false);
});
