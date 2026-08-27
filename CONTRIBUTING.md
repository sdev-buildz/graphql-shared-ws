# Contributing to ts-strict-utils

Thank you for your interest in contributing! This document explains how to file issues, propose changes, and submit pull requests so we can review and merge them quickly.

## Code of Conduct

Please follow a respectful, collaborative, and inclusive tone in all discussions, issues, and pull requests. By participating, you agree to follow the project's Code of Conduct. If the repository doesn't include one yet, please behave according to common community standards.

## How you can help

- Report bugs and provide reproducible steps.
- Request features and explain the use case.
- Improve documentation and examples.
- Send pull requests with bug fixes, new utilities, or improvements.

## Getting started

1. Fork the repo and create a feature branch from the repository's default branch:

```shell
   git clone https://github.com/sdev_buildz/graphql-shared-ws.git
   cd graphql-shared-ws
   git checkout -b feat/short-description
```

2. Install dependencies:

```shell
   pnpm install
```

3. Run linters, type checks, and tests locally before opening a PR:

```shell
   pnpm run test
   pnpm run check
```

Adjust the above commands if this repository uses yarn or pnpm.

## Project conventions

- Language: TypeScript. Keep types strict and enable/maintain strict compiler settings where applicable.
- Formatting: Use Prettier (or the repo's formatter) and do not commit formatting-only diffs.
- Linting: Follow ESLint rules configured in the repo. Fix lint errors before submitting a PR.

## Commits

Use clear, small commits. Follow Conventional Commits when possible, e.g.:

- feat: add new utility to safely parse JSON
- fix: prevent runtime error when input is undefined
- docs: update README example for parseJson

This helps generate changelogs and manage releases.

## Pull requests

- Open a PR from a branch in your fork to the repository's default branch.
- Make sure your branch contains a clear title and description describing the change and the motivation.
- Link any related issue (e.g., "Fixes #123").
- Ensure all CI checks pass (lint, typecheck, tests).
- Keep changes focused and small — one logical change per PR.
- Add or update tests for new behavior and include examples in documentation when appropriate.

## Testing

- Add unit tests for bug fixes and features. Prefer small, deterministic tests.
- Run the full test suite before submitting: npm test
- If you add behavior that touches public API, document it and include tests covering edge cases.

## Releases and versioning

This repository follows semantic versioning. Releases are managed by maintainers. If you think your change warrants a major/minor/patch bump, explain why either by running `npx changeset` or in the PR description.

## CI and automation

Please make sure your PRs pass the project's CI (GitHub Actions or other). If you need help interpreting CI failures, ask in the PR and include logs.

## Security

If you discover a security vulnerability, please do NOT open a public issue. Instead, contact the maintainers privately (use the repository's security policy if present) or email `stevexdev@zohomail.in`.

## Reporting issues

When opening an issue, include:

- A clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Minimal code sample or link to a repo demonstrating the problem
- Node/TS/npm versions if relevant

## Thank you

Thanks for taking the time to contribute — your help improves the library for everyone. If your contribution is large or you want it reviewed early, open a draft PR and ask for feedback.
