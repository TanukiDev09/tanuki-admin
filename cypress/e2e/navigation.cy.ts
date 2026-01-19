describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Desktop Navigation', () => {
    beforeEach(() => {
      cy.viewport(1280, 720);
    });

    it('should display all navigation links in header', () => {
      cy.get('header nav').should('be.visible');
      cy.contains('Inicio').should('be.visible');
      cy.contains('Movimientos').should('be.visible');
      cy.contains('Categorías').should('be.visible');
      cy.contains('Ayuda').should('be.visible');
      cy.contains('Configuración').should('be.visible');
    });

    it('should navigate to all pages', () => {
      // Navigate to Movimientos
      cy.contains('a', 'Movimientos').click();
      cy.url().should('include', '/movimientos');
      cy.contains('h1', 'Movimientos').should('be.visible');

      // Navigate to Categorías
      cy.contains('a', 'Categorías').click();
      cy.url().should('include', '/categorias');
      cy.contains('h1', 'Categorías').should('be.visible');

      // Navigate to Ayuda
      cy.contains('a', 'Ayuda').click();
      cy.url().should('include', '/ayuda');
      cy.contains('h1', 'Glosario Financiero').should('be.visible');

      // Navigate to Configuración
      cy.contains('a', 'Configuración').click();
      cy.url().should('include', '/configuracion');
      cy.contains('h1', 'Configuración').should('be.visible');

      // Navigate back to Inicio
      cy.contains('a', 'Inicio').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should highlight active route', () => {
      // Check home is active initially
      cy.get('header nav a[href="/"]').should(
        'have.attr',
        'aria-current',
        'page'
      );

      // Navigate to movimientos and check it's active
      cy.contains('a', 'Movimientos').click();
      cy.get('header nav a[href="/movimientos"]').should(
        'have.attr',
        'aria-current',
        'page'
      );
      cy.get('header nav a[href="/"]').should('not.have.attr', 'aria-current');
    });

    it('should keep header sticky on scroll', () => {
      cy.get('header').should('have.class', 'sticky');
      cy.scrollTo(0, 500);
      cy.get('header').should('be.visible');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      cy.viewport(375, 667); // iPhone SE
    });

    it('should show hamburger menu button', () => {
      cy.get('button[aria-label*="menú"]').should('be.visible');
      cy.get('header nav').should('not.be.visible');
    });

    it('should open mobile menu on hamburger click', () => {
      cy.get('button[aria-label*="menú"]').click();
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('Movimientos').should('be.visible');
      cy.contains('Categorías').should('be.visible');
    });

    it('should close menu on backdrop click', () => {
      cy.get('button[aria-label*="menú"]').click();
      cy.get('[role="dialog"]').should('be.visible');

      // Click backdrop (the overlay behind the menu)
      cy.get('body').click(10, 10);
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should close menu on close button click', () => {
      cy.get('button[aria-label*="menú"]').click();
      cy.get('[role="dialog"]').should('be.visible');

      cy.get('button[aria-label*="Cerrar"]').click();
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should close menu on ESC key', () => {
      cy.get('button[aria-label*="menú"]').click();
      cy.get('[role="dialog"]').should('be.visible');

      cy.get('body').type('{esc}');
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should navigate and close menu when clicking link', () => {
      cy.get('button[aria-label*="menú"]').click();
      cy.get('[role="dialog"]').should('be.visible');

      cy.contains('[role="dialog"] a', 'Ayuda').click();
      cy.url().should('include', '/ayuda');
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should show active route in mobile menu', () => {
      cy.visit('/movimientos');
      cy.get('button[aria-label*="menú"]').click();

      cy.get('[role="dialog"] a[href="/movimientos"]').should(
        'have.attr',
        'aria-current',
        'page'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.get('nav[aria-label*="Navegación"]').should('exist');
      cy.get('button[aria-label*="menú"]').should('have.attr', 'aria-expanded');
    });

    it('should support keyboard navigation', () => {
      cy.viewport(1280, 720);

      // Focus on first navigation link
      cy.get('header nav a').first().focus();
      cy.focused().should('contain', 'Inicio');

      // Tab to next link (Movimientos)
      cy.focused().type('{tab}');
      cy.focused().should('contain', 'Movimientos');

      // Press Enter to navigate
      cy.focused().type('{enter}');
      cy.url().should('include', '/movimientos');
    });

    it('should have proper modal attributes in mobile menu', () => {
      cy.viewport(375, 667);
      cy.get('button[aria-label*="menú"]').click();

      cy.get('[role="dialog"]').should('have.attr', 'aria-modal', 'true');
      cy.get('[role="dialog"]').should('have.attr', 'aria-label');
    });
  });
});
