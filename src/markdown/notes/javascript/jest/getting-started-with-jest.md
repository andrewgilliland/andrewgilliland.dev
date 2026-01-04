---
title: "Getting Started with Jest"
date: "2024-05-10"
---

Install the jest package as dev dependency:

`npm install --save-dev jest`

In the `package.json`, under the `scripts` key, change the value for the `test` key to `jest`:

```typescript
"scripts": {
    "test": "jest"
  },
```

To make a test file, use the naming convention `index.test.js` if you were writing tests for `index.js`.

In the `index.test.js` file, writing tests will use the convention:

```typescript
test("test description", testFunction);
```

Here's an example of a test for a function `sum`:

```typescript
test("Adds 1 + 2 to equal 3", () => {
  expect(sum(1, 2)).toBe(3);
});
```

## Resources

[Jest Docs](https://jestjs.io/docs/getting-started)
