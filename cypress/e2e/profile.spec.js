describe('Profile Page', () => {
    it('should display the profile page', () => {
      cy.visit('/profile');
      cy.contains('Profile').should('be.visible');
    });
  
    it('should display the user\'s information', () => {
      cy.visit('/profile');
      cy.contains('validuser').should('be.visible');
      cy.contains('validuser@example.com').should('be.visible');
    });
  
    it('should allow the user to update their profile', () => {
      cy.visit('/profile');
      cy.get('input[name="username"]').clear().type('updateduser');
      cy.get('input[name="email"]').clear().type('updateduser@example.com');
      cy.get('form').submit();
      cy.contains('Profile updated successfully').should('be.visible');
    });
  });
  