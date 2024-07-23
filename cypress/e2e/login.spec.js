describe('Login Page', () => {
  it('should display the login page', () => {
    cy.visit('/login');
    cy.contains('Login').should('be.visible');
  });

  it('should display an error message for invalid login', () => {
    cy.visit('/login');
    cy.get('input[type="text"]').type('invaliduser');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('form').submit();
    cy.contains('Wrong Details').should('be.visible');
  });

  it('should log in successfully with valid credentials', () => {
    cy.visit('/login');
    cy.get('input[type="text"]').type('validuser');
    cy.get('input[type="password"]').type('correctpassword');
    cy.get('form').submit();

    // Wait for the request to complete
    cy.intercept('POST', '**/login').as('loginRequest');
    cy.wait('@loginRequest');

    // Check if redirected to /home
    cy.url().should('include', '/home');
  });
});
