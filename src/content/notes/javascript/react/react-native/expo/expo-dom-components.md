---
title: "Expo Dom Components"
date: "2024-12-11"
draft: false
---

## Usage

Install **react-native-webview**

```
npx expo install react-native-webview
```

To render a React compenent to the DOM, add the 'use dom' directive at the top of a web component file

```tsx
"use dom";

export default function DOMComponent({ name }: { name: string }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
    </div>
  );
}
```

### Incrementally Migrate React websites to React Native

## Tips

- Safari debug tools for iOS simulator. Found under the **Develop** tab in Safari.
- Shift + M in Expo CLI for **Dev tools**
- **expo-atlas** - useful for checking bundle size and what JavaScript gets compiled to.
- Zero config. Most other configs still just work.

## Lightning Round

Things being done with Expo Dom Components:

- Mdx compatible
- Flow charts with **@xyflow/react**
- Custom emoji picker with **emoji-mart/react**
- Image cropping with **react-mobile-cropper**
- WebGL and 3D with **THREE.js**
- Editing complex text with **@tiptap/react**

## Expo Tree Shaking

Perform a recursive search on all unused dependencies and remove them from the final compiled bundle.

- Unused imports and exports
- Barrel file optimizations
- Module re-exports
- Package.json side-effects
- Platform-specific minification
- Unused server code
- Empty modules
- Side-effecty imports

## Resources

[Using React DOM in Expo native apps](https://docs.expo.dev/guides/dom-components/)
[Web Once, Native Everywhere: Introducing Expo DOM Components — Evan Bacon | RUC 2024](https://www.youtube.com/watch?v=JUOxTLu8ZsM&ab_channel=CallstackEngineers)
