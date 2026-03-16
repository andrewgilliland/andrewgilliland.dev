---
title: "Text"
date: "2025-1-1"
draft: false
---

The React Native component for displaying text. The **Text** component supports nesting, styling, and touch handling.

```tsx
import { Text } from "react-native";

const BoldAndRedText = () => {
  return (
    <Text style={styles.baseText}>
      I am bold
      <Text style={styles.innerText}> and red</Text>
    </Text>
  );
};

export default BoldAndRedText;
```

## Resources

[Text • React Native](https://reactnative.dev/docs/text)
