import "./commands";
import "cypress-axe";

// Load axe-core before each test
beforeEach(() => {
  cy.injectAxe();
});
