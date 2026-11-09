import baseConfig from './config/eslint.config.mjs';

const config = [
  {
    ignores: [
      'debug_db.js',
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      // Copias de trabajo de agentes: no forman parte del código del proyecto
      '.claude/**',
      '.agent/**',
      '.agents/**',
    ],
  },
  ...baseConfig,
];

export default config;
