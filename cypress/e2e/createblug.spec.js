// cypress/e2e/profile-header.spec.js

describe('Profile Header', () => {
    beforeEach(() => {
      cy.visit('/home');
    });
  
    it('should display the profile header with default data', () => {
      cy.get('.profile-header').should('be.visible');
      cy.get('.profile-picture-circle img').should('have.attr', 'src', '/Default_pfp.svg');
      cy.get('.header-image-container img').should('have.attr', 'src', '/Default_Header.svg');
    });
  
    it('should open the Create Blug modal when Create Blug button is clicked', () => {
      cy.get('.create-post-button').click();
      cy.get('.modal-container').should('be.visible');
    });
  });
  