# Application provisioning

Provisioning is a bootstrap control-plane operation, not an application registry. Its inputs come from the repository, organization settings, and the operator; after it finishes, ownership remains in GitHub, Supabase, and the protected environment.

First preview the derived identity and mutations:

```sh
bun run provision --repository acme/finance-reporting \
  --apps-domain apps.acme.example \
  --initial-admin-email owner@acme.example \
  --deployers-team-id 1234
```

Run again with `--apply` from a Platform Admin workstation after setting `SUPABASE_DB_URL`, `RUNTIME_HOST`, and `DEPLOY_SSH_USER`. `RUNTIME_HOST` is the protected semicolon-separated list of unique runtime IP addresses or hostnames, for example `host-01.example.com;host-02.example.com`. Apps consume the Platform Admin-owned organization variable `RUNTIME_ARCH` directly; it defaults to `arm64` and accepts `amd64` for AMD/Intel x86-64, so provisioning does not duplicate it into each app environment. The operator also needs authenticated `gh` and `psql` clients. Secrets are never accepted as command-line arguments.

Before applying, query organization repositories and pass all names through `assertNoIdentityCollisions`. GitHub repository creation from the application template should precede this command. The protected `v1` tag on this repository is the compatibility channel; only Platform Admins may move it.
