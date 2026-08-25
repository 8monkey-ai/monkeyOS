import { deriveIdentity } from "./identity";

const [repositoryRef, appsDomain] = Bun.argv.slice(2);
if (!repositoryRef || !appsDomain || !repositoryRef.includes("/")) {
  console.error("Usage: bun run identity <organization/repository> <apps-domain>");
  console.error("Prints deployment coordinates. Schema, roles, and secrets are convention.");
  process.exit(2);
}
const [organization, repository] = repositoryRef.split("/", 2);
if (!organization || !repository) throw new Error("Repository must include organization and name");
console.log(JSON.stringify(deriveIdentity({ organization, repository, appsDomain }), null, 2));
