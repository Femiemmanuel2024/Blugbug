describe('Logout', () => {
    it('should log the user out and redirect to the login page', () => {
      cy.visit('/home');
      cy.get('button').contains('Logout').click();
      cy.url().should('include', '/login');
    });
  });
  