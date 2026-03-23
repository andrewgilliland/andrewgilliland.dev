---
title: uv Is the npm of Python
date: 2026-03-22
excerpt: If you're a JavaScript developer curious about Python, uv makes the tooling feel familiar. Here's how it maps to what you already know.
draft: false
---

## Why I Switched to uv

I spent most of my time in the JavaScript ecosystem before picking up Python. When I did, the tooling felt... scattered. You need `pip` to install packages, `venv` to create virtual environments, and there's no lockfile by default. Coming from `npm` where everything just works out of one tool, it was a rough adjustment.

Then I found [uv](https://github.com/astral-sh/uv). It's a Python package manager written in Rust, and it's fast. Like, _really_ fast. But speed isn't the main reason I switched. uv just makes Python feel as ergonomic as Node.

## The Mental Model

If you know npm, you already know the concepts behind uv. Here's a quick mapping:

| npm                   | uv                       |
| --------------------- | ------------------------ |
| `npm init`            | `uv init`                |
| `npm install express` | `uv add requests`        |
| `npm remove express`  | `uv remove requests`     |
| `package.json`        | `pyproject.toml`         |
| `package-lock.json`   | `uv.lock`                |
| `node_modules/`       | `.venv/`                 |
| `npx`                 | `uv run`                 |
| `nvm install 20`      | `uv python install 3.12` |

Once I saw it this way, everything clicked.

## Getting Started

Install uv:

```bash
brew install uv
```

Or if you're not on macOS:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Create a new project:

```bash
uv init my-project
cd my-project
```

This gives you a `pyproject.toml` (your `package.json` equivalent) and sets up a virtual environment automatically.

## Adding Dependencies

```bash
uv add requests
```

That's it. uv creates the `.venv`, installs the package, and updates both `pyproject.toml` and `uv.lock`. No activating environments. No `pip freeze > requirements.txt`. Just `uv add`.

## Running Scripts

Instead of activating a virtual environment every time, just use `uv run`:

```bash
uv run python main.py
```

Think of it like `npx`, it runs the command inside the project's environment without you having to manage it manually.

## Virtual Environments

In Node, dependencies are scoped to the project via `node_modules`. Python uses virtual environments for the same thing, but traditionally you had to create and activate them yourself.

uv handles this automatically. When you run `uv init` or `uv add`, it creates a `.venv` in your project directory. When you use `uv run`, it uses that environment. You don't have to think about it.

## Installing Python Itself

uv can even manage Python versions:

```bash
uv python install 3.12
```

This is like `nvm install 20` in the Node world. No more Googling "how to install Python 3.12 on macOS."

## Defining Scripts

In `package.json` you're used to defining scripts like `"dev": "next dev"`. In Python, `[project.scripts]` in `pyproject.toml` lets you define CLI entry points:

```toml
[project.scripts]
dev = "my_app.main:run"
```

This maps the command `dev` to the `run` function in `my_app/main.py`. After running `uv sync`, you can call it with:

```bash
uv run dev
```

Unlike npm scripts, these aren't arbitrary shell commands, they point to Python functions. But in practice, `uv run` covers the gap. You can run any command inside the project's environment directly:

```bash
uv run pytest
uv run ruff check .
uv run python main.py
```

No script definitions needed. Just `uv run` + the command.

## The Takeaway

uv made Python tooling feel familiar to me as a JavaScript developer. One tool for project setup, dependency management, virtual environments, and running scripts. If you're coming from the JS ecosystem and Python's tooling has felt like a maze, give uv a shot.

Check out the [uv docs](https://docs.astral.sh/uv/) to get started.
