import { expect, test } from "bun:test";
import { auditRepository } from "../scripts/repository-audit";

test("starter repository satisfies deterministic contract audit", async () => {
  expect(await auditRepository(process.cwd())).toEqual([]);
});
