/* eslint-disable @typescript-eslint/no-require-imports */
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
  video: false,
  screenshotOnRunFailure: true,
});
