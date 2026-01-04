---
title: "@scope"
date: "2024-08-20"
excerpt: ""
draft: true
---

```css
@scope (.card) {
  h2 {
    color: pink;
    width: max-content;
  }

  p {
    color: #bada55;
  }

  :scope {
    background: black;
    border: 2px solid #ffc600;
    &:hover {
      background: red;
    }
  }
}
```

###

```html
<div class="card">
  <h2>Inside Scope!</h2>
  <p>I am Scoped inside!</p>
  <style>
    @scope {
      /* Select the Scope div */
      :scope {
        background: black;
        color: white;
      }
      /* Select the inside Scope */
      h2 {
        color: red;
      }
    }
  </style>
</div>
```

### Scope Pseudo-Classes Inline

```html
<button>
  I'm a button. Hover me
  <style>
    @scope {
      :scope:hover {
        background: red;
      }
    }
  </style>
</button>
```

### Donut Scope

```css
@scope (.card) to (.callout) {
  h2 {
    color: pink;
    width: max-content;
  }

  p {
    color: #bada55;
  }

  :scope {
    background: black;
    border: 2px solid #ffc600;
    &:hover {
      background: red;
    }
  }
}
```

### Resources

[@scope - CSS: Cascading Style Sheets | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)

[Syntax - How does scope CSS work?](https://www.youtube.com/watch?v=YPmUIwVh5vk)
