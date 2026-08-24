const service = Bun.argv[2];
const secretName = Bun.argv[3];
if (!service || !secretName) throw new Error("Expected a credential service and name");
const value = await Bun.secrets.get({ service, name: secretName });
if (value) process.stdout.write(value);

export {};
