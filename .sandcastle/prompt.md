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

4. **Verify.** Before committing, run every test/check script that exists in `package.json` and is relevant to the issue:
   - `npm run typecheck`
   - `npm test`
   - `npm run test:e2e` if the issue touches the user-facing flow or the e2e suite
   - `npm run lint`

   Fix any failures. Don't commit broken code.

   **If a verification suite cannot run in your sandbox** (e.g. Playwright needs browser libraries you can't install, a native binary won't load on this CPU arch, an external service is unreachable), this is **not** a green light to ship. You must:

   - Comment on the issue with the *exact* command that failed and the *exact* error message
   - Swap the label `ready-for-agent` → `ready-for-human`
   - Stop the iteration without closing the issue and without committing test code that hasn't been executed

   Do **not** ship code claiming "verified by curl / unit tests / inspection" when the suite the issue actually requires (e.g. Playwright for an E2E ticket) has never been run. That is a regression-shipping mistake the harness considers a hard failure.

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
