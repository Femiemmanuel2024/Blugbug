// cypress/e2e/logout.spec.js

describe('Logout', () => {
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

  it('should log the user out and redirect to the login page', () => {
    // Click the logout button on the navbar
    cy.get('.nav-icon').contains('Logout').click();
    
    // Check if redirected to the login page
    cy.url().should('include', '/login');
  });
});
