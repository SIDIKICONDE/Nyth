// Mock pour react-native-vector-icons
// Simule les icônes pour les tests

const React = require('react');

const createIconComponent = iconName => {
  return ({ name, size, color, style, ...props }) => {
    return React.createElement(iconName, {
      ...props,
      name,
      size,
      color,
      style,
    });
  };
};

const Ionicons = createIconComponent('Ionicons');
const MaterialIcons = createIconComponent('MaterialIcons');

module.exports = { Ionicons, MaterialIcons };
