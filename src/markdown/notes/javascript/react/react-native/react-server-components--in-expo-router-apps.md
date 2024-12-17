---
title: "React Server Components in Expo Router"
date: "2024-12-16"
draft: false
---

## Server Components

- Server Components run in the server.
- They can access server APIs and Node.js built-ins
- They can you async components.

```tsx
import `server-only`;

import {Image, Text, View } from 'react-native';

export async function Person() {
    const res = fetch("https://swapi.py4e.com/api/people/1");
    const json = await res.json()

    return (
        <View style={{padding: 8, borderWidth: 1}}>
            <Text style={{ fontWeight: 'bold', fontSize: 24 }}>{json.name}</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 24 }}>{json.homeworld}</Text>
        </View>
    )
}
```
