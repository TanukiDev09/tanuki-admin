import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  {
    plugins: {
      sonarjs,
    },
    rules: {
      "sonarjs/cognitive-complexity": ["error", 12],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Config files that use CommonJS
    "*.config.js",
    "jest.setup.js",
    "scripts/**/*.js",
    "_backup/**",
    "cypress/support/commands.ts", // Has namespace declaration
  ]),
]);

export default eslintConfig;
