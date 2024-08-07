// cypress/e2e/logout.spec.js

describe('Logout', () => {
  it('should log the user out and redirect to the login page', () => {
    // Visit the home page
    cy.visit('/home');
    
    // Click the logout button on the navbar
    cy.get('.nav-icon').contains('Logout').click();
    
    // Check if redirected to the login page
    cy.url().should('include', '/login');
  });
});
