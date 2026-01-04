---
title: "Intro to Cypress"
date: "2024-11-06"
---

Cypress is a front end testing tool built for the modern web. It can test anything that runs in a browser. If you are a web developer or a QA engineer, Cypress can be a tool to increase the quality of your websites and web applications.

## Querying Elements

Querying elements in Cypress involves using various commands to select and interact with elements on a web page. Cypress provides a set of commands to query elements based on different criteria, such as CSS selectors, text content, attributes, and more. Some common commands include:

- **cy.get()** - select elements using CSS selectors.
- **cy.contains()** - find elements containing specific text.
- **cy.find()** - search within a specific element.
- **cy.getByRole()** - query elements by their ARIA roles.

```typescript
describe("Querying Elements in Cypress", () => {
  it("should find and interact with elements", () => {
    // Visit the page
    cy.visit("/");

    // Query an element by CSS selector
    cy.get('input[name="username"]').type("testuser");

    // Query an element containing specific text
    cy.contains("Submit").click();

    // Query an element by its ARIA role
    cy.getByRole("button", { name: /submit/i }).click();

    // Query an element within a specific parent element
    cy.get(".form").find('input[name="password"]').type("password123");

    // Assert that an element is visible
    cy.get(".success-message").should("be.visible");
  });
});
```

## Chaining Commands

Cypress allows you to perform a series of actions in a sequential manner by chaining commands. Cypress commands are asynchronouse and return promises, but Cypress handles the synchronization internally. You can interact with and assert about elements through these commands.

### Interacting with Elements

Here are some common interactions you can perform with elements in Cypress:

1. **.type()** - type text into input fields
2. **.click()** - click on buttons, links, and other clickable elements
3. **.select()** - select options from a dropdown menu
4. **.check()** - check and uncheck checkboxes
5. **.focus()** - focus input field
6. **.blur()** - blur input field
7. **.trigger()** - hover over element, also used to simulate drag and drop of an element
8. **.scrollIntoView()** - scroll an element into view
9. **.dblclick()** - double-click on element
10. **.rightclick()** - right-click on element

### Asserting about Elements

Assertions in tests are statements that verify whether a certain condition is true or false. Assertions validate the expected behavior of an application during testing.There are two ways you can write assertions in Cypress:

1. **Cypress Commands** - **.should()** or **.and()**

```typescript
// The subject here is the first <tr>.
// This asserts that the <tr> has an .active class
cy.get("tbody tr:first").should("have.class", "active");
```

```typescript
cy.get("#header a")
  .should("have.class", "active")
  .and("have.attr", "href", "/users");
```

2. **Mocha Assertions** - **expect**

```typescript
// the explicit subject here is the boolean: true
expect(true).to.be.true;
```
