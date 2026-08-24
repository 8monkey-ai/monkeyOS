# Pi configuration

GitHub Actions always invokes `@earendil-works/pi-coding-agent@latest` in non-interactive, no-session, read-only mode. The organization installation must configure:

- `PI_PROVIDER` — organization variable containing a Pi provider name such as `openai`, `anthropic`, or `google`.
- `PI_MODEL` — organization variable containing a model ID supported by that provider.
- `PI_API_KEY` — organization secret granted only to repositories that may call the audit workflow.

The workflow passes all three explicitly to Pi. It fails closed when any value is absent, and the API key is never committed to `settings.json`, written to an artifact, or printed. Provider/model changes are organization configuration changes and do not require editing the central workflow.

`settings.json` controls read-only tools and centrally reviewed skills. `audit-prompt.md` defines the task. The protected `v1` platform channel controls both files.
