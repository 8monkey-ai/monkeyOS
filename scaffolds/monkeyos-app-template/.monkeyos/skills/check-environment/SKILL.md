---
name: check-environment
description: Verify the local monkeyOS toolchain and configuration safely.
---

# Check environment

Require Git, authenticated GitHub CLI where central resources are private, the latest stable Bun, the current Node LTS supported by React Router, a Docker-compatible runtime, and Supabase CLI. Check versions through each tool's own help/version output. Validate the repository-derived identity, standard React Router Framework Mode files/commands, `components.json`, committed lockfile, compatible dependency ranges, and the names in `config/external-data-sources.json`. Ask the typed config wrapper whether required secrets exist; never print, export, or copy their values. Local development never requires Kamal, cloud CLIs, production SSH, Cloudflare credentials, or production database credentials.
