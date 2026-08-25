# Changelog

## 2.7.0

- Made the Oxc Rust implementation of React Compiler the centrally audited application standard while preserving React Router's JSX and Fast Refresh ownership.
- Rejected legacy direct Babel compiler dependencies and configuration in application repositories.

## 2.6.0

- Standardized both repositories on Oxlint correctness and suspicious categories with type-aware compiler diagnostics and stale-suppression detection.
- Added application React/accessibility checks and targeted Context-value stability without blanket `react-perf` heuristics.
- Added explicit Oxfmt policy and centrally enforced Tailwind v4 class sorting for applications.
- Replaced unchecked platform input and GitHub response assertions with Zod-validated boundaries.
