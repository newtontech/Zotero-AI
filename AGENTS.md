# Agent Guidelines for Zotero-AI-Newton

- Always run `npm run build` (or equivalent full build) before opening a PR. If the build fails due to environment/network issues, note the failure and reason in the final summary.
- Add null/undefined guards around DOM/document access in TypeScript to satisfy strict checks.
- When offline or behind a blocked network, run builds with `NO_UPDATE_NOTIFIER=1 npm run build` to bypass the scaffold update check.
- Do not commit binary release artifacts (e.g., `.xpi`). Regenerate them with `NO_UPDATE_NOTIFIER=1 npm run build`, which outputs XPI packages under `.scaffold/build/`.
- Current SSH push status: `git push` fails due to host key verification. Add GitHub to `~/.ssh/known_hosts` before pushing future commits.
- Recent build command: `NO_UPDATE_NOTIFIER=1 npm run build` (succeeds; latest XPI is versioned and copied to `release/`, gitignored).
