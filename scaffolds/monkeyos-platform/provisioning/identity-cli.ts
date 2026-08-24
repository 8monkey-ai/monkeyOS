import { deriveIdentity } from "./identity";

const [repositoryRef, appsDomain] = Bun.argv.slice(2);
if (!repositoryRef || !appsDomain || !repositoryRef.includes("/")) {
  console.error("Usage: bun run identity <organization/repository> <apps-domain>");
  process.exit(2);
}
const [organization, repository] = repositoryRef.split("/", 2) as [string, string];
console.log(JSON.stringify(deriveIdentity({ organization, repository, appsDomain }), null, 2));
