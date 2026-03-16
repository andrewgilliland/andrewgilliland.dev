---
title: "Metro"
date: "2024-05-23"
---

## Metro - a JavaScript Bundler

Metro has three separate stages in its bundling process:

1. Resolution
2. Transformation
3. Serialization

### Resolution

Metro needs to build a graph of all the modules that are required from the entry point. To find which file is required from another file Metro uses a resolver. In reality, this stage happens in parallel with the transformation stage.

### Transformation

All modules go through a transformer. A transformer is responsible for converting (transpiling) a module to a format that is understandable by the target platform (eg. React Native). Transformation of modules happens in parallel based on the amount of cores that you have.

### Serialization

As soon as all the modules have been transfromed they will be serialized. A serializer combines the modules to generate one or multiple bundles. A bundle is literally a bundle of modules combined into a single JavaScript file.

## Resources

[Metro](https://metrobundler.dev/)
