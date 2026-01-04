---
title: "TextInput"
date: "2025-1-2"
draft: false
---

The React Native **TextInput** component allows inputting text via the keyboard. The **TextInput** is able to be configured with auto-correction, auto-capitalization, placeholder text, and different keyboard types via props. The **onChangeText** event subscribes to changes made by the user input.

```tsx
import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";

const CustomTextInput = () => {
  const [text, setText] = useState("");

  return (
    <TextInput
      style={styles.textInput}
      onChangeText={setText}
      value={text}
      keyboardType="default"
    />
  );
};

const styles = StyleSheet.create({
  textInput: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
```

## Resources

[TextInput • React Native](https://reactnative.dev/docs/textinput)
