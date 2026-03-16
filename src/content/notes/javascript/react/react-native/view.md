---
title: "View"
date: "2024-12-28"
draft: false
---

A **View** is core component in React Native. The **View** component maps to the native view equivalent on the platform React Native is running on. A **View** component can be nested inside other views and can have zero to many children of any type. It is a flex container with a flex direction of column by default.

```tsx
import { View } from "react-native";

const Container = () => (
  <View style={{ height: 100, width: 100 }}>
    <View style={{ backgroundColor: "pink", flex: 1 }} />
    <View style={{ backgroundColor: "purple", flex: 1 }} />
  </View>
);

export default Container;
```

## Resources

[View · React Native](https://reactnative.dev/docs/view)
