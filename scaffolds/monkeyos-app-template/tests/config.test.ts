import { describe, expect, test } from "bun:test";
import { loadConfig, publicConfig } from "../src/config";

describe("typed configuration", () => {
  test("uses explicit test values and excludes private sources", async () => {
    const config = await loadConfig({
      mode: "test",
      explicit: {
        SUPABASE_URL: "http://127.0.0.1:54321",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_explicit_test_value",
        REPORTING_DATABASE_URL: "postgres://read-only.example.invalid/db",
      },
      declarations: [{ name: "REPORTING_DATABASE_URL", required: false }],
    });
    expect(config.externalValues.REPORTING_DATABASE_URL).toContain("postgres://");
    expect(JSON.stringify(publicConfig(config))).not.toContain("postgres://");
  });

  test("fails fast when required configuration is missing", async () => {
    let failure: unknown;
    try {
      await loadConfig({ mode: "test", explicit: {}, declarations: [] });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
  });
});
