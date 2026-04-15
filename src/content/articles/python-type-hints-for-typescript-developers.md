---
title: Python Type Hints for TypeScript Developers
date: 2026-04-15
excerpt: You already think in types from TypeScript. Here's how to bring that mindset to Python with type hints, mypy, and Pydantic.
draft: false
---

## Why Type Hints Matter

Python is dynamically typed — you can write an entire application without a single type annotation and it will run fine. TypeScript developers coming to Python often find this unsettling at first, then liberating, then a source of subtle bugs.

Type hints (added in Python 3.5, significantly improved through 3.9–3.12) are Python's answer. They don't change how the code runs — Python ignores them at runtime — but they give you the same benefits you're used to from TypeScript: editor autocomplete, inline error detection, and static analysis tools that catch mistakes before you deploy.

The mental model shift: TypeScript enforces types at compile time. Python type hints are documentation that tools can check if you ask them to. You opt in to the checking with a tool like `mypy` or your editor's language server. The hints themselves are always optional — you can annotate as much or as little as you want.

## Basic Type Annotations

In TypeScript, you annotate variables with a colon. Python uses the same syntax.

```ts
// TypeScript
const name: string = "Alice";
const count: number = 0;
const active: boolean = true;
```

```python
# Python
name: str = "Alice"
count: int = 0
active: bool = True
```

In practice, you rarely annotate local variables — type inference handles them. Annotations are most useful on function signatures and class fields.

**Built-in types**

| TypeScript           | Python                     |
| -------------------- | -------------------------- |
| `string`             | `str`                      |
| `number`             | `int` / `float`            |
| `boolean`            | `bool`                     |
| `null` / `undefined` | `None`                     |
| `any`                | `Any` (from `typing`)      |
| `unknown`            | `object` or `Any`          |
| `never`              | `NoReturn` (from `typing`) |

**Collections**

Python 3.9+ lets you use the built-in collection types directly as generics. Earlier versions need `from typing import List, Dict, Tuple`.

```ts
// TypeScript
const names: string[] = ["Alice", "Bob"];
const scores: Map<string, number> = new Map();
const point: [number, number] = [1, 2];
```

```python
# Python 3.9+
names: list[str] = ["Alice", "Bob"]
scores: dict[str, int] = {}
point: tuple[int, int] = (1, 2)
```

## Functions and Return Types

```ts
// TypeScript
function greet(name: string): string {
  return `Hello, ${name}`;
}

function logEvent(event: string): void {
  console.log(event);
}
```

```python
# Python
def greet(name: str) -> str:
    return f"Hello, {name}"

def log_event(event: str) -> None:
    print(event)
```

Return type goes after `->`. Use `None` for functions that don't return a value — equivalent to `void`.

**Multiple parameters**

```ts
// TypeScript
function createEvent(name: string, date: string, capacity: number = 100): dict {
  return { name, date, capacity };
}
```

```python
# Python
def create_event(name: str, date: str, capacity: int = 100) -> dict[str, object]:
    return {"name": name, "date": date, "capacity": capacity}
```

**Callable types**

```ts
// TypeScript
type Handler = (event: string) => void;
```

```python
# Python
from collections.abc import Callable

Handler = Callable[[str], None]

def run(handler: Handler, event: str) -> None:
    handler(event)
```

## Optional and Union Types

**Optional**

In TypeScript, `string | undefined` or `string | null` is how you express a value that might be absent. Python uses `Optional[T]` or the shorthand `T | None` (Python 3.10+).

```ts
// TypeScript
function findUser(id: string): User | undefined { ... }
```

```python
# Python 3.10+
def find_user(id: str) -> User | None: ...

# Python 3.9 and earlier
from typing import Optional
def find_user(id: str) -> Optional[User]: ...
```

`Optional[T]` is exactly equivalent to `T | None` — it's just shorthand. Pick one and be consistent.

**Union types**

```ts
// TypeScript
type Id = string | number;
function normalize(id: Id): string {
  return String(id);
}
```

```python
# Python 3.10+
type Id = str | int

def normalize(id: str | int) -> str:
    return str(id)

# Python 3.9 and earlier
from typing import Union
def normalize(id: Union[str, int]) -> str:
    return str(id)
```

**Literal types**

TypeScript union string literals are used constantly for status fields, event types, and discriminated unions. Python has `Literal` for the same thing.

```ts
// TypeScript
type Status = "active" | "archived" | "draft";

function setStatus(status: Status): void { ... }
```

```python
# Python
from typing import Literal

Status = Literal["active", "archived", "draft"]

def set_status(status: Literal["active", "archived", "draft"]) -> None: ...
```

`mypy` will catch calls like `set_status("deleted")` as an error — same as TypeScript's compiler.

## Generics in Python

TypeScript generics — `function identity<T>(value: T): T` — have a direct Python equivalent.

```ts
// TypeScript
function identity<T>(value: T): T {
  return value;
}

function first<T>(items: T[]): T | undefined {
  return items[0];
}
```

```python
# Python 3.12+
def identity[T](value: T) -> T:
    return value

def first[T](items: list[T]) -> T | None:
    return items[0] if items else None
```

```python
# Python 3.9–3.11 (using TypeVar)
from typing import TypeVar

T = TypeVar("T")

def identity(value: T) -> T:
    return value

def first(items: list[T]) -> T | None:
    return items[0] if items else None
```

**Generic classes**

```ts
// TypeScript
class Stack<T> {
  private items: T[] = [];
  push(item: T): void {
    this.items.push(item);
  }
  pop(): T | undefined {
    return this.items.pop();
  }
}
```

```python
# Python 3.12+
class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T | None:
        return self._items.pop() if self._items else None
```

In practice, you won't write generic classes often in Python application code. They're more common in library code or utilities.

## TypedDict vs Interfaces

TypeScript interfaces define the shape of an object. Python has a few equivalents, each with different tradeoffs.

**TypedDict** — a dict with a known, typed structure at the type-checking level only. No runtime enforcement. Best for dicts you're passing around, especially JSON-shaped data from APIs.

```ts
// TypeScript
interface Event {
  id: string;
  name: string;
  date: string;
  capacity?: number;
}
```

```python
# Python — TypedDict
from typing import TypedDict, NotRequired

class Event(TypedDict):
    id: str
    name: str
    date: str
    capacity: NotRequired[int]  # optional key
```

A `TypedDict` is still just a regular dict at runtime — `isinstance(event, dict)` returns `True`. You get type checking, but the structure is not enforced when the program runs.

**dataclass** — a class with typed fields, generated `__init__`, and dot access. The more natural equivalent to a TypeScript interface when you want named properties and object behavior.

```python
from dataclasses import dataclass, field

@dataclass
class Event:
    id: str
    name: str
    date: str
    capacity: int = 100

e = Event(id="abc", name="CDK Workshop", date="2026-06-15")
e.name       # dot access
e.capacity   # 100 (default)
```

Use `TypedDict` when the shape of a plain dict matters (JSON payloads, boto3 responses). Use `@dataclass` when you want a real object with dot access and behavior. Use Pydantic when you need runtime validation.

## Checking Types with mypy

`mypy` is the standard static type checker for Python. It reads your type annotations and reports errors — the equivalent of running `tsc --noEmit`.

**Install and run**

```bash
pip install mypy

mypy handler.py          # check one file
mypy src/                # check a directory
mypy --strict handler.py # stricter: requires annotations everywhere
```

**Example**

```python
# handler.py
def greet(name: str) -> str:
    return f"Hello, {name}"

greet(42)  # mypy error: Argument 1 to "greet" has incompatible type "int"; expected "str"
```

**`mypy.ini` configuration**

```ini
[mypy]
python_version = 3.12
strict = true
ignore_missing_imports = true
```

`strict` enables a set of checks that require annotations throughout your code — roughly equivalent to TypeScript's `strict: true`. Start without it and add `--strict` once your codebase has good coverage.

**When mypy flags aren't actionable**

Third-party libraries without type stubs will produce `Missing imports` errors. Add `ignore_missing_imports = true` in `mypy.ini` or install the stubs package (`pip install boto3-stubs`).

Most editors (VS Code with Pylance, PyCharm) run type checking inline as you type — you may not need to run `mypy` explicitly unless you want it in CI.

## Runtime Validation with Pydantic

Type hints and `mypy` catch errors at analysis time, not at runtime. If a Lambda function receives a JSON payload with a missing field, Python won't raise an error — it'll just be absent from the dict. That's where Pydantic comes in.

Pydantic parses and validates data at runtime using your type annotations. It's the Python equivalent of a TypeScript runtime validator like `zod`.

**Install**

```bash
pip install pydantic
```

**Defining a model**

```ts
// TypeScript + zod
import { z } from "zod";

const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  capacity: z.number().default(100),
});

type Event = z.infer<typeof EventSchema>;
```

```python
# Python + Pydantic
from pydantic import BaseModel

class Event(BaseModel):
    id: str
    name: str
    date: str
    capacity: int = 100
```

**Parsing and validation**

```python
# Parse from a dict (e.g. JSON body)
data = {"id": "abc", "name": "CDK Workshop", "date": "2026-06-15"}
event = Event(**data)

event.name      # "CDK Workshop"
event.capacity  # 100 (default applied)

# Validation error on bad data
bad = {"id": "abc", "name": "CDK Workshop"}  # missing required field
Event(**bad)
# ValidationError: 1 validation error for Event
#   date: Field required
```

**Type coercion**

Pydantic coerces compatible types by default. `"42"` becomes `42` for an `int` field. If you want strict mode (no coercion), use `model_config = ConfigDict(strict=True)`.

**Serialization**

```python
event.model_dump()        # dict: {"id": "abc", "name": ..., "capacity": 100}
event.model_dump_json()   # JSON string
Event.model_validate(data)  # parse from dict (explicit, preferred over Event(**data))
```

## Type Hints in Practice: A Typed Lambda Handler

Here's what all of this looks like in a real Lambda function — a typed request/response pattern using Pydantic for body validation and type hints throughout.

```python
import json
import os
import boto3
from pydantic import BaseModel, ValidationError

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])


class CreateEventRequest(BaseModel):
    name: str
    date: str
    capacity: int = 100


class ApiResponse(BaseModel):
    statusCode: int
    body: str

    @classmethod
    def ok(cls, data: dict) -> "ApiResponse":
        return cls(statusCode=200, body=json.dumps(data))

    @classmethod
    def error(cls, status: int, message: str) -> "ApiResponse":
        return cls(statusCode=status, body=json.dumps({"error": message}))


def handler(event: dict, context: object) -> dict:
    try:
        body = json.loads(event.get("body") or "{}")
        request = CreateEventRequest.model_validate(body)
    except (json.JSONDecodeError, ValidationError) as e:
        return ApiResponse.error(400, str(e)).model_dump()

    record = request.model_dump()
    table.put_item(Item=record)

    return ApiResponse.ok(record).model_dump()
```

What each type tool is doing here:

- **Type hints** on `handler` tell your editor what `event` and `context` are, enabling autocomplete on their properties.
- **Pydantic** validates the incoming JSON body at runtime — missing or wrong-typed fields raise `ValidationError` before they can cause a deeper error.
- **`ApiResponse`** standardizes the response shape — `model_dump()` produces the dict that API Gateway expects.

This pattern scales: as the request shape grows, you add fields to `CreateEventRequest`. Pydantic handles validation; mypy catches type mismatches in the handler logic.

## The Takeaway

- **Type hints are optional but worth it.** Python won't enforce them at runtime, but your editor and mypy will. Annotate function signatures at minimum — it costs almost nothing and pays off when reading code weeks later.
- **`T | None` is Optional.** Use it for any value that might be absent. `Optional[T]` from `typing` is identical — pick one style.
- **Use `Literal` for string/int enums.** `Literal["active", "archived"]` is the Python equivalent of TypeScript's union string literals. mypy will catch invalid values.
- **`TypedDict` for dict shapes, `@dataclass` for objects.** `TypedDict` adds type checking to plain dicts (good for JSON payloads). `@dataclass` gives you a real class with dot access and generated `__init__`.
- **mypy is `tsc --noEmit` for Python.** Run it in CI or install Pylance in VS Code for inline checking. Start without `--strict` and add it as coverage improves.
- **Pydantic validates at runtime.** Type hints catch mistakes at analysis time. Pydantic catches them when your program actually receives data — from an API, a config file, or an event payload. Use it at system boundaries.
