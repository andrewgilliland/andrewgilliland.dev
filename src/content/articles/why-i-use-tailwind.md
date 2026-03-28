---
title: Why I Use Tailwind CSS
date: 2025-03-04
excerpt: Tailwind CSS changed how I think about styling. Here's why utility-first CSS has become my default approach.
draft: false
---

## The Case for Utility-First CSS

Before Tailwind, I wrote a lot of custom CSS. I spent time naming things, worrying about specificity, and maintaining stylesheets that grew harder to manage over time.

Tailwind flips this model. Instead of writing CSS, you compose styles directly in your markup using utility classes.

## What I Like About It

**No naming things.** One of the hardest parts of CSS is naming classes. With Tailwind you skip that entirely.

**Colocation.** Styles live right next to the markup they affect. No jumping between files.

**Consistency.** The design scale (spacing, colors, type) keeps your UI consistent without extra effort.

**Responsive by default.** Breakpoint prefixes like `md:` and `lg:` make responsive design feel natural.

## A Simple Example

```html
<button
  class="rounded bg-pink-500 px-4 py-2 font-bold text-white hover:bg-pink-600"
>
  Click me
</button>
```

Compare this with writing custom CSS for the same result - Tailwind is just faster.

## The Tradeoff

Markup can get verbose. Long class strings on complex components are the main downside. Extracting reusable components (in React or Astro) helps manage this.

Overall, Tailwind has made me faster and my UIs more consistent. It's my default choice for any new project.
