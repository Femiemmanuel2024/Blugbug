describe('Registration Page', () => {
    it('should display the registration page', () => {
      cy.visit('/signup');
      cy.contains('Sign Up').should('be.visible');
    });
  
    it('should display an error message for missing fields', () => {
      cy.visit('/signup');
      cy.get('input[name="email"]').type('newuser@example.com');
      cy.get('form').submit();
      cy.contains('All fields are required').should('be.visible');
    });
  
    it('should register successfully with valid details', () => {
      cy.visit('/signup');
      cy.get('input[name="email"]').type('newuser@example.com');
      cy.get('input[name="username"]').type('newuser');
      cy.get('input[name="password"]').type('password123');
      cy.get('form').submit();
      cy.url().should('include', '/welcome');
    });
  });
  