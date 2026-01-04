---
title: "Array Methods"
date: "2024-08-26"
draft: false
---

JavaScript provide a variety of built-in array methods that allow you to manipulate and interact with arrays. Here are some of the most commonly used array methods:

[Mutator Methods](#mutator-methods)

[Accessor Methods](#accessor-methods)

[Iteration Methods](#iteration-methods)

[Other Methods](#other-methods)

<!-- ! Todo: Figure out why html elements are not being rendered -->
<h2 id="mutator-methods">Mutator Methods</h2>

These methods modify the array itself.

1. **push()**: Adds one of more elements to the end of an array.

```typescript
let iceCreamFlavors = ["vanilla", "chocolate", "strawberry"];

// Add one element to the end of the array
iceCreamFlavors.push("cookie dough");

// Add multiple elements to the end of the array
iceCreamFlavors.push("mint chip", "rocky road");

// Output: ["vanilla", "chocolate", "strawberry", "cookie dough","mint chip", "rocky road"]
console.log(iceCreamFlavors);

console.log(iceCreamFlavors.length); // Output: 6
```

2. **pop()**: Removes the last element from an array.

```typescript
let iceCreamFlavors = [
  "vanilla",
  "chocolate",
  "strawberry",
  "mint chip",
  "rocky road",
];

// Remove the last element from the array
let removedFlavor = iceCreamFlavors.pop();

// Output: ["vanilla", "chocolate", "strawberry", "mint chip", "rocky road"]
console.log(iceCreamFlavors);

// Output: "rocky road"
console.log(removedFlavor);
```

3. **shift()**: Removes the first element from an array.

```typescript
let iceCreamFlavors = [
  "vanilla",
  "chocolate",
  "strawberry",
  "mint chip",
  "rocky road",
];

// Remove the first element from the array
let removedFlavor = iceCreamFlavors.shift();

// Output: ["chocolate", "strawberry", "mint chip", "rocky road"]
console.log(iceCreamFlavors);

// Output: "vanilla"
console.log(removedFlavor);
```

4. **unshift()**: Adds one or more elements to the beginning of an array.

```typescript
let iceCreamFlavors = [
  "vanilla",
  "chocolate",
  "strawberry",
  "mint chip",
  "rocky road",
];

// Add one element to the beginning of the array
let newLength = iceCreamFlavors.unshift("cookie dough");

// Output: ["cookie dough", "vanilla", "chocolate", "strawberry", "mint chip", "rocky road"]
console.log(iceCreamFlavors);

// Output: 6
console.log(newLength);

// Add multiple elements to the beginning of the array
newLength = iceCreamFlavors.unshift("pistachio", "lemon");

// Output: ["pistachio", "lemon", "cookie dough", "vanilla", "chocolate", "strawberry", "mint chip", "rocky road"]
console.log(iceCreamFlavors);

// Output: 8
console.log(newLength);
```

5. **splice()**: Adds or removes elements from an array.

```typescript
let iceCreamFlavors = [
  "vanilla",
  "chocolate",
  "strawberry",
  "mint chip",
  "rocky road",
];

// Remove 2 elements starting from index 1
let removedFlavors = iceCreamFlavors.splice(1, 2);

// Output: ["vanilla", "mint chip", "rocky road"]
console.log(iceCreamFlavors);

// Output: ["chocolate", "strawberry"]
console.log(removedFlavors);

// Add 2 elements at index 2
iceCreamFlavors.splice(2, 0, "cookie dough", "pistachio");

// Output: ["vanilla", "mint chip", "cookie dough", "pistachio", "rocky road"]
console.log(iceCreamFlavors);

// Replace 1 element at index 1
iceCreamFlavors.splice(1, 1, "lemon");

// Output: ["vanilla", "lemon", "cookie dough", "pistachio", "rocky road"]
console.log(iceCreamFlavors);
```

6. **sort()**: Sorts the elements of an array. By default, the `sort()` method sorts the elements as strings in ascending order. To sort the elements numerically or in a custom order, you can provide a compare function.

```typescript
let iceCreamFlavors = [
  "vanilla",
  "chocolate",
  "strawberry",
  "mint chip",
  "rocky road",
];

// Sort the array in alphabetical order
iceCreamFlavors.sort();

// Output: ["chocolate", "mint chip", "rocky road", "strawberry", "vanilla"]
console.log(iceCreamFlavors);

// Sort the array in reverse alphabetical order
iceCreamFlavors.sort((a, b) => b.localeCompare(a));

// Output: ["vanilla", "strawberry", "rocky road", "mint chip", "chocolate"]
console.log(iceCreamFlavors);

// Sort the array by length of the string
iceCreamFlavors.sort((a, b) => a.length - b.length);

// Output: ["vanilla", "chocolate", "strawberry", "rocky road", "mint chip"]
console.log(iceCreamFlavors);
```

7. **reverse()**: Reverses the order of the elements in an array.

```typescript
let iceCreamFlavors = [
  "vanilla",
  "chocolate",
  "strawberry",
  "mint chip",
  "rocky road",
];

// Reverse the array
iceCreamFlavors.reverse();

// Output: ["rocky road", "mint chip", "strawberry", "chocolate", "vanilla"]
console.log(iceCreamFlavors);
```

8. **fill()**: Fills all the elements of an array from a start index to an end index with a static value.

```typescript
let numbers = [1, 2, 3, 4, 5];

// Fill all elements with 0
numbers.fill(0);

// Output: [0, 0, 0, 0, 0]
console.log(numbers);

// Fill elements from index 1 to 3 with 7
numbers.fill(7, 1, 3);

// Output: [0, 7, 7, 0, 0]
console.log(numbers);

// Fill elements from index 2 to the end with 9
numbers.fill(9, 2);

// Output: [0, 7, 9, 9, 9]
console.log(numbers);
```

9. **copyWithin()**: Copies a sequence of array elements within the array.

```typescript
let numbers = [1, 2, 3, 4, 5];

// Copy elements from index 0 to index 2 (exclusive) to index 3
numbers.copyWithin(3, 0, 2);

// Output: [1, 2, 3, 1, 2]
console.log(numbers);

// Copy elements from index 2 to the end to index 0
numbers.copyWithin(0, 2);

// Output: [3, 1, 2, 1, 2]
console.log(numbers);
```

<h2 id="accessor-methods">Accessor Methods</h2>

These methods do not modify the array but return some representation of the array.

1. `concat()`: Merges two or more arrays.
2. `slice()`: Returns a shallow copy of a portion of an array.
3. `includes()`: Determine whether an array includes a certain value.
4. `indexOf()`: Returns the first index at which a given element can be found.
5. `lastIndexOf()`: Returns the last index at which a given element can be found.
6. `join()`: Joins all elements of an array into a string.
7. `toString()`: Returns a string representing the array.
8. `toLocalString()`: Returns a localized string representing the array.

<h2 id="iteration-methods">Iteration Methods</h2>

These methods are used to iterate over arrays.

1. `forEach()`: Executes a provided function once for each array element.
2. `map()`: Creates a new array with the results of calling a provided funtion on every element.
3. `filter()`: Creates a new array with all the elements that pass the test implemented by the provided function.
4. `reduce()`: Applies a function against an accumulator and each element to reduce it to a single value.
5. `reduceRight()`: Applies a function against an accumulator and each element (from right to left) to reduce it to a single value.
6. `some()`: Tests whether all elements in the array pass the test implemented by the provided function.
7. `every()`: Tests whether all elements in the array pass the test implemented by the provided function.
8. `find()`: Returns the first element that satisfies the provided testing function.
9. `findIndex()`: Returns the index of the first element that satisfies the provided testing function.
10. `entries()`: Returns a new Array Iterator object that contains the keys for each index.
11. `keys()`: Returns a new Array Iterator object that contains the keys for each index.
12. `values()`: Returns a new Array Iterator object that contains the values for each index.

<h2 id="other-methods">Other Methods</h2>

1. `flat()`: Creates a new array with all sub-array elements concatenated into it recursively up to the specified depth.
2. `flatMap()`: Maps each element using a mapping function, then flattens the result into a new array.
3. `from()`: Create a new, shallow-copied array instance from an array-like or iterable object.
4. `isArray()`: Determines whether the passed value is an array.
5. `of()`: Creates a new array instance with a variable number of arguments, regardless of number or type of the arguments.
