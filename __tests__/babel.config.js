/**
 * Configuration Babel pour les tests Jest
 * Configuration optimisée pour React Native et TypeScript
 */

module.exports = {
  presets: [
    '@react-native/babel-preset',
    '@babel/preset-typescript',
  ],

  plugins: [
    // Support des modules ES6+ pour les tests
    '@babel/plugin-transform-modules-commonjs',

    // Support des syntaxes modernes
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-private-property-in-object',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-logical-assignment-operators',

    // Support de React Native
    [
      '@babel/plugin-transform-runtime',
      {
        helpers: false,
        regenerator: true,
      },
    ],

    // Support des imports dynamiques
    '@babel/plugin-syntax-dynamic-import',

    // Plugin pour les tests
    [
      'babel-plugin-module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@contexts': './src/contexts',
          '@utils': './src/utils',
          '@types': './src/types',
          '@constants': './src/constants',
        },
      },
    ],
  ],

  env: {
    test: {
      plugins: [
        // Plugins spécifiques aux tests
        '@babel/plugin-transform-runtime',

        // Mock automatique des images et assets
        [
          'babel-plugin-transform-inline-environment-variables',
          {
            include: ['NODE_ENV', 'JEST_WORKER_ID'],
          },
        ],
      ],
    },
  },

  // Configuration des sources
  sourceMaps: 'inline',

  // Ignore les fichiers node_modules sauf ceux nécessaires
  ignore: [
    'node_modules/**',
  ],
};
