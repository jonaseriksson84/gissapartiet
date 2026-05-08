# Context

## Read these first

Before picking an issue, read these to understand the project's conventions and history:

- `CLAUDE.md` — agent skills configuration
- `CONTEXT.md` — domain glossary (use these terms in commit messages, test names, code)
- `docs/agents/issue-tracker.md` — `gh` command conventions
- `docs/agents/triage-labels.md` — label vocabulary
- `docs/agents/domain.md` — how to consume `CONTEXT.md` + ADRs
- `docs/adr/` — architectural decisions; read the ones relevant to your issue's area

## Open ready-for-agent issues

!`gh issue list --state open --label ready-for-agent --json number,title,body,labels --jq '[.[] | {number, title, labels: [.labels[].name], body}]'`

## Recent commits (last 10)

!`git log --oneline -10`

# Task

You are an autonomous coding agent. Each invocation of you handles **EXACTLY ONE GitHub issue** — no more, no less. After you finish that one issue, your turn ends. A fresh agent (with a clean context) will be invoked next time to handle the next issue. This Ralph-loop discipline is the whole point of the harness — do not chain issues within one session.

## Pick the next issue

From the `ready-for-agent` list above, pick the **lowest-numbered** issue that is **not blocked**. An issue is blocked if its body contains a `Blocked by #N` line where issue #N is still open.

**Two terminal cases — read carefully:**

- If, RIGHT NOW at the start of your session, every `ready-for-agent` issue is blocked or the list is empty: output `<promise>COMPLETE</promise>` and stop. This signals to the harness that the entire run is done.
- If you successfully complete one issue: stop without emitting `<promise>COMPLETE</promise>`. Just end your output. Do **not** look at the queue again, do **not** pick another issue, do **not** start exploring the next one. The harness will spawn a fresh agent for the next issue.

## Workflow

1. **Explore.** Read the chosen issue with `gh issue view <number> --comments`. Pull the parent PRD it references (typically #1). Read the source files and tests in the area you'll touch. Read any ADRs and `CONTEXT.md` glossary terms relevant to the issue.

2. **Plan.** Decide what to change. Keep it minimal — only what the acceptance criteria require. Don't expand scope.

3. **Build test-first** (Red → Green → Refactor):
   - Write a failing test for the next bit of behaviour
   - Run it; confirm it fails for the right reason
   - Write the minimum implementation to make it pass
   - Refactor if needed
   - Repeat until every acceptance-criterion checkbox is covered

4. **Verify.** Before committing, run the relevant scripts from `package.json`:
   - `npm run typecheck` — always
   - `npm test` — always
   - `npm run test:e2e` — **only if the issue is specifically about Playwright tests** (i.e. you added/modified files in `e2e/`). Skip otherwise.

   There is **no lint script** in this project — don't run `npm run lint`.

   Fix any failures. Don't commit broken code.

   ## Known sandbox limitations — do not waste cycles on these

   These environment constraints are inherent to the docker container and **cannot be fixed by an agent**. Recognise the symptoms and skip the workaround attempts:

   - **Playwright / E2E tests cannot run.** Chromium fails with `libnspr4.so: cannot open shared object file`. `apt-get` and `sudo` are unavailable, so the system library cannot be installed. **Do not** try `npx playwright install --with-deps`, `apt-get install`, swapping the executable, etc. — they all fail. Just don't run `test:e2e` unless the issue is specifically about modifying E2E test code (see below).
   - **`better-sqlite3` unit tests fail** with `invalid ELF header`. The native binary is built for the host's architecture and won't load on the sandbox's. The `aggregations.test.ts` failures from this are pre-existing and unrelated to your change. Run `npm test`; ignore better-sqlite3 errors as long as the *non-native* test files pass.

   ## When `test:e2e` is required

   Some issues genuinely require running Playwright (e.g. "fix a failing E2E test", "add coverage for X"). For those:

   - Try `npm run test:e2e` once. If it fails with the known `libnspr4.so` error: comment on the issue with the exact failure, swap label `ready-for-agent` → `ready-for-human`, and stop. Do not commit untested test code.
   - If it fails for a *different* reason (real test failure, your bug): fix it normally.

   For all other issues — UI tweaks, backend logic, layout changes, refactors, polish — **do not run `test:e2e` at all**. Trust typecheck + unit tests + your own reading of the diff. The host will run the full E2E suite later. If your change happens to break an E2E test, that's a regression captured later, not something to block the iteration on.

5. **Commit.** A single clean commit (squash WIP commits if any). The message must:
   - Be a clear one-line summary of what changed
   - Reference the issue with `Closes #<number>`
   - **Never** add `Co-Authored-By: Claude` or attribute to Claude in any way

6. **Close + remove label**:

   ```
   gh issue close <number> --comment "Implemented per acceptance criteria. See commit <sha>."
   gh issue edit <number> --remove-label ready-for-agent
   ```

## Rules

- Use **npm**, not pnpm or yarn.
- Install new packages at `@latest` — don't pin to older versions.
- **One issue per session — full stop.** After step 6 you end your output. The next iteration will see the now-closed issue and pick the next one with a clean context. If you keep going inside the same session, you defeat the entire purpose of the harness.
- Don't leave commented-out code or `TODO` comments in committed code.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen — trust internal code and framework guarantees.
- If blocked (missing context, env issue, failing tests you can't fix, external dependency you don't control): leave a comment on the issue explaining the blocker, **swap the label** from `ready-for-agent` to `ready-for-human` so the next iteration doesn't re-pick the same issue, and stop. Do **not** close the issue and do **not** emit `<promise>COMPLETE</promise>`.

# Done

- Queue empty / everything blocked at session start → emit `<promise>COMPLETE</promise>` and stop the run.
- Single issue completed and closed → stop your output. No `<promise>COMPLETE</promise>`.
- Hit a blocker on the chosen issue → leave a comment, stop your output. No `<promise>COMPLETE</promise>`.
