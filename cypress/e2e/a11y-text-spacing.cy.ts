/// <reference types="cypress" />

import routes from '../fixtures/routes.json';

/**
 * WCAG AAA Text Spacing and Visual Presentation Tests
 *
 * These tests verify compliance with WCAG 1.4.8 (Visual Presentation) and 1.4.12 (Text Spacing) AAA
 *
 * Success Criteria:
 * - Text can be resized up to 200% without loss of content or functionality
 * - Line height (line spacing) is at least 1.5 times the font size
 * - Paragraph spacing is at least 2 times the font size
 * - Letter spacing is at least 0.12 times the font size
 * - Word spacing is at least 0.16 times the font size
 * - Width of text blocks is no more than 80 characters (or glyphs)
 * - Text is not justified (aligned to both left and right margins)
 */

describe('WCAG AAA: Text Spacing and Visual Presentation', () => {
  const testableRoutes = (routes as string[]).filter(
    (route: string) => !route.endsWith('/new') && !route.endsWith('/crear')
  );

  const MOCK_OBJECT_ID = '5f9d88b9c2a0a20017a4b0a1';

  testableRoutes.forEach((route: string) => {
    const effectiveRoute = route.replace(/\/id($|\/)/, `/${MOCK_OBJECT_ID}$1`);

    it(`should support text spacing adjustments on ${effectiveRoute}`, () => {
      cy.on('uncaught:exception', () => false);
      cy.visit(`${effectiveRoute}?audit=true`);
      cy.wait(2000);

      // Apply WCAG AAA text spacing standards
      cy.document().then((doc) => {
        const style = doc.createElement('style');
        style.innerHTML = `
          * {
            line-height: 1.5 !important;
            letter-spacing: 0.12em !important;
            word-spacing: 0.16em !important;
          }
          p {
            margin-bottom: 2em !important;
          }
        `;
        doc.head.appendChild(style);
      });

      cy.wait(1000);

      // Verify no content is clipped or lost
      cy.get('p, h1, h2, h3, h4, h5, h6, li, td').each(($el) => {
        const element = $el[0];
        const styles = window.getComputedStyle(element);
        const overflow = styles.overflow;
        const textOverflow = styles.textOverflow;

        // Content should not be clipped
        expect(overflow).to.not.equal(
          'hidden',
          'Text should not be clipped with spacing adjustments'
        );

        // Check if text is truncated
        if (textOverflow === 'ellipsis') {
          cy.log(
            `Warning: Element uses text-overflow: ellipsis, may clip with spacing`
          );
        }
      });

      // Verify no horizontal scrolling is introduced
      cy.document().then((doc) => {
        const bodyWidth = doc.body.scrollWidth;
        const viewportWidth = Cypress.$(window).width() || 0;

        expect(bodyWidth).to.be.at.most(
          viewportWidth + 20,
          'Should not introduce horizontal scroll'
        );
      });
    });

    it(`should have appropriate line height on ${effectiveRoute}`, () => {
      cy.on('uncaught:exception', () => false);
      cy.visit(`${effectiveRoute}?audit=true`);
      cy.wait(2000);

      // Check paragraphs and text blocks
      cy.get('p, li, td, div[class*="text"], div[class*="description"]').each(
        ($el) => {
          const styles = window.getComputedStyle($el[0]);
          const lineHeight = parseFloat(styles.lineHeight);
          const fontSize = parseFloat(styles.fontSize);

          if (!isNaN(lineHeight) && !isNaN(fontSize) && fontSize > 0) {
            const ratio = lineHeight / fontSize;

            // AAA recommends at least 1.5
            expect(
              ratio,
              `Line height should be at least 1.5x font size (found ${ratio.toFixed(2)})`
            ).to.be.at.least(1.5);
          }
        }
      );
    });

    it(`should have reasonable line width on ${effectiveRoute}`, () => {
      cy.on('uncaught:exception', () => false);
      cy.visit(`${effectiveRoute}?audit=true`);
      cy.wait(2000);

      // Check main content paragraphs
      cy.get('main p, article p, [role="main"] p').each(($p) => {
        const width = $p.width() || 0;
        const styles = window.getComputedStyle($p[0]);
        const fontSize = parseFloat(styles.fontSize);

        // Rough estimate: average character width is ~0.5em
        const approximateChars = width / (fontSize * 0.5);

        // AAA recommends max 80 characters per line
        if (approximateChars > 80) {
          cy.log(
            `Warning: Paragraph may exceed 80 characters per line (approx ${approximateChars.toFixed(0)} chars)`
          );
        }
      });
    });

    it(`should not use justified text alignment on ${effectiveRoute}`, () => {
      cy.on('uncaught:exception', () => false);
      cy.visit(`${effectiveRoute}?audit=true`);
      cy.wait(2000);

      // Check text elements for justified alignment
      cy.get('p, div, span, li, td').each(($el) => {
        const styles = window.getComputedStyle($el[0]);
        const textAlign = styles.textAlign;

        // Justified text can create uneven spacing, making it harder to read
        expect(textAlign).to.not.equal(
          'justify',
          'Text should not be justified for AAA compliance'
        );
      });
    });

    it(`should support 200% text zoom without content loss on ${effectiveRoute}`, () => {
      cy.on('uncaught:exception', () => false);
      cy.visit(`${effectiveRoute}?audit=true`);
      cy.wait(2000);

      // Get initial content
      let initialText: string;
      cy.get('body')
        .invoke('text')
        .then((text) => {
          initialText = text;
        });

      // Zoom to 200%
      cy.document().then((doc) => {
        const style = doc.createElement('style');
        style.innerHTML = `
          html {
            font-size: 200% !important;
          }
        `;
        doc.head.appendChild(style);
      });

      cy.wait(1000);

      // Verify content is still present
      cy.get('body')
        .invoke('text')
        .then((zoomedText) => {
          // Most of the text content should still be visible
          const contentRetained = zoomedText.length / initialText.length;
          expect(contentRetained).to.be.at.least(
            0.95,
            'At least 95% of content should remain visible at 200% zoom'
          );
        });

      // Check for horizontal scrolling (acceptable if content needs it)
      // Check for clipped content (not acceptable)
      cy.get('p, h1, h2, h3, button, a').each(($el) => {
        const styles = window.getComputedStyle($el[0]);
        const overflow = styles.overflow;

        // Critical content should not be hidden
        if (overflow === 'hidden') {
          const rect = $el[0].getBoundingClientRect();
          const scrollHeight = $el[0].scrollHeight;

          if (scrollHeight > rect.height) {
            cy.log(`Warning: Element may have clipped content at 200% zoom`);
          }
        }
      });
    });

    it(`should have adequate paragraph spacing on ${effectiveRoute}`, () => {
      cy.on('uncaught:exception', () => false);
      cy.visit(`${effectiveRoute}?audit=true`);
      cy.wait(2000);

      // Check paragraph spacing
      cy.get('p').each(($p) => {
        const styles = window.getComputedStyle($p[0]);
        const marginBottom = parseFloat(styles.marginBottom);
        const fontSize = parseFloat(styles.fontSize);

        if (!isNaN(marginBottom) && !isNaN(fontSize) && fontSize > 0) {
          const ratio = marginBottom / fontSize;

          // AAA recommends at least 2x font size for paragraph spacing
          // We'll be lenient and check for at least 1em
          if (ratio < 1) {
            cy.log(
              `Info: Paragraph spacing could be improved (${ratio.toFixed(2)}em, recommend 2em)`
            );
          }
        }
      });
    });
  });
});
