// cypress/e2e/navbar.spec.js

describe('NavBar Navigation', () => {
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
    cy.wait(1000); // Wait for 1 second
  });

  it('should navigate to Home page', () => {
    cy.get('.navbar-right .nav-icon').contains('Home').click();
    cy.url().should('include', '/home');
    cy.wait(1000); // Wait for 1 second
  });

  it('should navigate to MyBlug page', () => {
    cy.get('.navbar-right .nav-icon').contains('MyBlug').click();
    cy.url().should('include', '/MyBlug');
    cy.wait(1000); // Wait for 1 second
  });

  it('should navigate to Blug page', () => {
    cy.get('.navbar-right .nav-icon.blug-icon').contains('Blug').click();
    cy.url().should('include', '/BlugPage');
    cy.wait(1000); // Wait for 1 second
  });

  it('should navigate to Settings page', () => {
    cy.get('.navbar-right .nav-icon').contains('Settings').click();
    cy.url().should('include', '/settings');
    cy.wait(1000); // Wait for 1 second
  });

  it('should log out and navigate to Login page', () => {
    cy.get('.navbar-right .nav-icon').contains('Logout').click();
    cy.url().should('include', '/login');
    cy.wait(1000); // Wait for 1 second
  });
});
