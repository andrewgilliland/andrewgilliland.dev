---
title: "Superglobals"
date: "2025-3-19"
draft: false
---

Superglobals in PHP are buit-in gobals arrays that provide acces to various types of data, such as user input, server information, session data, and more. These variables are always accessible, regardless of scope, meaning they can be used inside functions, classes, and scripts without needing to be declared as global.

Some of the main PHP superglobals:

- **$GLOBALS** - An associative array containing all global variables in the script.
- **$\_GET** - Contains form data sent via the HTTP POST method.
- **$\_POST** - Contains form data sent via the HTTP POST method.
- **$\_COOKIE** - Stores cookie data sent from the client to the server.
- **$\_REQUEST** - A combination of $\_GET, $\_POST, $\_COOKIE data.
