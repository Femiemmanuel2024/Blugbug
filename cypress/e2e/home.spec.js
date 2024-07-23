describe('Home Page', () => {
    it('should display the home page', () => {
      cy.visit('/home');
      cy.contains('Welcome').should('be.visible');
    });
  
    it('should display the user\'s name', () => {
      cy.visit('/home');
      cy.contains('Hello, validuser').should('be.visible');
    });
  });
  