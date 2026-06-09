---
title: What Is an Agent Harness?
date: 2026-06-08
excerpt: The model is just token prediction. An agent harness is everything else — the loop, the tools, the memory, and the safety controls that make a model actually useful.
draft: false
tags: ["ai", "developer-tools"]
---

When people talk about AI coding agents, they often conflate two different things: the **model** and the **harness**. Understanding the difference changes how you think about evaluating, building, and extending AI tools.

## The Model Is Not the Agent

A language model — Claude, GPT-4o, Gemini — is a prediction engine. You give it a sequence of tokens, it predicts what comes next. That's it. It doesn't browse files, run commands, or remember what you said last week. It just predicts.

An agent is what you get when you wrap behavior around that prediction. The harness is that behavior.

## What a Harness Does

A harness is the scaffolding that turns a model into something that can actually complete a task. It typically handles five things:

### 1. Tool Execution

The model outputs structured requests — "call `bash` with this command", "call `read` with this path". The harness intercepts those requests and actually executes them, then feeds the results back into the next model call.

Without the harness, a tool call is just text. With it, that text becomes a real file read, a real command run, a real API call.

### 2. The Agent Loop

A single model call is rarely enough to finish a task. The harness runs the loop: send prompt → get response → execute tools → send results → repeat until done.

This loop is where most of the interesting design decisions live. How many turns before giving up? What happens when a tool errors? Can the user interrupt mid-loop? Different harnesses answer these differently.

### 3. Context Management

Models have context windows. The harness decides what goes in: which files, which conversation history, which system prompt, which tool definitions. As sessions grow, it manages compaction — summarizing old turns to keep the context window from filling up.

Context management is invisible when it works and catastrophic when it doesn't. A harness that blindly stuffs everything into context will eventually overflow and produce incoherent results.

### 4. Safety Controls

The model doesn't know that `rm -rf /` is dangerous — or rather, it knows in the abstract but has no enforcement mechanism. The harness is where you add guardrails: block certain commands, require confirmation before destructive actions, restrict which paths can be read or written.

Whether those controls are built-in or user-extensible varies a lot by harness.

### 5. Session State

Agents need memory. The harness persists conversation history, tracks which tools were called and what they returned, and sometimes maintains longer-term state across sessions. It also handles branching — letting you fork from a previous point in a conversation and explore a different direction.

## What a Harness Is Not

A harness is **not** a chat interface. ChatGPT is a chat interface with some agentic features bolted on. A harness is designed around the agent loop as a first-class primitive — the chat is just how you kick it off.

A harness is also **not** the model. Swapping Claude for GPT-4o in the same harness gives you a different experience, but the loop, tools, and safety controls stay the same. The harness is the stable layer; the model is a pluggable component.

## The Harness Spectrum

Different tools sit at different points on the openness spectrum:

| Tool                   | Model        | Extensible?          |
| ---------------------- | ------------ | -------------------- |
| Claude Code            | Claude       | Limited              |
| Cursor                 | Configurable | Limited              |
| OpenAI Assistants API  | GPT          | Fully (you build it) |
| Pi                     | Configurable | Fully (extensions)   |
| LangChain / LlamaIndex | Configurable | Fully (framework)    |

A closed harness is easier to get started with. An open one lets you shape the behavior — add custom tools, intercept events, inject context, write your own safety logic.

## Why This Matters Practically

When you evaluate an AI coding tool, you're rarely evaluating the model. You're evaluating the harness. Questions worth asking:

- **What tools does it expose?** Read, write, bash, web search — and can you add your own?
- **Can you intercept the loop?** Can you block a tool call, modify a result, or inject context before the LLM sees it?
- **How does it handle context?** What's the compaction strategy? Can you control what goes in?
- **What safety controls exist?** Are they built-in only, or can you write your own?
- **Is the session format open?** Can you read, write, or branch sessions programmatically?

The model will get better over time regardless. The harness is the part you can actually influence today.
