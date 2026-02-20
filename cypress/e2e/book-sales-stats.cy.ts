describe('Book Sales Statistics', () => {
  beforeEach(() => {
    // Mocking the sales API response
    cy.intercept('GET', '/api/books/*/sales', {
      success: true,
      data: {
        totalSold: 150,
        totalRevenue: 4500000,
        history: Array.from({ length: 12 }, (_, i) => ({
          month: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ][i],
          fullMonth: `2025-${(i + 1).toString().padStart(2, '0')}`,
          quantity: 10 + i,
          revenue: (10 + i) * 30000,
        })),
      },
    }).as('getSalesData');

    // Mocking the book data
    cy.intercept('GET', '/api/books/*', {
      success: true,
      data: {
        _id: 'mock-book-id',
        title: 'Mock Book Title',
        isbn: '1234567890',
        price: 30000,
        authors: [],
        isActive: true,
        publicationDate: '2025-01-01',
      },
    });

    cy.visit('/dashboard/catalog/mock-book-id');
  });

  it('should display the sales analysis section title', () => {
    cy.contains('h2', 'Análisis de Ventas').should('be.visible');
  });

  it('should display correct total sold units', () => {
    cy.contains('Ejemplares Vendidos').should('be.visible');
    cy.contains('150').should('be.visible');
    cy.contains('unds').should('be.visible');
  });

  it('should display the historical sales chart', () => {
    cy.contains('Histórico de Ventas (12 meses)').should('be.visible');
    cy.get('.recharts-responsive-container').should('be.visible');
    cy.get('.recharts-area').should('have.length.at.least', 1);
  });
});
