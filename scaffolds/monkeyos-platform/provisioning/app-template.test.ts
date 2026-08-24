import { expect, test } from "bun:test";
import { renderApplicationFile } from "./app-template";
import { deriveIdentity } from "./identity";

test("rewrites every starter identity from one derived identity", () => {
  const identity = deriveIdentity({
    organization: "Acme",
    repository: "finance-reporting",
    appsDomain: "apps.acme.example",
  });
  const source =
    "monkeyos-org monkeyos-app-template monkeyos_app_template monkeyos_app_template_dev monkeyos_app_template_runtime monkeyos-app-template.apps.example.invalid monkeyOS:monkeyos-org/monkeyos-app-template";
  const rendered = renderApplicationFile(source, "Acme", identity);
  expect(rendered).toContain(
    "Acme finance-reporting finance_reporting finance_reporting_dev finance_reporting_runtime",
  );
  expect(rendered).toContain("finance-reporting.apps.acme.example");
  expect(rendered).toContain("monkeyOS:Acme/finance-reporting");
  expect(rendered).not.toContain("monkeyos-app-template");
});
