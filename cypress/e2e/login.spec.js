describe('Login Page', () => {
  const email = 'test@gmail.com';
  const password = 'test';

  it('should display the login page', () => {
    cy.visit('/login');
    cy.contains('Login').should('be.visible');
  });

  it('should display an error message for invalid login', () => {
    cy.visit('/login');
    cy.get('input[type="text"]').type('invaliduser@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('form').submit();
    cy.contains('Wrong Details').should('be.visible');
  });

  it('should log in successfully with valid credentials', () => {
    cy.visit('/login');
    cy.get('input[type="text"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('form').submit();

    // Check if redirected to /home
    cy.url().should('include', '/home');
  });
});
