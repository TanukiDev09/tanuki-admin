import baseConfig from './config/eslint.config.mjs';

const config = [
  {
    ignores: [
      'debug_db.js',
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
    ],
  },
  ...baseConfig,
];

export default config;
