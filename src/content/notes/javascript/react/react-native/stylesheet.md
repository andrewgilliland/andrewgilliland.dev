---
title: "StyleSheet"
date: "2024-12-28"
draft: false
---

The React Native **StyleSheet** API is an abstraction similar to CSS. Using **StyleSheet** can take styles away from the render function and make code easier to understand. Using **StyleSheet.create()** can offter static type checking and suggestions to help write valid styles in most IDEs.

```tsx
import { StyleSheet, Text } from "react-native";

const PrimaryHeading = () => <Text style={styles.text}>Cowabunga</Text>;

const styles = StyleSheet.create({
  text: {
    marginTop: 16,
    paddingVertical: 8,
    borderWidth: 4,
    borderColor: "#20232a",
    borderRadius: 6,
    backgroundColor: "#61dafb",
    color: "#20232a",
    textAlign: "center",
    fontSize: 30,
    fontWeight: "bold",
  },
});

export default PrimaryHeading;
```

## Methods

- compose()
- create()
- flatten()

## Properties

- absoluteFill
- absoluteFillObject
- hairlineWidth

## Resources

[StyleSheet · React Native](https://reactnative.dev/docs/stylesheet)
