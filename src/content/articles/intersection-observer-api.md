---
title: "Understanding the Intersection Observer API"
date: 2026-04-24
excerpt: The Intersection Observer API lets you detect when elements enter or leave the viewport - without scroll event listeners. Here's what it solves, how it works, and real patterns you can use today.
draft: false
tags: ["javascript", "web"]
---

## The Problem It Solves

Historically, detecting whether an element was visible in the viewport meant listening to `scroll` events and calling `getBoundingClientRect()` on every tick.

```js
window.addEventListener("scroll", () => {
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    // element is visible
  }
});
```

This has two serious problems:

**It runs on the main thread, constantly.** Scroll events fire dozens of times per second. Each handler call forces a layout reflow because `getBoundingClientRect()` has to calculate geometry. On pages with many elements to watch, this tanks performance.

**It's imperative and messy.** You manually manage thresholds, debouncing, teardown, and edge cases like initial load (before any scroll happens).

The Intersection Observer API solves both. It offloads visibility detection to the browser, fires a callback only when something changes, and requires no scroll listener at all.

## What Is an Intersection Observer?

An `IntersectionObserver` watches one or more elements and fires a callback whenever their intersection with a root element (the viewport by default) crosses a threshold you define.

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      console.log(`${entry.target.id} is visible`);
    }
  });
});

observer.observe(document.getElementById("my-element"));
```

The callback receives an array of `IntersectionObserverEntry` objects - one per observed element that triggered the change. The key properties:

| Property             | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `isIntersecting`     | `true` if the element is currently intersecting the root |
| `intersectionRatio`  | How much of the element is visible (0.0–1.0)             |
| `target`             | The DOM element being observed                           |
| `boundingClientRect` | The element's bounding box                               |
| `rootBounds`         | The root's bounding box (viewport by default)            |

## Options

The second argument to `IntersectionObserver` is an options object:

```js
const observer = new IntersectionObserver(callback, {
  root: null, // null = viewport, or a scrollable container element
  rootMargin: "0px", // shrink or expand the root's bounding box (like CSS margin)
  threshold: 0, // 0 = any pixel visible, 1.0 = fully visible, or array of values
});
```

**`rootMargin`** is the most powerful option. It lets you fire the callback before or after the element actually enters the viewport:

```js
// Fire when the element is within 200px of entering the viewport
{
  rootMargin: "200px 0px 0px 0px";
}

// Only count as "visible" when the top 30% of the viewport is past the element
{
  rootMargin: "0px 0px -30% 0px";
}
```

**`threshold`** can be an array to receive callbacks at multiple visibility points:

```js
// Fire at 0%, 25%, 50%, 75%, and 100% visibility
{
  threshold: [0, 0.25, 0.5, 0.75, 1.0];
}
```

## Common Use Cases

### Lazy Loading Images

Load images only when they're about to enter the viewport instead of at page load.

```js
const imageObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        imageObserver.unobserve(img); // stop watching once loaded
      }
    });
  },
  { rootMargin: "200px" },
); // start loading 200px before it's visible

document.querySelectorAll("img[data-src]").forEach((img) => {
  imageObserver.observe(img);
});
```

```html
<img data-src="/photo.jpg" alt="..." />
```

### Animate Elements on Scroll

Trigger a CSS animation when an element scrolls into view.

```js
const animationObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-fade-in");
        animationObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 },
);

document.querySelectorAll(".animate-on-scroll").forEach((el) => {
  animationObserver.observe(el);
});
```

### Active Section Highlighting (Table of Contents)

Track which section heading is currently in the viewport and update a navigation link to reflect it - no scroll listener needed.

```js
const headings = document.querySelectorAll("h2, h3");
const navLinks = document.querySelectorAll(".toc-link");

const tocObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.remove("active"));

        const activeLink = document.querySelector(
          `.toc-link[href="#${entry.target.id}"]`,
        );
        activeLink?.classList.add("active");
      }
    });
  },
  { rootMargin: "0px 0px -70% 0px" },
);

headings.forEach((heading) => tocObserver.observe(heading));
```

The `rootMargin: "0px 0px -70% 0px"` shrinks the bottom of the detection zone by 70%, so only headings in the top 30% of the viewport are considered "active." This makes the highlight feel like it tracks where you're actually reading rather than jumping ahead.

### Infinite Scroll

Load more content when a sentinel element at the bottom of a list enters the viewport.

```js
const sentinel = document.getElementById("load-more-sentinel");

const loadMoreObserver = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting) {
    const newItems = await fetchNextPage();
    appendItemsToList(newItems);
  }
});

loadMoreObserver.observe(sentinel);
```

## Cleanup

Always disconnect observers you no longer need, especially in single-page apps where components mount and unmount:

```js
// Stop observing a specific element
observer.unobserve(element);

// Stop observing all elements and free the observer
observer.disconnect();
```

In React:

```js
useEffect(() => {
  const observer = new IntersectionObserver(callback);
  observer.observe(ref.current);

  return () => observer.disconnect(); // cleanup on unmount
}, []);
```

## Browser Support

Intersection Observer is supported in all modern browsers. For environments that need legacy support, a [W3C polyfill](https://github.com/w3c/IntersectionObserver/tree/main/polyfill) is available.

## When Not to Use It

Intersection Observer tells you _whether_ and _how much_ an element intersects - not the exact scroll position. If you need precise scroll coordinates (e.g., parallax effects, scroll-driven animations), the CSS `animation-timeline: scroll()` property is a better fit.
