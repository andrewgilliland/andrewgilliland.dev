---
title: TypeScript Tips I Use Every Day
date: 2025-06-20
excerpt: A handful of TypeScript patterns that have made my code more expressive, safer, and easier to refactor.
draft: false
tags: ["typescript"]
---

## Prefer `type` for Object Shapes

Use `type` for most things - it's more flexible and composes better with unions and intersections.

```ts
type User = {
  id: string;
  name: string;
};
```

Reserve `interface` for when you need declaration merging (e.g. extending third-party types).

## Use `satisfies` Instead of Type Assertions

Instead of casting with `as`, use `satisfies` to validate a value against a type while preserving the inferred type.

```ts
const config = {
  theme: "dark",
  lang: "en",
} satisfies Record<string, string>;
```

## Discriminated Unions

Discriminated unions make state management much cleaner than optional properties:

```ts
type Result<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
```

Now TypeScript narrows the type automatically inside a switch or if statement.

## `as const` for Literal Types

```ts
const DIRECTIONS = ["north", "south", "east", "west"] as const;
type Direction = (typeof DIRECTIONS)[number];
// "north" | "south" | "east" | "west"
```

## Avoid `any`, Embrace `unknown`

When you don't know the type upfront, use `unknown` instead of `any`. It forces you to narrow before using the value, catching bugs at compile time rather than runtime.

These small habits add up to a much more reliable codebase over time.
