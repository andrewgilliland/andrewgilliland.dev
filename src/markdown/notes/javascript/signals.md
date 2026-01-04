---
title: "Signals"
date: "2024-11-22"
draft: false
---

## What are Signals in JavaScript?

Signals are a concept used in reactive programming to represent a value that can change over time. They are often used as a way to manage state in a way that automatically updates the UI or other dependent parts of the application when the states changes. Signals can be thought of as observable values that can be subscribed to, allowing for a more declarative approach to handling state changes.

## Example of Using Signals in JavaScript

Here is an example of how signals can be implement in JavaScript framework [SolidJS](https://docs.solidjs.com/concepts/signals):

```typescript
const [isOpen, setIsOpen] = createSignal(false);
//      ^ getter  ^ setter

// Accessing a value
console.log(isOpen()); // false

// Updating a value
setIsOpen((prev) => !prev);

console.log(isOpen()); // true
```

## Resources

[Learn JavaScript Reactivity: How to Build Signals from Scratch](https://www.freecodecamp.org/news/learn-javascript-reactivity-build-signals-from-scratch/)
