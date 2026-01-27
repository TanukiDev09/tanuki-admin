/// <reference types="cypress" />
/// <reference types="cypress-axe" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Custom command to check WCAG AAA compliance
     * @example cy.checkA11yAAA()
     */
    checkA11yAAA(): Chainable<void>;

    /**
     * Custom command to check target sizes (WCAG 2.5.5 AAA)
     * @example cy.checkTargetSize()
     */
    checkTargetSize(): Chainable<void>;

    /**
     * Custom command to check keyboard navigation
     * @example cy.checkKeyboardNavigation()
     */
    checkKeyboardNavigation(): Chainable<void>;

    /**
     * Custom command to check text spacing
     * @example cy.checkTextSpacing()
     */
    checkTextSpacing(): Chainable<void>;

    /**
     * Custom command to check link descriptiveness (WCAG 2.4.9 AAA)
     * @example cy.checkLinkDescriptiveness()
     */
    checkLinkDescriptiveness(): Chainable<void>;
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

// Custom command for target size verification
Cypress.Commands.add('checkTargetSize', () => {
  const MIN_SIZE = 44;

  cy.get('button:visible, a:visible').each(($el) => {
    const rect = $el[0].getBoundingClientRect();
    const isInlineLink = $el.is('a') && $el.closest('p, li').length > 0;

    if (!isInlineLink) {
      expect(rect.width).to.be.at.least(
        MIN_SIZE,
        `Element should be at least ${MIN_SIZE}px wide`
      );
      expect(rect.height).to.be.at.least(
        MIN_SIZE,
        `Element should be at least ${MIN_SIZE}px tall`
      );
    }
  });
});

// Custom command for keyboard navigation verification
Cypress.Commands.add('checkKeyboardNavigation', () => {
  cy.get('a:visible, button:visible, input:visible, select:visible').each(
    ($el) => {
      cy.wrap($el).focus();
      cy.focused().should('exist');
    }
  );
});

// Custom command for text spacing verification
Cypress.Commands.add('checkTextSpacing', () => {
  cy.get('p, li, h1, h2, h3').each(($el) => {
    const styles = window.getComputedStyle($el[0]);
    const lineHeight = parseFloat(styles.lineHeight);
    const fontSize = parseFloat(styles.fontSize);

    if (!isNaN(lineHeight) && !isNaN(fontSize) && fontSize > 0) {
      const ratio = lineHeight / fontSize;
      expect(ratio).to.be.at.least(
        1.5,
        'Line height should be at least 1.5x font size'
      );
    }
  });
});

// Custom command for link descriptiveness check
Cypress.Commands.add('checkLinkDescriptiveness', () => {
  const vagueTerms = ['click here', 'read more', 'more', 'link', 'here'];

  cy.get('a:visible').each(($link) => {
    const text = $link.text().trim().toLowerCase();
    const isVague = vagueTerms.includes(text);

    if (isVague) {
      cy.log(`Warning: Vague link text detected: "${text}"`);
    }
  });
});

export {};
