---
title: "Testing Async Code"
date: "2024-05-12"
excerpt: ""
draft: true
---

**index.ts**

```typescript
const fetchData = (callback) => {
  setTimeout(() => {
    callback("peanut butter");
  }, 1000);
};

const fetchDataPromise = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("peanut butter");
    }, 1000);
  });
};

module.exports = fetchDataPromise;
```

**index.test.js**

```javascript
const fetchPromise = require("./index");

// test("the data is peanut butter", () => {
//   return expect(fetchPromise()).resolves.toBe("peanut butter");
// });

// test("the data is not fetched", () => {
//   return expect(fetchPromise()).rejects.toThrow("error");
// });

test("the data is peanut butter", async () => {
  const data = await fetchPromise();
  expect(data).toBe("peanut butter");
});
```
