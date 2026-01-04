---
title: "Custom Properties"
date: "2024-09-05"
draft: false
---

Custom properties, also known as CSS variables, help you declare reused values in your CSS. This is very useful for DRY code and creating design systems in CSS.

Here's how you use them:

```css
div {
  --theme-color: black;
  background-color: var(--theme-color);
}
```

To be able to reference a custom property globally, declare it on the `:root` pseudo-class.

```css
:root {
  --theme-color: black;
}
```

### Resources

[Using CSS custom properties | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
