---
title: "Matchers in Jest"
date: "2024-05-11"
excerpt: ""
draft: true
---

## What are Matchers?

Matchers let you test values in different ways. In this block of code, the matcher is `.toBe(3)`:

```typescript
test("Adds 1 + 2 to equal 3", () => {
  expect(sum(1, 2)).toBe(3);
});
```

## What do Matchers do?

Matchers are methods to let you validate different things about values. They are used to test the output of a function to determine in a function is working correctly.

## Types of Matchers

- toBe( ) - used to test the exact equality of a number, string or boolean.
- toEqual( ) - used when comparing the values of objects or arrays
- toBeFalsy( ) - used to test if a value is `false`, `0`, `-0`, `""`, `null`,`undefined`, or `NaN`.
- toBeTruthy( ) - used to match anything an `if` statement treats as `true`.
- toThrow( ) - used to test whether a function throws an error.
