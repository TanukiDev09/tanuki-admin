/// <reference types="cypress" />

/**
 * Test para identificar problemas específicos de accesibilidad
 */

describe('Identificar Problemas A11y', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => false);
  });

  it('should identify vague links across all pages', () => {
    const routes = [
      '/',
      '/dashboard',
      '/dashboard/catalog',
      '/dashboard/categories',
    ];

    const vagueTerms = ['click here', 'read more', 'more', 'link', 'here'];
    const allProblematicLinks: Record<string, string[]> = {};

    routes.forEach((route) => {
      cy.visit(route);
      cy.wait(3000);

      const problematicLinks: string[] = [];

      cy.get('body').then(($body) => {
        const links = $body.find('a:visible');
        cy.log(`Route: ${route} - Found ${links.length} visible links`);

        links.each((index, el) => {
          const $link = Cypress.$(el);
          const linkText = $link.text().trim();
          const ariaLabel = $link.attr('aria-label') || '';
          const href = $link.attr('href') || '';
          const combinedText = `${linkText} ${ariaLabel}`.toLowerCase();

          const isVague = vagueTerms.some(
            (term) =>
              combinedText === term || combinedText.startsWith(term + ' ')
          );

          if (isVague && linkText.length < 20) {
            const linkInfo = `"${linkText}" -> ${href}`;
            problematicLinks.push(linkInfo);
            cy.log(`❌ Vague link: ${linkInfo}`);
          }
        });

        if (problematicLinks.length > 0) {
          allProblematicLinks[route] = problematicLinks;
        }
      });
    });

    cy.then(() => {
      cy.log('=== SUMMARY OF VAGUE LINKS ===');
      Object.entries(allProblematicLinks).forEach(([route, links]) => {
        cy.log(`\n${route}: ${links.length} problematic links`);
        links.forEach((link) => cy.log(`  - ${link}`));
      });
    });
  });

  it('should identify images with long alt text', () => {
    const routes = ['/', '/dashboard', '/dashboard/catalog'];

    const allProblematicImages: Record<string, string[]> = {};

    routes.forEach((route) => {
      cy.visit(route);
      cy.wait(3000);

      const problematicImages: string[] = [];

      cy.get('body').then(($body) => {
        const images = $body.find('img:visible');
        cy.log(`Route: ${route} - Found ${images.length} visible images`);

        images.each((index, el) => {
          const $img = Cypress.$(el);
          const src = $img.attr('src') || '';
          const alt = $img.attr('alt') || '';
          const wordCount = alt.split(' ').filter((w) => w.length > 0).length;

          if (wordCount > 10) {
            const imgInfo = `${src.substring(0, 60)} (${wordCount} words)`;
            problematicImages.push(imgInfo);
            cy.log(
              `❌ Image with long alt (${wordCount} words): ${src.substring(0, 60)}`
            );
            cy.log(`   Alt: "${alt.substring(0, 100)}..."`);
          }
        });

        if (problematicImages.length > 0) {
          allProblematicImages[route] = problematicImages;
        }
      });
    });

    cy.then(() => {
      cy.log('=== SUMMARY OF IMAGES WITH LONG ALT ===');
      Object.entries(allProblematicImages).forEach(([route, images]) => {
        cy.log(`\n${route}: ${images.length} problematic images`);
        images.forEach((img) => cy.log(`  - ${img}`));
      });
    });
  });
});
