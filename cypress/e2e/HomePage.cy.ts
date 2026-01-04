describe("HomePage", () => {
  const renderComponent = () => {
    cy.visit("/");
    cy.get("h1").should("contain.text", "Andrew");
  };

  it("should navigate to notes page when clicking read more button", () => {
    renderComponent();

    cy.get('[data-cy="primary-button"]').click();
    cy.url().should("include", "/notes");
  });

  it("should navigate to the /notes/javascript page when clicking the JavaScript topic card", () => {
    renderComponent();

    cy.get('[data-cy="topic-card-javascript"]').click();
    cy.url().should("include", "/notes/javascript");
    // the page should not contain the data-cy attribute "not-found-page"
    cy.get('[data-cy="not-found-page"]').should("not.exist");
  });
});
