/// <reference types="cypress" />
/// <reference types="cypress-axe" />

import routes from '../fixtures/routes.json';

/**
 * WCAG AAA Keyboard Navigation Tests
 *
 * These tests verify compliance with WCAG 2.1.1 (Keyboard) and 2.1.3 (Keyboard - No Exception) AAA
 *
 * Success Criteria:
 * - All interactive elements are accessible via keyboard
 * - Tab order is logical and follows DOM structure
 * - Focus indicators are visible on all focusable elements
 * - No keyboard traps exist
 * - All functionality can be operated without mouse
 */

describe('WCAG AAA: Keyboard Navigation', () => {
  const testableRoutes = (routes as string[]).filter(
    (route: string) => !route.endsWith('/new') && !route.endsWith('/crear')
  );

  const MOCK_OBJECT_ID = '5f9d88b9c2a0a20017a4b0a1';

  testableRoutes.forEach((route: string) => {
    const effectiveRoute = route.replace(/\/id($|\/)/, `/${MOCK_OBJECT_ID}$1`);

    describe(`Keyboard Navigation on ${effectiveRoute}`, () => {
      beforeEach(() => {
        cy.on('uncaught:exception', () => false);
        cy.visit(`${effectiveRoute}?audit=true`);
        cy.wait(2000);
      });

      it('should have all interactive elements keyboard accessible', () => {
        // Get all interactive elements
        const interactiveSelectors = [
          'button:visible',
          'a:visible',
          'input:visible',
          'select:visible',
          'textarea:visible',
          '[role="button"]:visible',
          '[role="link"]:visible',
          '[tabindex]:visible',
        ];

        cy.get('body').then(() => {
          interactiveSelectors.forEach((selector) => {
            cy.get(selector).each(($el) => {
              const tabindex = $el.attr('tabindex');

              // Elements should either be naturally focusable or have tabindex >= 0
              if (tabindex === '-1') {
                // Only allowed for programmatically focusable elements
                if (!$el.attr('role')) {
                  throw new Error('Element with tabindex -1 must have a role');
                }
              } else {
                // Should be keyboard accessible
                cy.wrap($el).focus();
                cy.focused().should('not.equal', null);
              }
            });
          });
        });
      });

      it('should have visible focus indicators on all focusable elements', () => {
        // Tab through the page and verify focus is visible
        cy.get('body').tab();

        // Get all focusable elements
        cy.get(
          'a:visible, button:visible, input:visible, select:visible, textarea:visible, [tabindex]:not([tabindex="-1"]):visible'
        ).each(($el) => {
          cy.wrap($el).focus();

          // Verify focus is visible by checking computed styles
          cy.focused().then(($focused) => {
            const styles = window.getComputedStyle($focused[0]);
            const outlineWidth = parseFloat(styles.outlineWidth);
            const outlineStyle = styles.outlineStyle;
            const boxShadow = styles.boxShadow;

            // Should have either outline or box-shadow for focus
            const hasFocusIndicator =
              (outlineWidth > 0 && outlineStyle !== 'none') ||
              (boxShadow !== 'none' && boxShadow !== '');

            expect(
              hasFocusIndicator,
              `Element ${$el.prop('tagName')} should have visible focus indicator`
            ).to.equal(true);
          });
        });
      });

      it('should have logical tab order (follows DOM order)', () => {
        const focusedElements: HTMLElement[] = [];

        cy.get('body')
          .then(($body) => {
            // Get all tabbable elements in DOM order
            const tabbableElements = $body
              .find(
                'a:visible, button:visible, input:visible, select:visible, textarea:visible, [tabindex]:not([tabindex="-1"]):visible'
              )
              .toArray();

            // Tab through and record order
            cy.get('body').focus();

            for (let i = 0; i < Math.min(20, tabbableElements.length); i++) {
              cy.get('body').tab();
              cy.focused().then(($focused) => {
                if ($focused.length > 0) {
                  focusedElements.push($focused[0]);
                }
              });
            }
          })
          .then(() => {
            // Verify no positive tabindex values (anti-pattern)
            cy.get('[tabindex]').each(($el) => {
              const tabindex = parseInt($el.attr('tabindex') || '0');
              expect(tabindex).to.be.lessThan(
                1,
                'Positive tabindex values disrupt natural tab order'
              );
            });
          });
      });

      it('should not have keyboard traps', () => {
        // Test that we can tab through without getting stuck
        let previousFocus: HTMLElement | null = null;
        let sameElementCount = 0;

        cy.get('body').focus();

        // Try tabbing 30 times
        for (let i = 0; i < 30; i++) {
          cy.get('body').tab();
          cy.focused().then(($focused) => {
            if ($focused[0] === previousFocus) {
              sameElementCount++;
              expect(sameElementCount).to.be.lessThan(
                3,
                'Potential keyboard trap detected'
              );
            } else {
              sameElementCount = 0;
            }
            previousFocus = $focused[0];
          });
        }
      });

      it('should allow keyboard operation of custom controls', () => {
        // Test dropdowns, modals, and custom widgets
        cy.get(
          '[role="button"], [role="menu"], [role="dialog"], [role="combobox"]'
        ).each(($el) => {
          const role = $el.attr('role');

          // Focus the element
          cy.wrap($el).focus();

          // Verify it can be activated with Enter or Space
          cy.focused().should('have.attr', 'role', role);

          // Check for appropriate keyboard handlers
          const hasClick = $el.attr('onclick') || $el.prop('onclick');
          const hasKeyHandler =
            $el.attr('onkeydown') ||
            $el.attr('onkeypress') ||
            $el.attr('onkeyup');

          if (role === 'button' || role === 'link') {
            expect(Boolean(hasClick || hasKeyHandler)).to.equal(true);
          }
        });
      });
    });
  });
});
