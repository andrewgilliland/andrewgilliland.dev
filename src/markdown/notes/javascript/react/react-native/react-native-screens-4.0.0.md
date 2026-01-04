---
title: "React Native Screens 4.0.0"
date: "2024-12-15"
draft: false
---

## The Sweetness

The highlights of react-native-screens 4.0.0.

### Sheets API

- Support for **formSheet** presentation on Android and custom detents on iOS.
- On Android, up to three detents can be specified and control sheets corner radius, dimming view, initial detent, elevation, and more.
- On iOS, support for unlimited number of detents, and other config options like **sheetExpandsWhenScrolledToEdge** or **sheetLargestUndimmedDetentIndex**.

### Preload support for native-stack screens

- Preload support for native-stack v7, utilized in react-navigation.
- Preload allows you to load screens in advance.

### Improved iOS animations

- Align _simple_push_ iOS animations to match closer to native defaults.
- The completion animation after a gesture cancels on interactive swipes.

### Dropped support for:

- native-stack v5
- react-navigation v7

## Resources

[Introducing React Native Screens 4.0.0](https://blog.swmansion.com/introducing-react-native-screens-4-0-0-1b833ff98a55)

[react-native-screens GitHub repo](https://github.com/software-mansion/react-native-screens)
