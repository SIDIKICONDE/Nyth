module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Désactiver la détection des expressions dans les styles inline
    'react-native/no-inline-styles': 'off',
    // Désactiver la détection d'expressions complexes dans les styles
    'no-template-curly-in-string': 'off',
  },
};
