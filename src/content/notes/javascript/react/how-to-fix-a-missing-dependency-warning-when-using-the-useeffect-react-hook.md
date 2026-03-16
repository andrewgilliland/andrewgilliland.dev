---
title: How to Fix A Missing Dependency Warning When Using the useEffect React Hook
date: "2021-05-13"
excerpt: One approach to solving a missing dependency warning using the useEffect hook.
draft: true
---

## The Problem

You use a useEffect hook for trying to retrieve some data from an API before you render a component. In this example our Component requests data from `'some/url'` with axios.

```jsx
const Component = ({ params }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const res = axios.get("/some/url", { params });
    setData(res);
  }, []);
};
```

Then you get the following eslint warning:

`React Hook useEffect has a missing dependency: 'params'. Either include it or remove the dependency array.`

You may think adding params to the dependency array will fix this problem...

```jsx
const Component = ({ params }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const res = axios.get("/some/url", { params });
    setData(res);
  }, [params]);
};
```

And it could, but if params is an object it will re-render the component every time. This is because of JavaScript's equality comparison of objects will return a false. So every params object is not equal to what it is compared to and re-render, even though nothing could change in the params object.

## The Solution

One solution to this problem that does not involve restructuring your code is to utililize a useRef hook. You can utilize the `.current` property of hadFetchedData, which has the value to what you initialized with the useRef hook.

```jsx
const Component = ({ params }) => {
  const hasFetchedData = useRef(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!hasFetchedData.current) {
      const res = axios.get("/some/url", { params });
      setData(res);
      hasFetchedData.current = true;
    }
  }, [params]);
};
```

Here you can set hasFetchedData to false and update it to true when code inside the useEffect hook runs. This will eliminate your useEffect hook from running in an infinite loop and the eslint warning is gone.

## Resources

Want to dig a little deeper into the useEffect hook, check out these articles!

[A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)

[Using the Effect Hook](https://reactjs.org/docs/hooks-effect.html)
