---
title: "Closures"
date: "2024-11-01"
draft: true
---

Closures allow you to group code together, without creating a named function. These self-contained blocks of functionality can be passed around and used in your code. Closures can capture and store references to variables and constants from the context in which they are defined. This is known as closing over those variables, hence the name "closures".

## Closure Expression Syntax

The basic syntax of a closure expression is:

```swift
{ (parameters) -> returnType in
    // code
}
```

## Example

Here is an example of a closure that takes two integers and returns their sum:

```swift
let sumClosure = { (a: Int, b: Int) -> Int in
    return a + b
}

let result = sumClosure(3, 5) // result is 8
```

## Capturing Values

Closures can capture and store references to any constants and variables from the context in which they are defined:

```swift
func makeIncrementer(incrementAmount: Int) -> () -> Int {
    var total = 0
    let incrementer: () -> Int = {
        total += incremnentAmount
        return total
    }
    return incrementer
}

let incrementByTwo = makeIncrementer(incrementAmount: 2)
print(incrementByTwo()) // prints 2
print(incrementByTwo()) // prints 4
```

## Resources

[Closures | Documentation](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/closures)
