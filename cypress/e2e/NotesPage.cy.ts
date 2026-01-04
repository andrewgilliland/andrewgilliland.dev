describe("NotesPage", () => {
  const renderComponent = () => {
    cy.visit("/");
    cy.get("h1").should("contain.text", "Andrew");
  };

  it("should navigate to Notes page when clicking read more button", () => {
    renderComponent();

    cy.get('[data-cy="primary-button"]').click();
    cy.url().should("include", "/notes");
  });

  // Level 1
  it("should render Glossary of Terms page when clicking on NoteCard", () => {
    renderComponent();

    cy.get('[data-cy="primary-button"]').click();
    cy.url().should("include", "/notes");

    cy.get('[data-cy="note-card-glossary-of-terms"]').first().click();
    cy.url().should("include", "/notes/glossary-of-terms");
  });

  // Level 2
  it("should rend the 'Array Methods' page when clicking on the NoteCard", () => {
    renderComponent();

    cy.get('[data-cy="primary-button"]').click();
    cy.url().should("include", "/notes");

    cy.get('[data-cy="topic-card-javascript"]').first().click();

    cy.get('[data-cy="note-card-javascript/array-methods"]').first().click();
    cy.url().should("include", "/notes/javascript/array-methods");
  });
});
