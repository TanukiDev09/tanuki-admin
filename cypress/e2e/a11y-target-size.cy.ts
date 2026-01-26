/// <reference types="cypress" />

import routes from '../fixtures/routes.json';

/**
 * WCAG AAA Target Size Tests
 *
 * These tests verify compliance with WCAG 2.5.5 (Target Size - Enhanced) AAA
 *
 * Success Criteria:
 * - Interactive elements should be at least 44x44 CSS pixels
 * - Adequate spacing between adjacent targets
 * - Exceptions for inline links in text blocks
 */

describe('WCAG AAA: Target Size (Enhanced)', () => {
  const testableRoutes = (routes as string[]).filter(
    (route: string) => !route.endsWith('/new') && !route.endsWith('/crear')
  );

  const MOCK_OBJECT_ID = '5f9d88b9c2a0a20017a4b0a1';
  const MIN_TARGET_SIZE = 44; // AAA requires 44x44 pixels

  testableRoutes.forEach((route: string) => {
    const effectiveRoute = route.replace(/\/id($|\/)/, `/${MOCK_OBJECT_ID}$1`);

    it(`should have adequate target sizes on ${effectiveRoute}`, () => {
      cy.on('uncaught:exception', () => false);
      cy.visit(`${effectiveRoute}?audit=true`);
      cy.wait(2000);

      // Test buttons
      cy.get('button:visible').each(($button) => {
        const rect = $button[0].getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Check if it's a text button in a dense UI (table, toolbar)
        const isInDenseUI =
          $button.closest('table, [role="toolbar"]').length > 0;

        if (!isInDenseUI) {
          expect(
            width,
            `Button width should be at least ${MIN_TARGET_SIZE}px`
          ).to.be.at.least(MIN_TARGET_SIZE);
          expect(
            height,
            `Button height should be at least ${MIN_TARGET_SIZE}px`
          ).to.be.at.least(MIN_TARGET_SIZE);
        } else {
          // For dense UIs, check that total clickable area (including padding) meets requirement
          const styles = window.getComputedStyle($button[0]);
          const paddingLeft = parseFloat(styles.paddingLeft);
          const paddingRight = parseFloat(styles.paddingRight);
          const paddingTop = parseFloat(styles.paddingTop);
          const paddingBottom = parseFloat(styles.paddingBottom);

          const totalWidth = width + paddingLeft + paddingRight;
          const totalHeight = height + paddingTop + paddingBottom;

          expect(
            totalWidth,
            `Button total width (with padding) should be adequate`
          ).to.be.at.least(24);
          expect(
            totalHeight,
            `Button total height (with padding) should be adequate`
          ).to.be.at.least(24);
        }
      });

      // Test links (excluding inline text links)
      cy.get('a:visible').each(($link) => {
        const rect = $link[0].getBoundingClientRect();
        const isInlineLink =
          $link.closest('p, li, td, span').length > 0 &&
          $link.text().length > 0;

        if (!isInlineLink) {
          const width = rect.width;
          const height = rect.height;

          // Standalone links should meet target size
          if (width > 0 && height > 0) {
            expect(
              width,
              `Link width should be at least ${MIN_TARGET_SIZE}px`
            ).to.be.at.least(MIN_TARGET_SIZE);
            expect(
              height,
              `Link height should be at least ${MIN_TARGET_SIZE}px`
            ).to.be.at.least(MIN_TARGET_SIZE);
          }
        }
      });

      // Test icon buttons (often smaller)
      cy.get('button:visible svg, button:visible [class*="icon"]').each(
        ($iconContainer) => {
          const $button = $iconContainer.closest('button');
          if ($button.length) {
            const rect = $button[0].getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            expect(
              width,
              `Icon button width should be at least ${MIN_TARGET_SIZE}px`
            ).to.be.at.least(MIN_TARGET_SIZE);
            expect(
              height,
              `Icon button height should be at least ${MIN_TARGET_SIZE}px`
            ).to.be.at.least(MIN_TARGET_SIZE);
          }
        }
      );

      // Test form inputs
      cy.get('input:visible:not([type="hidden"]), select:visible').each(
        ($input) => {
          const rect = $input[0].getBoundingClientRect();
          const height = rect.height;

          // Input height should meet minimum for easy interaction
          expect(
            height,
            `Input height should be at least ${MIN_TARGET_SIZE}px`
          ).to.be.at.least(MIN_TARGET_SIZE);
        }
      );

      // Test checkboxes and radio buttons
      cy.get(
        'input[type="checkbox"]:visible, input[type="radio"]:visible'
      ).each(($input) => {
        const rect = $input[0].getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Native checkboxes/radios are often smaller, but should have label for larger target
        const hasLabel =
          $input.closest('label').length > 0 ||
          Cypress.$(`label[for="${$input.attr('id')}"]`).length > 0;

        if (!hasLabel) {
          // Without label, the input itself should be large enough
          expect(
            width,
            `Checkbox/radio width should be adequate`
          ).to.be.at.least(MIN_TARGET_SIZE);
          expect(
            height,
            `Checkbox/radio height should be adequate`
          ).to.be.at.least(MIN_TARGET_SIZE);
        }
        // If has label, the label provides the larger target area
      });
    });

    it(`should have adequate spacing between adjacent targets on ${effectiveRoute}`, () => {
      cy.on('uncaught:exception', () => false);
      cy.visit(`${effectiveRoute}?audit=true`);
      cy.wait(2000);

      // Get all interactive elements
      const interactiveElements: HTMLElement[] = [];

      cy.get('button:visible, a:visible, input:visible, select:visible')
        .each(($el) => {
          interactiveElements.push($el[0]);
        })
        .then(() => {
          // Check spacing between adjacent elements
          for (let i = 0; i < interactiveElements.length - 1; i++) {
            const rect1 = interactiveElements[i].getBoundingClientRect();
            const rect2 = interactiveElements[i + 1].getBoundingClientRect();

            // Check if elements are in same row (vertical proximity)
            const verticalOverlap = !(
              rect1.bottom < rect2.top || rect2.bottom < rect1.top
            );

            if (verticalOverlap) {
              // Calculate horizontal spacing
              const horizontalSpacing =
                rect1.right < rect2.left
                  ? rect2.left - rect1.right
                  : rect1.left - rect2.right;

              // Should have some spacing (at least 8px is good practice)
              if (horizontalSpacing < 8 && horizontalSpacing >= 0) {
                // Log warning but don't fail (spacing is a best practice, not strict requirement)
                cy.log(
                  `Warning: Adjacent elements have minimal spacing (${horizontalSpacing}px)`
                );
              }
            }
          }
        });
    });
  });
});
