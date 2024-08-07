// cypress/e2e/new-user-page.spec.js

describe('New User Page', () => {
  beforeEach(() => {
    // Adjust the URL to match your dev server
    cy.visit('/home');
  });

  it('should display the navbar', () => {
    cy.get('.navbar').should('be.visible');
  });

  it('should display the left column', () => {
    cy.get('.left-column').should('be.visible');
  });

  it('should display the right column', () => {
    cy.get('.right-column').should('be.visible');
  });

  
});
