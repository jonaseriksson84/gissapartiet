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

You are an autonomous coding agent working through `ready-for-agent` GitHub issues one at a time.

## Pick the next issue

From the `ready-for-agent` list above, pick the **lowest-numbered** issue that is **not blocked**. An issue is blocked if its body contains a `Blocked by #N` line where issue #N is still open.

If every `ready-for-agent` issue is blocked or there are none, output `<promise>COMPLETE</promise>` and stop.

## Workflow

1. **Explore.** Read the chosen issue with `gh issue view <number> --comments`. Pull the parent PRD it references (typically #1). Read the source files and tests in the area you'll touch. Read any ADRs and `CONTEXT.md` glossary terms relevant to the issue.

2. **Plan.** Decide what to change. Keep it minimal — only what the acceptance criteria require. Don't expand scope.

3. **Build test-first** (Red → Green → Refactor):
   - Write a failing test for the next bit of behaviour
   - Run it; confirm it fails for the right reason
   - Write the minimum implementation to make it pass
   - Refactor if needed
   - Repeat until every acceptance-criterion checkbox is covered

4. **Verify.** Before committing, run any of these scripts that exist in `package.json`:
   - `npm run typecheck`
   - `npm test`
   - `npm run lint`

   Fix any failures. Don't commit broken code.

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
- Work on **one issue per iteration**.
- Don't leave commented-out code or `TODO` comments in committed code.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen — trust internal code and framework guarantees.
- If blocked (missing context, env issue, failing tests you can't fix, external dependency you don't control), leave a comment on the issue explaining the blocker and move on. **Do not** close the issue.

# Done

When there are no unblocked `ready-for-agent` issues, output:

<promise>COMPLETE</promise>
