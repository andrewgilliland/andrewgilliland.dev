---
title: Building a Real-World Agent Harness with Pi
date: 2026-06-07
excerpt: Pi is a minimal, extensible coding agent. This article walks through building a permission gate extension that intercepts dangerous bash commands before they run.
draft: false
tags: ["ai", "typescript", "developer-tools", "pi"]
---

Pi is a terminal coding agent by Earendil Inc. - think Claude Code or Codex, but open-source, minimal at the core, and designed to be extended. You run it in a project directory and it can read files, write code, execute bash commands, and run server functions on your behalf.

That last part is where things get interesting. Bash access is powerful, but it also means the agent can run `rm -rf`, force-push over your history, or drop a production database. Pi's extension system gives you a clean way to intercept those calls before they execute.

This article walks through building a **permission gate** - a Pi extension that watches for dangerous bash commands and asks for confirmation before allowing them to run. It's a practical introduction to Pi's extension system: event hooks, tool interception, and user interaction, all in one small TypeScript file.

## Installing Pi

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

The `--ignore-scripts` flag disables dependency lifecycle scripts during install. Pi doesn't need them.

You can also use the installer:

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

Once installed, run `pi` in a project directory. On first run you'll be asked to set an API key - `ANTHROPIC_API_KEY` works, or use `/login` for subscription providers.

## How Pi Extensions Work

Extensions are TypeScript modules that export a default factory function. Pi loads them at startup and passes an `ExtensionAPI` object you use to subscribe to events and register tools, commands, and shortcuts.

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("Extension loaded", "info");
  });
}
```

Extensions are auto-discovered from two locations:

| Location                      | Scope                 |
| ----------------------------- | --------------------- |
| `~/.pi/agent/extensions/*.ts` | Global (all projects) |
| `.pi/extensions/*.ts`         | Project-local         |

Put a global extension in `~/.pi/agent/extensions/` and it loads every time you run `pi`. Put it in `.pi/extensions/` and it only loads for that project (after you trust it).

You can also test an extension without moving it:

```bash
pi -e ./my-extension.ts
```

TypeScript works without compilation. Pi loads extensions through [jiti](https://github.com/unjs/jiti), so there's no build step.

## What We're Building

The permission gate intercepts `tool_call` events before they execute. When Pi's LLM decides to run a bash command, the event fires with the full command string. Our extension checks that string against a list of patterns - `rm -rf`, force push, writing to `/dev/null`, etc. - and if it matches, pauses execution and pops a confirmation dialog.

The user sees the exact command and can approve or block it. If blocked, the agent receives an error message and decides what to do next.

## Writing the Extension

Create the file:

```bash
mkdir -p ~/.pi/agent/extensions
touch ~/.pi/agent/extensions/permission-gate.ts
```

Here's the full extension:

```typescript
// ~/.pi/agent/extensions/permission-gate.ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";

// Commands that require confirmation before running
const DANGEROUS_PATTERNS = [
  "rm -rf",
  "rm -r ",
  "sudo rm",
  "git push --force",
  "git push -f",
  "git reset --hard",
  "> /dev/",
  "DROP TABLE",
  "DROP DATABASE",
  "chmod 777",
  "chmod -R 777",
  ":(){:|:&};:", // fork bomb
];

// Paths that should never be written to
const PROTECTED_PATHS = [
  ".env",
  ".env.local",
  ".env.production",
  "node_modules/",
];

export default function (pi: ExtensionAPI) {
  // Intercept bash tool calls
  pi.on("tool_call", async (event, ctx) => {
    if (!isToolCallEventType("bash", event)) return;

    const command = event.input.command ?? "";

    const match = DANGEROUS_PATTERNS.find((pattern) =>
      command.includes(pattern),
    );

    if (match) {
      const ok = await ctx.ui.confirm(
        "Dangerous command detected",
        `The agent wants to run:\n\n${command}\n\nPattern matched: ${match}\n\nAllow?`,
      );

      if (!ok) {
        return { block: true, reason: `Blocked: matched pattern "${match}"` };
      }
    }
  });

  // Intercept write tool calls for protected files
  pi.on("tool_call", async (event, ctx) => {
    if (!isToolCallEventType("write", event)) return;

    const path = event.input.path ?? "";

    const isProtected = PROTECTED_PATHS.some(
      (p) => path === p || path.endsWith(`/${p}`) || path.includes(`/${p}/`),
    );

    if (isProtected) {
      const ok = await ctx.ui.confirm(
        "Protected file",
        `The agent wants to write to:\n\n${path}\n\nAllow?`,
      );

      if (!ok) {
        return { block: true, reason: `Blocked: ${path} is a protected file` };
      }
    }
  });

  // Let the user know the gate is active
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("Permission gate active", "info");
  });
}
```

## What's Happening Here

**`isToolCallEventType`** is a type guard that narrows `event.input` to the correct shape for the named tool. When you pass `"bash"`, `event.input` becomes `{ command: string; timeout?: number }`. Without it, `event.input` is `unknown` and you'd need to cast manually.

**Returning `{ block: true, reason: "..." }`** from a `tool_call` handler cancels the tool execution. Pi surfaces the reason to the LLM as a tool error, so the agent can decide how to respond - retry with a safer command, ask you what to do, or give up on that approach.

**`ctx.ui.confirm`** renders a yes/no dialog in the terminal and suspends execution until you respond. It returns `true` (confirmed) or `false` (cancelled). The agent pauses until you make a choice.

Two separate `tool_call` handlers are registered here - one for bash, one for write. You could combine them into one handler that checks the tool name, but keeping them separate makes each concern easier to read and modify.

## Testing It

Start Pi with the extension:

```bash
pi -e ./permission-gate.ts
```

Or if you've put it in `~/.pi/agent/extensions/`, just run `pi` and you'll see the "Permission gate active" notification on startup.

Try asking Pi to do something destructive:

```
> delete all the log files in this directory recursively
```

Pi will likely reach for `rm -rf *.log` or similar. When it does, the dialog fires:

```
Dangerous command detected
The agent wants to run:

  rm -rf ./logs

Pattern matched: rm -rf

Allow? [y/N]
```

Press `n` and the agent receives a blocked error. It'll usually respond by suggesting a safer alternative - something like `find . -name "*.log" -delete` - which you can approve or run yourself.

## Extending the Gate

A few directions worth exploring from here:

**Add a timeout to the dialog.** If you step away from the terminal, you probably want the default to be "deny":

```typescript
const ok = await ctx.ui.confirm(
  "Dangerous command detected",
  `Allow: ${command}`,
  { timeout: 30_000 }, // auto-deny after 30s
);
```

**Log blocked commands.** Append a custom entry to the session so blocked commands are visible in session history:

```typescript
if (!ok) {
  pi.appendEntry("permission-gate", { blocked: command, pattern: match });
  return { block: true, reason: `Blocked: matched "${match}"` };
}
```

**Make the pattern list configurable.** Read patterns from a `.pi/gate-config.json` at startup instead of hardcoding them:

```typescript
import { readFileSync } from "node:fs";

export default function (pi: ExtensionAPI) {
  let patterns = DANGEROUS_PATTERNS;

  pi.on("session_start", async (event, ctx) => {
    try {
      const config = JSON.parse(
        readFileSync(`${ctx.cwd}/.pi/gate-config.json`, "utf8"),
      );
      if (Array.isArray(config.patterns)) {
        patterns = config.patterns;
      }
    } catch {
      // No config file, use defaults
    }
  });

  pi.on("tool_call", async (event, ctx) => {
    // use `patterns` instead of DANGEROUS_PATTERNS
  });
}
```

## Where to Go Next

The permission gate is a single-event extension. The Pi extension system goes much further:

- **Custom tools** - register tools the LLM can call with `pi.registerTool()`. The classic example is a stateful todo list, but it's the same primitive for anything from database queries to remote API calls.
- **Skills** - reusable capability packages with a `SKILL.md` file. Pi loads the description into context and the agent reads the full instructions on demand. The [Agent Skills standard](https://agentskills.io/specification) defines the format, and Pi is compatible with skills written for other harnesses.
- **Session control** - commands registered with `pi.registerCommand()` get access to `ctx.newSession()`, `ctx.fork()`, and `ctx.navigateTree()`. That's the building block for plan-mode workflows and multi-session handoffs.

The [examples directory](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions) in the Pi repo has working implementations of all of these - `git-checkpoint.ts`, `todo.ts`, `plan-mode/`, and more. It's the fastest way to see what's possible.
