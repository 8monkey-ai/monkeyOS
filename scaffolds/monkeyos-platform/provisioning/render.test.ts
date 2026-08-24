import { expect, test } from "bun:test";
import { renderTemplate, sqlLiteral } from "./render";

test("renders only explicit uppercase tokens", () => {
  expect(renderTemplate("schema __APP_SCHEMA__", { APP_SCHEMA: "finance" })).toBe("schema finance");
  expect(() => renderTemplate("__MISSING__", {})).toThrow("Missing template value");
});

test("quotes SQL literals", () => expect(sqlLiteral("o'hare")).toBe("'o''hare'"));
