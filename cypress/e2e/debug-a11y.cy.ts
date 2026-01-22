/// <reference types="cypress" />
/// <reference types="cypress-axe" />

import type { Result } from 'axe-core';
import { COMPREHENSIVE_AAA_OPTIONS } from '../support/axe-rules';

/**
 * Quick debug test to see specific errors
 */

describe('Quick A11y Debug', () => {
  it('should check home page', () => {
    cy.on('uncaught:exception', () => false);
    cy.visit('/?audit=true');
    cy.wait(2000);
    cy.injectAxe();

    cy.checkA11y(
      undefined,
      COMPREHENSIVE_AAA_OPTIONS,
      (violations: Result[]) => {
        if (violations.length) {
          cy.log('=== VIOLATIONS FOUND ===');
          violations.forEach((v: Result) => {
            cy.log(`\n[${v.impact}] ${v.id}`);
            cy.log(`Description: ${v.description}`);
            cy.log(`Help: ${v.helpUrl}`);
            cy.log(
              `WCAG: ${v.tags.filter((t) => t.startsWith('wcag')).join(', ')}`
            );
            cy.log(`Elements affected: ${v.nodes.length}`);
            v.nodes.forEach((n, i) => {
              cy.log(`  ${i + 1}. ${n.target.join(' > ')}`);
              if (n.any.length) {
                cy.log(
                  `     Fix any of: ${n.any.map((a) => a.message).join('; ')}`
                );
              }
              if (n.all.length) {
                cy.log(
                  `     Fix all of: ${n.all.map((a) => a.message).join('; ')}`
                );
              }
            });
          });

          // Don't fail, just log
          cy.log(`Total violations: ${violations.length}`);
        } else {
          cy.log('✓ No violations found!');
        }
      },
      true // Don't fail the test
    );
  });
});
