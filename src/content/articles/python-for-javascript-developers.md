---
title: Python for JavaScript Developers
date: 2026-04-14
excerpt: A side-by-side look at Python through the lens of JavaScript. If you know JS, you're closer to writing Python than you think.
draft: false
---

## Why This Matters

JavaScript and Python are the two most common languages you'll encounter in modern backend and data work. If you've been writing JavaScript for a while and need to pick up Python - for a Lambda function, a data pipeline, or a machine learning project - you're in a good position. The concepts transfer almost directly. The syntax is just different.

This article is structured as a side-by-side translation guide. Every section shows the JavaScript way and the Python equivalent next to each other. A few things will feel natural immediately. A few will feel backwards. Both are worth knowing.

## Variables and Types

Python uses the same basic types - strings, numbers, booleans, `None` - with slightly different names and no `var`/`let`/`const` keywords. Variables are just assigned.

**Declaration**

```js
// JavaScript
const name = "Alice";
let count = 0;
var legacy = "avoid this";
```

```python
# Python
name = "Alice"
count = 0
```

Python has no `const`. Convention is to use `UPPER_SNAKE_CASE` for values that shouldn't change, but the language doesn't enforce it.

**Null / undefined**

```js
// JavaScript
let x = null;
let y = undefined;
```

```python
# Python
x = None  # Python has one: None
```

There's no `undefined` in Python. An unassigned variable doesn't exist at all.

**String formatting**

```js
// JavaScript
const msg = `Hello, ${name}!`;
```

```python
# Python
msg = f"Hello, {name}!"
```

f-strings (Python 3.6+) are the standard way. They're fast and support any expression inside the braces: `f"Total: {price * 1.1:.2f}"`.

**Type checking**

Python is dynamically typed like JavaScript, but there's no type coercion. `"5" + 5` raises a `TypeError` - Python doesn't silently convert.

```python
len("hello")   # 5
type("hello")  # <class 'str'>
isinstance("hello", str)  # True
```

## Functions

Python functions are defined with `def`. No curly braces - indentation defines the body.

**Basic function**

```js
// JavaScript
function greet(name) {
  return `Hello, ${name}`;
}

const greet = (name) => `Hello, ${name}`;
```

```python
# Python
def greet(name):
    return f"Hello, {name}"
```

**Default parameters**

```js
// JavaScript
function greet(name = "World") {
  return `Hello, ${name}`;
}
```

```python
# Python
def greet(name="World"):
    return f"Hello, {name}"
```

**Keyword arguments**

Python functions can be called with arguments by name - in any order. This is called keyword arguments and is used constantly in Python APIs.

```python
def create_event(name, date, capacity=100):
    return {"name": name, "date": date, "capacity": capacity}

create_event(date="2026-06-15", name="CDK Workshop")  # order doesn't matter
create_event("CDK Workshop", "2026-06-15", capacity=50)
```

**`*args` and `**kwargs`\*\*

The Python equivalent of rest/spread:

```js
// JavaScript
function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}

const merged = { ...defaults, ...overrides };
```

```python
# Python
def sum_all(*nums):       # *args: variable positional arguments (tuple)
    return sum(nums)

def configure(**opts):    # **kwargs: variable keyword arguments (dict)
    print(opts)

merged = {**defaults, **overrides}  # spread/merge dicts
```

**Lambda vs arrow function**

Python has `lambda` for single-expression anonymous functions. It's limited - no statements, no multiline - and mostly used for sorting and callbacks.

```js
const double = (x) => x * 2;
[1, 2, 3].sort((a, b) => a - b);
```

```python
double = lambda x: x * 2
sorted([3, 1, 2], key=lambda x: x)
```

For anything beyond a simple expression, use `def`.

## Objects vs Dictionaries

JavaScript objects serve as general-purpose key-value stores. Python uses **dicts** for the same job.

**Creating**

```js
// JavaScript
const event = {
  id: "abc-123",
  name: "CDK Workshop",
  capacity: 50,
};
```

```python
# Python
event = {
    "id": "abc-123",
    "name": "CDK Workshop",
    "capacity": 50,
}
```

Python dict keys are explicit strings (or other hashable types). There's no shorthand like `{ name }` to use a variable as both key and value.

**Accessing values**

```js
// JavaScript
event.name; // dot access
event["name"]; // bracket access
event.missing?.name; // optional chaining
```

```python
# Python
event["name"]           # bracket access - standard
event.get("name")       # safe access - returns None if key missing
event.get("name", "?")  # with a default
```

Plain dicts don't support dot access. If you want `event.name`, use `dataclasses`, `namedtuple`, or Pydantic.

**Common dict operations**

```python
# Check key existence
"name" in event         # True

# Add / update
event["location"] = "Online"

# Delete
del event["capacity"]

# Merge (Python 3.9+)
merged = {**event, "tags": ["aws", "cdk"]}

# Iterate
for key, value in event.items():
    print(f"{key}: {value}")
```

## Arrays vs Lists

Python lists are the equivalent of JavaScript arrays. They're ordered, mutable, and can hold mixed types.

**Creating**

```js
// JavaScript
const items = [1, 2, 3];
```

```python
# Python
items = [1, 2, 3]
```

**Common operations**

```js
// JavaScript
items.push(4);
items.pop();
items.length;
items.includes(2);
items.indexOf(2);
```

```python
# Python
items.append(4)
items.pop()
len(items)
2 in items
items.index(2)
```

**Slicing**

Python lists have built-in slicing - a concise way to get a subset.

```python
items = [0, 1, 2, 3, 4]

items[1:3]   # [1, 2] - index 1 up to (not including) 3
items[:2]    # [0, 1] - from start up to index 2
items[2:]    # [2, 3, 4] - from index 2 to end
items[-1]    # 4 - last element (negative indexing)
items[-2:]   # [3, 4] - last two elements
```

**Unpacking**

```js
// JavaScript
const [first, ...rest] = items;
const copy = [...items];
```

```python
# Python
first, *rest = items
copy = [*items]  # or items.copy()
```

## Loops and Comprehensions

**For loop**

```js
// JavaScript
for (let i = 0; i < 5; i++) { ... }
for (const item of items) { ... }
```

```python
# Python
for i in range(5): ...           # 0, 1, 2, 3, 4
for item in items: ...           # iterate over any iterable
for i, item in enumerate(items): ...  # index + value
```

`range(n)` replaces the C-style `for (let i = 0; i < n; i++)`. `enumerate()` replaces `for (let i = 0; i < arr.length; i++)` when you need both the index and value.

**While loop**

```python
while condition:
    ...
```

Same concept, no braces.

**List comprehensions**

Comprehensions are a concise way to build a list from another iterable - the Python version of `.map()` and `.filter()`.

```js
// JavaScript
const doubled = items.map((x) => x * 2);
const evens = items.filter((x) => x % 2 === 0);
const doubledEvens = items.filter((x) => x % 2 === 0).map((x) => x * 2);
```

```python
# Python
doubled = [x * 2 for x in items]
evens = [x for x in items if x % 2 == 0]
doubled_evens = [x * 2 for x in items if x % 2 == 0]
```

**Dict comprehensions**

```python
# Build a dict from a list
names = ["Alice", "Bob", "Carol"]
name_lengths = {name: len(name) for name in names}
# {"Alice": 5, "Bob": 3, "Carol": 5}
```

## Modules and Imports

**Importing**

```js
// JavaScript (ES modules)
import { readFile } from "fs/promises";
import express from "express";
```

```python
# Python
import os                        # import the whole module
from os import path              # import a specific name
from os.path import join, exists # import multiple
import json as j                 # alias
```

**Creating a module**

Any `.py` file is a module. Functions and variables defined at the top level are exported by default - there's no `export` keyword.

```python
# utils.py
def format_response(status_code, body):
    return {"statusCode": status_code, "body": json.dumps(body)}
```

```python
# handler.py
from utils import format_response
```

**The `__name__ == "__main__"` guard**

When Python runs a file directly, `__name__` is set to `"__main__"`. When it's imported as a module, `__name__` is the module's filename. This is how you write code that runs only when the file is executed directly - the equivalent of Node's `if (require.main === module)`.

```python
# script.py
def main():
    print("Running!")

if __name__ == "__main__":
    main()  # only runs when executed directly, not when imported
```

## Classes

Python classes are structurally similar to ES6 classes. The main differences: `self` instead of `this`, and `__init__` instead of `constructor`.

**Defining a class**

```js
// JavaScript
class Event {
  constructor(name, date) {
    this.name = name;
    this.date = date;
  }

  describe() {
    return `${this.name} on ${this.date}`;
  }
}

const e = new Event("CDK Workshop", "2026-06-15");
```

```python
# Python
class Event:
    def __init__(self, name, date):
        self.name = name
        self.date = date

    def describe(self):
        return f"{self.name} on {self.date}"

e = Event("CDK Workshop", "2026-06-15")
```

`self` is the first parameter in every instance method - you pass it explicitly in the definition but don't pass it when calling the method. Python makes it visible; JavaScript hides `this` behind the scenes.

**Dataclasses**

For simple data containers, `@dataclass` eliminates the `__init__` boilerplate:

```python
from dataclasses import dataclass

@dataclass
class Event:
    name: str
    date: str
    capacity: int = 100

e = Event(name="CDK Workshop", date="2026-06-15")
print(e.name)      # CDK Workshop
print(e)           # Event(name='CDK Workshop', date='2026-06-15', capacity=100)
```

`@dataclass` generates `__init__`, `__repr__`, and `__eq__` automatically. It's the Python equivalent of a TypeScript interface with a constructor.

## Async in Python vs JavaScript

JavaScript is built on a single-threaded event loop - everything async by default. Python is not. Python code runs synchronously by default, and `asyncio` is an opt-in concurrency model added later.

**JavaScript's model:** the event loop handles I/O non-blocking. `async/await` is the standard way to work with Promises.

**Python's model:** code runs synchronously on a single thread unless you explicitly use `asyncio`, threads, or multiprocessing.

```js
// JavaScript
async function fetchData() {
  const res = await fetch("https://api.example.com/data");
  return res.json();
}
```

```python
# Python asyncio
import asyncio
import aiohttp

async def fetch_data():
    async with aiohttp.ClientSession() as session:
        async with session.get("https://api.example.com/data") as res:
            return await res.json()

asyncio.run(fetch_data())
```

**The practical reality for AWS work:** most Python on AWS - Lambda handlers, boto3 calls, data processing - is synchronous. boto3 is a blocking library. You don't need `asyncio` for Lambda functions, and adding it without a reason makes code harder to debug.

Reach for async Python when you need high-concurrency I/O (many simultaneous HTTP calls) and libraries that support it. For everything else, synchronous is simpler.

## Error Handling

**Try/except vs try/catch**

```js
// JavaScript
try {
  const data = JSON.parse(raw);
} catch (err) {
  console.error(err.message);
}
```

```python
# Python
import json

try:
    data = json.loads(raw)
except json.JSONDecodeError as e:
    print(e)
```

**Catching multiple exceptions**

```python
try:
    result = risky_operation()
except ValueError as e:
    print(f"Bad value: {e}")
except KeyError as e:
    print(f"Missing key: {e}")
except (TypeError, AttributeError) as e:
    print(f"Type problem: {e}")
finally:
    cleanup()  # always runs
```

**Raising exceptions**

```js
// JavaScript
throw new Error("Something went wrong");
throw new TypeError("Expected a string");
```

```python
# Python
raise ValueError("Something went wrong")
raise TypeError("Expected a string")

# Re-raise the current exception
except Exception as e:
    log_error(e)
    raise
```

**Common built-in exceptions to know**

| Exception           | When it's raised                        |
| ------------------- | --------------------------------------- |
| `ValueError`        | Right type, wrong value (`int("abc")`)  |
| `TypeError`         | Wrong type (`"5" + 5`)                  |
| `KeyError`          | Dict key doesn't exist (`d["missing"]`) |
| `IndexError`        | List index out of range (`items[99]`)   |
| `AttributeError`    | Object doesn't have the attribute       |
| `FileNotFoundError` | File doesn't exist                      |

In Lambda handlers, it's usually better to catch specific exceptions and return a structured error response than to let exceptions bubble up and trigger a retry.

## The Takeaway

- **Variables are just assigned.** No `const`/`let`/`var`. Use `UPPER_SNAKE_CASE` as convention for constants.
- **Use `.get()` for safe dict access.** Plain dicts raise `KeyError` on missing keys - `event.get("key")` returns `None` instead. No optional chaining (`?.`) in Python.
- **`*args` and `**kwargs`are rest and spread.**`\*args`is a tuple of positional arguments;`**kwargs`is a dict of keyword arguments.`{**dict_a, \*\*dict_b}` merges dicts.
- **List comprehensions replace `.map()` and `.filter()`.** `[x * 2 for x in items if x % 2 == 0]` is idiomatic Python. Learn them early - they're everywhere.
- **`self` is explicit, not implicit.** Every instance method takes `self` as the first parameter. `__init__` is the constructor. For data containers, `@dataclass` eliminates the boilerplate.
- **Python is synchronous by default.** Don't reach for `asyncio` unless you need high-concurrency I/O and have libraries that support it. Lambda handlers with boto3 are synchronous - that's the right default.
- **Type hints exist and are worth using.** Python won't enforce them at runtime, but they make code readable and enable static analysis. See [Python Type Hints for TypeScript Developers](/articles/python-type-hints-for-typescript-developers) for the full picture.
