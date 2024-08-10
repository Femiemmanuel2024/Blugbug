// cypress/e2e/new-user-page.spec.js

describe('New User Page', () => {
  const email = 'test@gmail.com';
  const password = 'test';

  beforeEach(() => {
    // Visit the login page and perform login
    cy.visit('/login');
    cy.get('input[type="text"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('form').submit();

    // Ensure the user is redirected to the home page
    cy.url().should('include', '/home');
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
