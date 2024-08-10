// cypress/e2e/signup-page.spec.js

describe('Sign Up Page', () => {
  beforeEach(() => {
    cy.visit('/signup');
  });

  it('should display the signup page', () => {
    cy.contains('Create Account').should('be.visible');
  });

  it('should fill out the form, check the terms and conditions, and display confirmation modal on submit', () => {
    const timestamp = Date.now();

    cy.get('input[placeholder="Full Name"]').type('Test User');
    cy.get('input[placeholder="Blugger Name"]').type(`testuser${timestamp}`);
    cy.get('input[placeholder="Email Address"]').type(`testuser${timestamp}@example.com`);
    cy.get('input[placeholder="Password"]').type('password123');
    cy.get('textarea[placeholder="About Me"]').type('This is a test user.');

    // Check the terms and conditions checkbox
    cy.get('input[type="checkbox"][id="terms"]').check();

    // Submit the form
    cy.get('form').submit();

    // Ensure the confirmation modal is visible
    cy.get('.confirmation-overlay').should('be.visible');
  });

  it('should limit the About Me field to 200 characters', () => {
    const longText = 'a'.repeat(250);
    cy.get('textarea[placeholder="About Me"]').type(longText);

    cy.get('textarea[placeholder="About Me"]').invoke('val').should('have.length', 200);
  });

  it('should toggle password visibility', () => {
    cy.get('input[placeholder="Password"]').type('password123');
    
    cy.get('input[placeholder="Password"]').should('have.attr', 'type', 'password');
    
    cy.get('.password-group i').click();
    
    cy.get('input[placeholder="Password"]').should('have.attr', 'type', 'text');
    
    cy.get('.password-group i').click();
    
    cy.get('input[placeholder="Password"]').should('have.attr', 'type', 'password');
  });
});
