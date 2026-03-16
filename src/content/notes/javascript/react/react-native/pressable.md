---
title: "Pressable"
date: "2025-1-3"
draft: false
---

The React Native **Pressable** component is a wrapper that can detect stages of press interactions on any of its defined children.

```tsx
import { Pressable, StyleSheet } from "react-native";

const SweetButton = () => {
  return (
    <Pressable
      onPress={() => {
        console.log("You pressed me!!!");
      }}
      style={({ pressed }) => (pressed ? styles.pressOn : styles.pressOff)}
    >
      {({ pressed }) => (
        <Text style={styles.text}>{pressed ? "Pressed!" : "Press Me"}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressOff: {
    background: "blue",
  },
  pressOn: {
    backgroundColor: "red",
  },
  text: {
    fontSize: 20,
  },
});

export default SweetButton;
```

## Resources

[Pressable • React Native](https://reactnative.dev/docs/pressable)
