/// <reference types="cypress" />
/// <reference types="cypress-axe" />

import type { Result } from 'axe-core';

describe('WCAG AAA Accessibility Compliance', () => {
  before(() => {
    // Discover routes before running tests
    cy.exec('npm run discover-routes', { failOnNonZeroExit: false });
  });

  it('should discover at least one route', () => {
    cy.fixture('routes.json').then((routes: string[]) => {
      expect(routes.length).to.be.greaterThan(0);
      cy.log(`Found ${routes.length} route(s) to test`);
    });
  });

  it('should test all routes for WCAG AAA compliance', () => {
    cy.fixture('routes.json').then((routes: string[]) => {
      routes.forEach((route) => {
        cy.log(`Testing route: ${route}`);
        cy.visit(route);
        cy.wait(2000); // Wait for dynamic content
        cy.injectAxe();

        // Run WCAG AAA checks
        cy.checkA11y(
          undefined,
          {
            runOnly: {
              type: 'tag',
              values: ['wcag2aaa', 'wcag21aaa', 'wcag22aaa', 'best-practice'],
            },
          },
          (violations: Result[]) => {
            if (violations.length) {
              const formattedViolations = violations.map((v: Result) => ({
                route,
                rule: v.id,
                impact: v.impact,
                description: v.description,
                nodes: v.nodes.length,
                helpUrl: v.helpUrl,
                elements: v.nodes
                  .map((n: Result['nodes'][0]) => n.target.join(' > '))
                  .join(', '),
              }));

              const errorMessage =
                `\n\nWCAG AAA VIOLATIONS ON ${route}:\n\n` +
                formattedViolations
                  .map(
                    (v: (typeof formattedViolations)[0]) =>
                      `[${v.impact?.toUpperCase()}] ${v.rule}\n` +
                      `  Description: ${v.description}\n` +
                      `  Affected elements (${v.nodes}): ${v.elements}\n` +
                      `  Help: ${v.helpUrl}\n`
                  )
                  .join('\n');

              cy.log(errorMessage);
              throw new Error(errorMessage);
            } else {
              cy.log(`${route} passed WCAG AAA compliance`);
            }
          }
        );
      });
    });
  });
});
