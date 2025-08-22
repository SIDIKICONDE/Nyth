// Mock pour react-native-linear-gradient
// Simule le composant LinearGradient pour les tests

const React = require('react');

const LinearGradient = ({ children, colors, style, start, end, ...props }) => {
  // Retourner un composant React Native View avec les styles appropriés
  return React.createElement('LinearGradient', {
    ...props,
    colors,
    style,
    start,
    end,
    children,
  });
};

module.exports = LinearGradient;
