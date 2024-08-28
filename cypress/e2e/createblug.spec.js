// cypress/e2e/profile-header.spec.js

describe('Profile Header', () => {
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

  it('should display the profile header with default data', () => {
    cy.get('.profile-header').should('be.visible');
    cy.get('.profile-picture-circle img').should('have.attr', 'src', '/Default_pfp.svg');
    cy.get('.header-image-container img').should('have.attr', 'src', '/Default_Header.svg');
  });

  it('should navigate to Create Blog Post page when Create Blug button is clicked', () => {
    cy.get('.create-post-button').click();
    cy.url().should('include', '/create-blog'); // Check that the URL includes the path for the create blog post page
  });
});
