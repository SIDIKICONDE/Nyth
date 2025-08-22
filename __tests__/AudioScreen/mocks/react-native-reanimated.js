// Mock pour react-native-reanimated
// Simule les animations pour les tests

const React = require('react');

// Fonctions d'animation de base
const withSpring = (value, config, callback) => {
  if (callback) callback();
  return value;
};

const withTiming = (value, config, callback) => {
  if (callback) callback();
  return value;
};

const interpolate = (value, inputRange, outputRange) => {
  return value;
};

// Hooks d'animation
const useSharedValue = initialValue => ({
  value: initialValue,
});

const useAnimatedStyle = callback => {
  const style = callback();
  return { style };
};

// Composants animés
const Animated = {
  View: ({ children, style, ...props }) => {
    return React.createElement('AnimatedView', { ...props, style, children });
  },
};

module.exports = {
  ...Animated,
  withSpring,
  withTiming,
  interpolate,
  useSharedValue,
  useAnimatedStyle,
  default: {
    ...Animated,
    withSpring,
    withTiming,
    interpolate,
    useSharedValue,
    useAnimatedStyle,
  },
};
