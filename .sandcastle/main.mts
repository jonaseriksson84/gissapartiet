import { run, claudeCode } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import { execSync } from "node:child_process";

// Simple loop: an agent that picks open GitHub issues one by one and closes them.
// Run this with: npx tsx .sandcastle/main.mts
// Or add to package.json scripts: "sandcastle": "npx tsx .sandcastle/main.mts"

// Preflight: refuse to start if the host worktree has uncommitted changes.
// `branchStrategy: merge-to-head` reaches into the host worktree to do the
// run-end merge; a dirty tree blocks the merge with "Your local changes
// would be overwritten by merge". A typo'd `npm install 6& npm run dev`
// once cost us three iterations' worth of stranded work — never again.
const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim();
if (dirty) {
  console.error("Refusing to start: host worktree has uncommitted changes.");
  console.error(dirty);
  console.error("\nCommit or stash first. Sandcastle's merge-to-head needs a clean HEAD.");
  process.exit(1);
}

await run({
  // A name for this run, shown as a prefix in log output.
  name: "worker",

  // Sandbox provider — Docker is the default runtime.
  sandbox: docker(),

  // The agent provider. Pass a model string to claudeCode() — sonnet balances
  // capability and speed for most tasks. Switch to claude-opus-4-6 for harder
  // problems, or claude-haiku-4-5-20251001 for speed.
  agent: claudeCode("claude-sonnet-4-6"),

  // Path to the prompt file. Shell expressions inside are evaluated inside the
  // sandbox at the start of each iteration, so the agent always sees fresh data.
  promptFile: "./.sandcastle/prompt.md",

  // Maximum number of iterations (agent invocations) to run in a session.
  // Each iteration works on a single issue. The loop also exits early when the
  // agent emits <promise>COMPLETE</promise> (no unblocked ready-for-agent issues
  // left), so this is just a safety cap. Set it higher than the queue depth.
  maxIterations: 20,

  // Branch strategy — merge-to-head creates a temporary branch for the agent
  // to work on, then merges the result back to HEAD when the run completes.
  // This is required when using copyToWorktree, since head mode bind-mounts
  // the host directory directly (no worktree to copy into).
  branchStrategy: { type: "merge-to-head" },

  // Copy node_modules from the host into the worktree before the sandbox
  // starts. This avoids a full npm install from scratch on every iteration.
  // The onSandboxReady hook still runs npm install as a safety net to handle
  // platform-specific binaries and any packages added since the last copy.
  copyToWorktree: ["node_modules"],

  // Lifecycle hooks — commands grouped by where they run (host or sandbox).
  hooks: {
    sandbox: {
      // onSandboxReady runs once after the sandbox is initialised and the repo is
      // synced in, before the agent starts. Use it to install dependencies or run
      // any other setup steps your project needs.
      onSandboxReady: [{ command: "npm install" }],
    },
  },
});
