const fs = require('fs');
const path = require('path');

/**
 * Discovers all routes in the Next.js app by analyzing the app directory structure
 * This remains dynamic as the app grows
 */
function discoverRoutes() {
  const appDir = path.join(__dirname, '../../src/app');
  const routes = [];

  function traverseDirectory(dir, currentPath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip special Next.js directories
        if (
          entry.name.startsWith('_') ||
          entry.name.startsWith('.') ||
          entry.name === 'api'
        ) {
          continue;
        }

        // Dynamic routes are included
        const routePath = currentPath + '/' + entry.name.replace(/\[|\]/g, '');
        traverseDirectory(fullPath, routePath);
      } else if (entry.name === 'page.tsx' || entry.name === 'page.js') {
        // Found a page - add the route
        const route = currentPath || '/';
        if (!routes.includes(route)) {
          routes.push(route);
        }
      }
    }
  }

  traverseDirectory(appDir);

  // Ensure root route is included
  if (!routes.includes('/')) {
    routes.unshift('/');
  }

  return routes.sort();
}

// Generate and save routes
const routes = discoverRoutes();
const outputPath = path.join(__dirname, '../../cypress/fixtures/routes.json');

// Ensure fixtures directory exists
const fixturesDir = path.dirname(outputPath);
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(routes, null, 2));

console.log(`Discovered ${routes.length} route(s):`);
routes.forEach((route) => console.log(`   ${route}`));
console.log(`\nSaved to: ${outputPath}`);

module.exports = { discoverRoutes };
