---
title: "Shared Objects in Expo Modules"
date: "2024-12-10"
draft: false
---

## What are Shard Objects?

- Shared Objects are a way to join together a native object and a JavaScript object.
- This allows you to use the JavaScript object as the "pointer" to the native object, and vice-versa.
- This means that the JavaScript obejct has some native state.
- The lifecycle of both objects are connected, the native object lives as long as the JavaScript Object.

## Why use Shared Objects?

- In Expo SDK 51, performance is not the best when trying to load a local asset, rotate it, and show it again.
- The API for manipulating images is over verbose.
- Shared Objects can fix the performance issue and create a better developer experience.

## What are Shared Refs?

- Links a native type instance without custom functions or state coming from an Expo package.
- You can pass the ref into a function exported from a totally different package that expects the same ref type.

## Where are Shared Objects and Shared Refs being used?

- **expo-image**
- **expo-video**
- **expo-audio**
- **expo-file-system/next**

## Resources

[The real-world impact of Shared Objects in Expo Modules](https://expo.dev/blog/the-real-world-impact-of-shared-objects)
