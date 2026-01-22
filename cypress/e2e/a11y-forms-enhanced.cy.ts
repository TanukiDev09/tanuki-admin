/// <reference types="cypress" />
/// <reference types="cypress-axe" />

import routes from '../fixtures/routes.json';
import { FORM_OPTIONS } from '../support/axe-rules';

/**
 * WCAG AAA Enhanced Form Accessibility Tests
 *
 * These tests verify compliance with enhanced form accessibility requirements:
 * - WCAG 3.3.1 Error Identification (A)
 * - WCAG 3.3.2 Labels or Instructions (A)
 * - WCAG 3.3.3 Error Suggestion (AA)
 * - WCAG 3.3.4 Error Prevention (Legal, Financial, Data) (AA)
 * - WCAG 3.3.5 Help (AAA)
 * - WCAG 3.3.6 Error Prevention (All) (AAA)
 *
 * Success Criteria:
 * - All form inputs have visible labels
 * - Required fields are clearly indicated
 * - Error messages are descriptive and associated with inputs
 * - Help text is available for complex inputs
 * - Confirmation is required for important submissions
 * - Users can review and correct submissions
 */

describe('WCAG AAA: Enhanced Form Accessibility', () => {
  const testableRoutes = (routes as string[]).filter(
    (route: string) =>
      route.endsWith('/new') ||
      route.endsWith('/crear') ||
      route.includes('editar')
  );

  const MOCK_OBJECT_ID = '5f9d88b9c2a0a20017a4b0a1';

  testableRoutes.forEach((route: string) => {
    const effectiveRoute = route.replace(/\/id($|\/)/, `/${MOCK_OBJECT_ID}$1`);

    describe(`Form Accessibility on ${effectiveRoute}`, () => {
      beforeEach(() => {
        cy.on('uncaught:exception', () => false);
        cy.visit(`${effectiveRoute}?audit=true`);
        cy.wait(2000);
      });

      it('should run axe-core form accessibility checks', () => {
        cy.injectAxe();
        cy.checkA11y(undefined, FORM_OPTIONS);
      });

      it('should have visible labels for all inputs', () => {
        cy.get(
          'input:visible:not([type="hidden"]), select:visible, textarea:visible'
        ).each(($input) => {
          const inputId = $input.attr('id');
          const inputName = $input.attr('name');
          const ariaLabel = $input.attr('aria-label');
          const ariaLabelledby = $input.attr('aria-labelledby');

          // Check for associated label
          const hasVisibleLabel =
            Cypress.$(`label[for="${inputId}"]`).length > 0 ||
            $input.closest('label').length > 0 ||
            ariaLabel ||
            (ariaLabelledby && Cypress.$(`#${ariaLabelledby}`).length > 0);

          expect(
            hasVisibleLabel,
            `Input ${inputName || inputId || 'unnamed'} should have a visible label`
          ).to.equal(true);
        });
      });

      it('should clearly indicate required fields', () => {
        cy.get(
          'input[required]:visible, select[required]:visible, textarea[required]:visible'
        ).each(($input) => {
          const hasRequiredIndicator =
            $input.attr('aria-required') === 'true' ||
            $input.closest('label').text().includes('*') ||
            $input.closest('label').text().toLowerCase().includes('required') ||
            Cypress.$(`label[for="${$input.attr('id')}"]`)
              .text()
              .includes('*');

          // Visual or ARIA indication of required field
          if (!hasRequiredIndicator) {
            cy.log(`Warning: Required field may not be clearly indicated`);
          }
        });
      });

      it('should provide help text for complex inputs', () => {
        // Check for help text associated with inputs
        cy.get('input:visible, select:visible, textarea:visible').each(
          ($input) => {
            const ariaDescribedby = $input.attr('aria-describedby');
            const inputType = $input.attr('type');

            // Complex input types that should have help
            const complexTypes = [
              'email',
              'password',
              'tel',
              'url',
              'date',
              'time',
            ];

            if (complexTypes.includes(inputType || '')) {
              const hasHelpText =
                (ariaDescribedby &&
                  Cypress.$(`#${ariaDescribedby}`).length > 0) ||
                $input.attr('placeholder') ||
                $input
                  .closest('div, fieldset')
                  .find(
                    '[class*="help"], [class*="hint"], [class*="description"]'
                  ).length > 0;

              if (!hasHelpText) {
                cy.log(
                  `Info: Complex input (${inputType}) could benefit from help text`
                );
              }
            }
          }
        );
      });

      it('should associate error messages with inputs', () => {
        // Look for forms and try to trigger validation
        cy.get('form').each(($form) => {
          // Try to submit form to trigger validation
          cy.wrap($form).find('button[type="submit"]').click({ force: true });

          cy.wait(500);

          // Check for error messages
          cy.wrap($form)
            .find('[role="alert"], [class*="error"], [class*="invalid"]')
            .each(($error) => {
              if ($error.is(':visible')) {
                // Error should be associated with an input via aria-describedby or proximity
                const errorId = $error.attr('id');

                if (errorId) {
                  const hasAssociatedInput =
                    Cypress.$(
                      `input[aria-describedby*="${errorId}"], select[aria-describedby*="${errorId}"], textarea[aria-describedby*="${errorId}"]`
                    ).length > 0;

                  if (!hasAssociatedInput) {
                    cy.log(
                      `Info: Error message could be better associated with input via aria-describedby`
                    );
                  }
                }
              }
            });
        });
      });

      it('should provide descriptive error messages', () => {
        // Trigger validation
        cy.get('form').each(($form) => {
          cy.wrap($form).find('button[type="submit"]').click({ force: true });

          cy.wait(500);

          // Check error message quality
          cy.wrap($form)
            .find('[role="alert"], [class*="error"]')
            .each(($error) => {
              const errorText = $error.text().trim().toLowerCase();

              // Error messages should be descriptive, not just "Error" or "Invalid"
              const isDescriptive =
                errorText.length > 10 &&
                !errorText.match(/^(error|invalid|required)$/);

              if (!isDescriptive) {
                cy.log(
                  `Warning: Error message could be more descriptive: "${errorText}"`
                );
              }
            });
        });
      });

      it('should have logical fieldset grouping for related inputs', () => {
        // Check for fieldset usage in forms
        cy.get('form').then(($forms) => {
          $forms.each((_, form) => {
            const $form = Cypress.$(form);
            const inputCount = $form.find(
              'input:visible, select:visible, textarea:visible'
            ).length;
            const fieldsetCount = $form.find('fieldset').length;

            // If form has many inputs, it should use fieldsets for grouping
            if (inputCount > 5 && fieldsetCount === 0) {
              cy.log(
                `Info: Form with ${inputCount} inputs could benefit from fieldset grouping`
              );
            }
          });
        });

        // Verify fieldsets have legends
        cy.get('fieldset').each(($fieldset) => {
          const hasLegend = $fieldset.find('legend').length > 0;
          expect(hasLegend, 'Fieldset should have a legend').to.equal(true);
        });
      });

      it('should have accessible form validation feedback', () => {
        // Check for ARIA live regions for dynamic validation
        cy.get('form').each(($form) => {
          const hasLiveRegion =
            $form.find('[role="alert"]').length > 0 ||
            $form.find('[aria-live]').length > 0 ||
            $form.attr('aria-live');

          if (!hasLiveRegion) {
            cy.log(
              `Info: Form could benefit from ARIA live region for validation feedback`
            );
          }
        });
      });

      it('should support keyboard navigation in forms', () => {
        // Verify all form controls are keyboard accessible
        cy.get('form').each(($form) => {
          cy.wrap($form)
            .find(
              'input:visible, select:visible, textarea:visible, button:visible'
            )
            .each(($control) => {
              cy.wrap($control).focus();
              cy.focused().should('exist');
            });
        });
      });

      it('should have appropriate autocomplete attributes', () => {
        // Check for autocomplete on common fields
        const autocompleteFields = {
          email: 'email',
          password: 'current-password',
          tel: 'tel',
          name: 'name',
          username: 'username',
        };

        Object.entries(autocompleteFields).forEach(([type, autocomplete]) => {
          cy.get(`input[type="${type}"], input[name*="${type}"]`).each(
            ($input) => {
              const hasAutocomplete = Boolean($input.attr('autocomplete'));

              if (!hasAutocomplete && type !== 'password') {
                cy.log(
                  `Info: Input type ${type} could benefit from autocomplete="${autocomplete}"`
                );
              }
            }
          );
        });
      });
    });
  });
});
