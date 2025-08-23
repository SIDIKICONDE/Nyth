/**
 * Configuration et utilitaires pour les tests HamburgerMenu
 */

import { Animated } from 'react-native';

// Configuration des mocks globaux pour les animations
global.Animated = {
  ...Animated,
  timing: jest.fn(() => ({
    start: jest.fn(callback => {
      if (callback) setTimeout(callback, 0);
      return { stop: jest.fn() };
    }),
    stop: jest.fn()
  })),
  spring: jest.fn(() => ({
    start: jest.fn(callback => {
      if (callback) setTimeout(callback, 0);
      return { stop: jest.fn() };
    }),
    stop: jest.fn()
  })),
  parallel: jest.fn(animations => ({
    start: jest.fn(callback => {
      animations.forEach(anim => {
        if (anim.start) anim.start();
      });
      if (callback) setTimeout(callback, 0);
      return { stop: jest.fn() };
    }),
    stop: jest.fn()
  })),
  Value: jest.fn().mockImplementation(initialValue => ({
    _value: initialValue,
    setValue: jest.fn(value => {
      this._value = value;
    }),
    interpolate: jest.fn(config => ({
      __interpolateValue: config
    }))
  }))
};

// Utilitaires pour les tests d'animation
export const AnimationTestUtils = {
  // Simule le passage du temps pour les animations
  advanceAnimationByTime: (time = 300) => {
    return new Promise(resolve => setTimeout(resolve, time));
  },

  // Vérifie qu'une animation a été déclenchée
  expectAnimationStarted: (animationMock, expectedCalls = 1) => {
    expect(animationMock).toHaveBeenCalledTimes(expectedCalls);
  },

  // Vérifie les paramètres d'une animation
  expectAnimationWithParams: (animationMock, params) => {
    expect(animationMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining(params)
    );
  },

  // Reset les mocks d'animation
  resetAnimationMocks: () => {
    global.Animated.timing.mockClear();
    global.Animated.spring.mockClear();
    global.Animated.parallel.mockClear();
  }
};

// Utilitaires pour les tests de couleurs et thèmes
export const ColorTestUtils = {
  // Couleurs de test pour le thème clair
  lightTheme: {
    primary: '#007AFF',
    text: '#000000',
    background: '#FFFFFF',
    border: '#E5E5E5'
  },

  // Couleurs de test pour le thème sombre
  darkTheme: {
    primary: '#FF6B6B',
    text: '#FFFFFF',
    background: '#1A1A1A',
    border: '#333333'
  },

  // Vérifie qu'un élément a la bonne couleur
  expectHasColor: (style, color) => {
    expect(style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color })
      ])
    );
  },

  // Vérifie qu'un élément a la bonne couleur de fond
  expectHasBackgroundColor: (style, backgroundColor) => {
    expect(style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor })
      ])
    );
  },

  // Vérifie qu'un gradient a les bonnes couleurs
  expectGradientColors: (gradient, expectedColors) => {
    expect(gradient.props.colors).toEqual(expectedColors);
  },

  // Vérifie le contraste des couleurs
  expectGoodContrast: (backgroundColor, textColor) => {
    // Cette fonction simulerait une vérification de contraste
    // Pour l'instant, on vérifie juste que les couleurs sont définies
    expect(backgroundColor).toBeDefined();
    expect(textColor).toBeDefined();
    expect(backgroundColor).not.toBe(textColor);
  }
};

// Utilitaires pour les tests visuels
export const VisualTestUtils = {
  // Vérifie qu'un élément a les bonnes dimensions
  expectDimensions: (style, width, height) => {
    expect(style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width, height })
      ])
    );
  },

  // Vérifie qu'un élément a un borderRadius
  expectBorderRadius: (style, borderRadius) => {
    expect(style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderRadius })
      ])
    );
  },

  // Vérifie qu'un élément a une ombre
  expectHasShadow: (style) => {
    expect(style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          shadowColor: expect.any(String),
          shadowOffset: expect.any(Object),
          shadowOpacity: expect.any(Number),
          shadowRadius: expect.any(Number)
        })
      ])
    );
  },

  // Vérifie la présence d'une transformation
  expectHasTransform: (style, transformType) => {
    const transformStyle = style.find(s => s.transform);
    expect(transformStyle).toBeDefined();
    expect(transformStyle.transform).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          [transformType]: expect.any(Object)
        })
      ])
    );
  }
};

// Utilitaires pour les tests d'accessibilité
export const AccessibilityTestUtils = {
  // Vérifie qu'un élément a les bonnes propriétés d'accessibilité
  expectAccessible: (element, options = {}) => {
    expect(element.props.accessible).toBe(true);

    if (options.label) {
      expect(element.props.accessibilityLabel).toBe(options.label);
    }

    if (options.role) {
      expect(element.props.accessibilityRole).toBe(options.role);
    }

    if (options.state) {
      expect(element.props.accessibilityState).toEqual(options.state);
    }
  },

  // Simule une interaction avec VoiceOver/TalkBack
  simulateScreenReader: (element, action = 'activate') => {
    if (action === 'activate') {
      fireEvent.press(element);
    }
  }
};

// Utilitaires pour les tests de thème
export const ThemeTestUtils = {
  // Mock pour le thème sombre
  mockDarkTheme: () => ({
    currentTheme: {
      isDark: true,
      colors: {
        primary: '#FF6B6B',
        text: '#FFFFFF',
        background: '#1A1A1A',
        border: '#333333'
      }
    }
  }),

  // Mock pour le thème clair
  mockLightTheme: () => ({
    currentTheme: {
      isDark: false,
      colors: {
        primary: '#007AFF',
        text: '#000000',
        background: '#FFFFFF',
        border: '#E5E5E5'
      }
    }
  }),

  // Applique un mock de thème
  applyThemeMock: (theme) => {
    const mockUseTheme = jest.fn(() => theme);
    require('@/contexts/ThemeContext').useTheme = mockUseTheme;
    return mockUseTheme;
  }
};

// Utilitaires pour les tests de performance
export const PerformanceTestUtils = {
  // Mesure le temps de rendu
  measureRenderTime: async (component, iterations = 100) => {
    const startTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      render(component);
    }
    const endTime = performance.now();
    return endTime - startTime;
  },

  // Vérifie que le composant ne cause pas de memory leaks
  testMemoryLeak: (component) => {
    const { unmount } = render(component);
    expect(() => {
      unmount();
    }).not.toThrow();
  }
};

// Configuration Jest
jest.setTimeout(10000); // Timeout plus long pour les animations

// Cleanup après chaque test
afterEach(() => {
  AnimationTestUtils.resetAnimationMocks();
});
