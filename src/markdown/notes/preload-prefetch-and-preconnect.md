---
title: "Preload, Prefetch and Preconnect"
date: "2024-12-10"
draft: false
---

## Preload

Preload allows you to prioritize fetching resources that are critical for the initial rendering of the page, improving performance by reducing the time to first render.

### Example

```html
<head>
  <meta charset="utf-8" />
  <title>JS and CSS preload example</title>

  <link rel="preload" href="style.css" as="style" />
  <link rel="preload" href="main.js" as="script" />

  <link rel="stylesheet" href="style.css" />
</head>

<body>
  <h1>big balls</h1>
  <canvas></canvas>

  <script src="main.js" defer></script>
</body>
```

### Use cases:

- Resources that are pointed from inside CSS, like fonts or images.
- Resources that JavaScript can request

## Prefetch

Prefetch allows the browser to fetch resources that might be needed for future navigation or functionality.
This helps in speeding up subsequent page loads by prefetching resources that are likely to be used soon.

### Examples

```html
<!-- This is functionally equivalent to a fetch(). -->
<link rel="prefetch" />

<!-- Basic prefetch -->
<link rel="prefetch" href="main.js" />

<!-- Navigation and subresource prefetches -->
<link rel="prefetch" href="/app/style.css" />
<link rel="prefetch" href="/app/style.css" />

<!-- Effects of cache partioning -->
<!-- This does not work!!! Resources intended for use by different top-level domains -->
<link rel="prefetch" href="https://news.example/article" />
```

## Preconnect

The preconnect value for the rel attribute on the link element tells the browser to initiate early connections to a specified origin. This is useful for reducing latency when fetching resources from third-party domains, such as APIs, CDNs, or other external services.

### Example

```html
<!-- Basic preconnect -->
<link rel="preconnect" href="https://example.com" />

<!-- If a page needs to make connections to many third-party domains, preconnecting them all can be counterproductive. -->

<!-- Best used for only the most critical connections -->
<link rel="preconnect" />

<!-- Use this to save time on the first step, the DNS lookup -->
<link rel="dns-prefetch" />
```

## Resources

[rel=preload | MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload)

[rel=prefetch | MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch)

[rel=preconnect | MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preconnect)

[Fast Websites: The New Speculation Rules API | Syntax #855](https://syntax.fm/show/855/fast-websites-the-new-speculation-rules-api)
