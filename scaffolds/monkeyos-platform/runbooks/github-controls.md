# GitHub organization controls

## Repository access

- Contributors normally receive repository `Write`; this does not grant production approval.
- Deployers are a separate team referenced as required reviewers on each repository's protected `production` environment.
- Enable prevent-self-review where separation of duty requires it. Environment secrets are unavailable to jobs until protection rules pass.
- Platform Admins alone administer `monkeyos-platform`, organization variables/secrets, workflow access, the `production` environment mechanism, infrastructure, Cloudflare, Supabase administration, and deployment credentials.

## Rulesets

Protect app `main` against deletion and force-push, and require the reusable workflow check `ci / quality`. Organizations that require pull requests may add that rule without making branching part of the monkeyOS platform contract. Layered rulesets use the strictest applicable rule.

Protect `monkeyos-platform` more strongly: require pull requests, independent review, central CI, signed commits if organizational policy supports them, and restricted updates to compatibility tags. `v1` is a moving compatibility channel for backwards-compatible improvements; only Platform Admins move it. Breaking contract work ships on a new protected `v2` channel.

For a private platform repository, explicitly allow Actions in other organization repositories to access its reusable workflows. Review the GitHub warning that callers can indirectly read workflow content/log output through the scoped token.

## Secrets and variables

Organization variables hold non-secret pool configuration. Platform Admins set `RUNTIME_ARCH` once at organization scope (`arm64` by default or `amd64` for AMD/Intel x86-64); CI and protected deploy workflows consume that same value, and app environments must not shadow it. Shared production secrets may be organization secrets scoped to approved repositories. App-specific runtime secrets and `DEPLOY_SSH_PRIVATE_KEY` are protected environment secrets. Local-development values never belong in GitHub production environments, and production values never go to developers.
