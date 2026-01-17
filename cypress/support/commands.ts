/// <reference types="cypress" />
/// <reference types="cypress-axe" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Custom command to check WCAG AAA compliance
     * @example cy.checkA11yAAA()
     */
    checkA11yAAA(): Chainable<void>;
  }
}

// Custom command for WCAG AAA testing
Cypress.Commands.add('checkA11yAAA', () => {
  cy.checkA11y(
    undefined,
    {
      runOnly: {
        type: 'tag',
        values: ['wcag2aaa', 'wcag21aaa', 'wcag22aaa', 'best-practice'],
      },
    },
    (violations) => {
      if (violations.length) {
        const violationData = violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
          help: v.help,
          helpUrl: v.helpUrl,
        }));

        cy.task('log', 'WCAG AAA Violations Found:');
        cy.task('table', violationData);

        throw new Error(
          `${violations.length} WCAG AAA accessibility violation(s) detected`
        );
      }
    }
  );
});

export {};
