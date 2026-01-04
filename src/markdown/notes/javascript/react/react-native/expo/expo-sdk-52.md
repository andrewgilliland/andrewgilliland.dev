---
title: "Expo SDK 52"
date: "2024-12-08"
draft: false
---

## The Rollout

- The New Architecture is now enabled by default for all new projects.
- Projects that are upgrading from a previous version of the SDK can opt in to the New Architecture
- Expo Go for SDK 52 and higher will only support the New Architecture.

## The Testing

- Ensure that you use the latest version of all third-party native libraries.
- Run **npx expo-doctor@latest** in your SDK 52 project to find any library incompatibilities that may cause issues when migrating.

## The Sweetness

- iOS deployment target bumped from 13.4 to iOS 15.1.
- Android **minSdkVersion** and **compileSdkVersion** bumped from 23 to 24 and 34 to 35 respectively.
- Stable release of the new **expo-video** library. Added a utility for generating video thumbnails. [expo-video Docs](https://docs.expo.dev/versions/v52.0.0/sdk/video/)
- Beta release of the new **expo-audio** library. [expo-audio Docs](https://docs.expo.dev/versions/v52.0.0/sdk/audio/)
- Beta release of **expo-file-system/next**. This enables synchronous read/write operations, using **SharedObjects** to represent files and directories. [expo-file-system Docs](https://docs.expo.dev/versions/v52.0.0/sdk/filesystem-next/)
- Many improvements to **expo-camera**. Switched to using Swift Concurrency, which improves the camera configuration setup reliability compared to using dispatch queues.
- New **expo-live-photo** library _(iOS only)_. [expo-live-photo Docs](https://docs.expo.dev/versions/v52.0.0/sdk/live-photo/)
- Improvements in affordances for edge-to-edge layouts on Android.
- **expo-image** v2 introduces the **useImage** hook for loading images, which allows you to preload the image into memory, providing size and metadata before the image is rendered.
- **expo-image-manipulator** offers a new object-oriented, contextual API.
- **expo-sqlite/kv-store** is a new API built on top of **expo-sqlite** that provides key/value storage. [expo-sqlite/kv-store Docs](https://docs.expo.dev/versions/v52.0.0/sdk/sqlite/#key-value-storage)
- **expo-sqlite** now supports SQLCipher.
- **expo-sqlite** now supports saving SQLite databases to shared containers on iOS.
- Expo DevTools Plugins now support binary payloads like **Uint8Array**.
- **expo-notifications** improvements.
- Support for iOS 18 tinted icons. [Configure a tinted icon in your app.config](https://docs.expo.dev/versions/v52.0.0/config/app/#icon-2)
- Fixed an issue an issue with env vars and embedded **expoConfig**:**expo-constants**.
- Calendar form sheets now launchable from **expo-calendar**.
- **expo/fetch** is a drop-in replacement, WinterCG-compliant Fetch API. [expo/fetch Docs](https://docs.expo.dev/versions/v52.0.0/sdk/expo/#expofetch-api)
- React Navigation v7 is now available.
- React Native DevTools replaces the JavaScript debugger.

## expo-splash-screen

- Migrated to SplashScreen API introduced in Android 12
- To add a simple fade transition to your splash screen: **SplashScreen.setOptions({ fade: true, duration: 1000 })**
- Dark mode splash screens are now officially supported through the config plugin.
- Intent to deprecate the **splash** field in favor of the config plugin.

### Limitations

- Properties from the config plugin do not apply to the splash-screen-like view when you app is launched using Expo Go or dev builds.
- Debug builds on Android 13+ ado behave correctly with **preventAutoHideAsync()**
- [expo-splash-screen Docs](https://docs.expo.dev/versions/v52.0.0/sdk/splash-screen/#usage)

## DOM Components

- To use DOM Components, add the **"use dom"** directive to the topp of the file.
- Makes it easy to integrate any web library into a native app.
- You can use any web library within DOM components.
- [Introducing Expo DOM Components - Evan Bacon](https://www.youtube.com/watch?v=JUOxTLu8ZsM&ab_channel=CallstackEngineers)
- [DOM Components guide](https://docs.expo.dev/guides/dom-components/)

## Expo CLI

- Experimental universal Tree Shaking support.
- Experimental support for React Compiler. Enabled with **"experiments": { "reactCompiler": true }** in app.config.
- Fast resolving by default across all platforms.
- New flag to pass app to launch iOS run command: **npx expo run:ios --binary /path/to/bin**

[Expo SDK 52 | Expo Changelog](https://expo.dev/changelog/2024/11-12-sdk-52)
