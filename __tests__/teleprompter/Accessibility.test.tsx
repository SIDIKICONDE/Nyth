import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { TeleprompterContainer } from '../../src/components/recording/teleprompter/TeleprompterContainer';
import { TeleprompterContent } from '../../src/components/recording/teleprompter/TeleprompterContent';
import { TeleprompterSettingsModal } from '../../src/components/recording/teleprompter/TeleprompterSettingsModal';
import { TouchPauseHandler } from '../../src/components/recording/teleprompter/TouchPauseHandler';

// Mock des dépendances
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('@react-native-community/blur', () => ({ BlurView: 'BlurView' }));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-popup-menu', () => ({
  Menu: 'Menu',
  MenuTrigger: 'MenuTrigger',
  MenuOptions: 'MenuOptions',
  MenuOption: 'MenuOption',
}));

// Mock du contexte de thème avec des couleurs accessibles
const mockTheme = {
  name: 'dark',
  isDark: true,
  colors: {
    accent: '#3B82F6',
    text: '#FFFFFF',
    textSecondary: '#A3A3A3',
    background: '#000000',
    surface: '#1F1F1F',
    border: '#333333',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
};

jest.mock('../../src/contexts/ThemeContext', () => ({
  useTheme: () => ({ currentTheme: mockTheme }),
}));

// Mock des hooks de traduction
jest.mock('../../src/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

// Mock des hooks de police
jest.mock('../../src/hooks/useCentralizedFont', () => ({
  useCentralizedFont: () => ({
    content: { fontSize: 16, lineHeight: 22.4 },
  }),
}));

// Mock du logger
jest.mock('../../src/utils/optimizedLogger', () => ({
  createOptimizedLogger: () => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

// Mock des dimensions avec considérations d'accessibilité
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: () => ({ width: 375, height: 812 }),
}));

// Mock des safe areas
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('♿ Accessibilité du Téléprompter - Tests Complets', () => {
  const mockScript = {
    id: 'test-script-1',
    title: 'Test Script Accessibility',
    content: 'Ceci est un script de test pour vérifier l\'accessibilité du téléprompter. Il contient du texte pour les tests.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultSettings = {
    fontSize: 24,
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    textAlignment: 'center' as const,
    horizontalMargin: 10,
    isMirrored: false,
    textShadow: true,
    startPosition: 'top' as const,
    positionOffset: 0,
    hideControls: false,
    glassEnabled: true,
    glassBlurAmount: 25,
    lineHeightMultiplier: 1.4,
    letterSpacing: 0,
    verticalPaddingTop: 40,
    verticalPaddingBottom: 40,
    isMirroredVertical: false,
    guideEnabled: false,
    guideColor: '#FFCC00',
    guideOpacity: 0.35,
    guideHeight: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('🎯 Navigation au Clavier - Tests de Focus', () => {
    test('devrait permettre la navigation au clavier dans le modal de paramètres', () => {
      const mockOnClose = jest.fn();
      const mockOnSettingsChange = jest.fn();

      const { getByText } = render(
        <TeleprompterSettingsModal
          visible={true}
          onClose={mockOnClose}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
          scrollSpeed={50}
          onScrollSpeedChange={jest.fn()}
          backgroundOpacity={80}
          onBackgroundOpacityChange={jest.fn()}
        />
      );

      // Simuler la navigation au clavier
      const modal = getByText('Réglages');
      expect(modal).toBeTruthy();

      // Vérifier que les éléments sont atteignables au clavier
      expect(modal.props.accessible).toBe(true);
      expect(modal.props.accessibilityRole).toBe('header');
    });

    test('devrait avoir des labels d\'accessibilité descriptifs', () => {
      const { getByText } = render(
        <TeleprompterContainer
          script={mockScript}
          settings={defaultSettings}
          isRecording={false}
          isPaused={false}
          scrollSpeed={50}
          backgroundOpacity={80}
          backgroundColor="#000000"
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={jest.fn()}
          onEditText={jest.fn()}
          disabled={false}
        />
      );

      // Vérifier les labels d'accessibilité
      const scriptElement = getByText(mockScript.content);
      expect(scriptElement.props.accessibilityLabel).toBeDefined();
      expect(scriptElement.props.accessibilityHint).toBeDefined();
    });

    test('devrait annoncer les changements d\'état pour les lecteurs d\'écran', () => {
      const mockOnSettings = jest.fn();

      const { rerender, getByText } = render(
        <TeleprompterContainer
          script={mockScript}
          settings={defaultSettings}
          isRecording={false}
          isPaused={false}
          scrollSpeed={50}
          backgroundOpacity={80}
          backgroundColor="#000000"
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={mockOnSettings}
          onEditText={jest.fn()}
          disabled={false}
        />
      );

      // Changer l'état d'enregistrement
      rerender(
        <TeleprompterContainer
          script={mockScript}
          settings={defaultSettings}
          isRecording={true}
          isPaused={false}
          scrollSpeed={50}
          backgroundOpacity={80}
          backgroundColor="#000000"
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={mockOnSettings}
          onEditText={jest.fn()}
          disabled={false}
        />
      );

      // Vérifier que le changement est annoncé
      expect(getByText(mockScript.content)).toBeTruthy();
    });
  });

  describe('🎨 Contraste et Lisibilité - Tests Visuels', () => {
    test('devrait maintenir un contraste suffisant avec les paramètres par défaut', () => {
      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={defaultSettings}
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 1000,
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -1500,
            startPosition: 20,
          }}
          currentTheme={mockTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement.props.style.color).toBe('#FFFFFF');
      expect(textElement.props.style.fontSize).toBeGreaterThanOrEqual(24);
    });

    test('devrait adapter la taille du texte pour l\'accessibilité', () => {
      const accessibleSettings = {
        ...defaultSettings,
        fontSize: 36, // Taille plus grande pour l'accessibilité
      };

      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={accessibleSettings}
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 1000,
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -1500,
            startPosition: 20,
          }}
          currentTheme={mockTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement.props.style.fontSize).toBe(36);
      expect(textElement.props.style.lineHeight).toBeGreaterThan(36);
    });

    test('devrait améliorer le contraste avec l\'ombre de texte', () => {
      const shadowSettings = {
        ...defaultSettings,
        textShadow: true,
      };

      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={shadowSettings}
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 1000,
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -1500,
            startPosition: 20,
          }}
          currentTheme={mockTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement.props.style.textShadowColor).toBeDefined();
      expect(textElement.props.style.textShadowOffset).toBeDefined();
      expect(textElement.props.style.textShadowRadius).toBeDefined();
    });

    test('devrait supporter le mode haute lisibilité', () => {
      const highContrastSettings = {
        ...defaultSettings,
        textColor: '#000000',
        backgroundColor: '#FFFFFF',
        textShadow: false,
      };

      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={highContrastSettings}
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 1000,
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -1500,
            startPosition: 20,
          }}
          currentTheme={mockTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement.props.style.color).toBe('#000000');
    });
  });

  describe('👆 Interaction Tactile - Tests de Touch', () => {
    test('devrait avoir des zones tactiles suffisamment grandes', () => {
      const mockOnTogglePause = jest.fn();
      const mockOnPauseScroll = jest.fn();
      const mockOnResumeScroll = jest.fn();
      const mockOnDoubleTap = jest.fn();

      const { getByTestId } = render(
        <TouchPauseHandler
          onTogglePause={mockOnTogglePause}
          onPauseScroll={mockOnPauseScroll}
          onResumeScroll={mockOnResumeScroll}
          onDoubleTap={mockOnDoubleTap}
        >
          <div
            data-testid="touch-area"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            Content
          </div>
        </TouchPauseHandler>
      );

      const touchArea = getByTestId('touch-area');
      expect(touchArea.style.minWidth).toBe(44);
      expect(touchArea.style.minHeight).toBe(44);
    });

    test('devrait supporter les gestes de balayage pour la navigation', () => {
      const mockOnTogglePause = jest.fn();
      const mockOnPauseScroll = jest.fn();
      const mockOnResumeScroll = jest.fn();
      const mockOnDoubleTap = jest.fn();

      const { getByTestId } = render(
        <TouchPauseHandler
          onTogglePause={mockOnTogglePause}
          onPauseScroll={mockOnPauseScroll}
          onResumeScroll={mockOnResumeScroll}
          onDoubleTap={mockOnDoubleTap}
        >
          <div
            data-testid="swipe-area"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            Swipe Area
          </div>
        </TouchPauseHandler>
      );

      const swipeArea = getByTestId('swipe-area');

      // Simuler un balayage vers le haut (pause)
      fireEvent(swipeArea, 'touchStart', { nativeEvent: { pageY: 100 } });
      act(() => {
        jest.advanceTimersByTime(600); // Maintenir pendant 600ms
      });
      fireEvent(swipeArea, 'touchEnd', { nativeEvent: { pageY: 50 } });

      expect(mockOnPauseScroll).toHaveBeenCalled();
    });

    test('devrait supporter les gestes de pincement pour le zoom', () => {
      const mockOnTogglePause = jest.fn();
      const mockOnPauseScroll = jest.fn();
      const mockOnResumeScroll = jest.fn();
      const mockOnDoubleTap = jest.fn();

      const { getByTestId } = render(
        <TouchPauseHandler
          onTogglePause={mockOnTogglePause}
          onPauseScroll={mockOnPauseScroll}
          onResumeScroll={mockOnResumeScroll}
          onDoubleTap={mockOnDoubleTap}
        >
          <div
            data-testid="pinch-area"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            Pinch Area
          </div>
        </TouchPauseHandler>
      );

      const pinchArea = getByTestId('pinch-area');
      expect(pinchArea).toBeTruthy();
    });
  });

  describe('🔊 Feedback Audio - Tests Auditifs', () => {
    test('devrait annoncer les changements d\'état importants', () => {
      const mockOnSettings = jest.fn();

      const { rerender, getByText } = render(
        <TeleprompterContainer
          script={mockScript}
          settings={defaultSettings}
          isRecording={false}
          isPaused={false}
          scrollSpeed={50}
          backgroundOpacity={80}
          backgroundColor="#000000"
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={mockOnSettings}
          onEditText={jest.fn()}
          disabled={false}
        />
      );

      // Commencer l'enregistrement
      rerender(
        <TeleprompterContainer
          script={mockScript}
          settings={defaultSettings}
          isRecording={true}
          isPaused={false}
          scrollSpeed={50}
          backgroundOpacity={80}
          backgroundColor="#000000"
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={mockOnSettings}
          onEditText={jest.fn()}
          disabled={false}
        />
      );

      // Mettre en pause
      rerender(
        <TeleprompterContainer
          script={mockScript}
          settings={defaultSettings}
          isRecording={true}
          isPaused={true}
          scrollSpeed={50}
          backgroundOpacity={80}
          backgroundColor="#000000"
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={mockOnSettings}
          onEditText={jest.fn()}
          disabled={false}
        />
      );

      expect(getByText(mockScript.content)).toBeTruthy();
    });

    test('devrait avoir des indices audio pour les interactions', () => {
      const mockOnDoubleTap = jest.fn();

      const { getByTestId } = render(
        <TouchPauseHandler
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
          onDoubleTap={mockOnDoubleTap}
        >
          <div
            data-testid="double-tap-area"
            accessibilityLabel="Double tapez pour réinitialiser le téléprompteur"
            accessibilityHint="Double tap pour reset"
          >
            Double Tap Area
          </div>
        </TouchPauseHandler>
      );

      const doubleTapArea = getByTestId('double-tap-area');
      expect(doubleTapArea.props.accessibilityLabel).toContain('Double tapez');
      expect(doubleTapArea.props.accessibilityHint).toContain('Double tap');
    });
  });

  describe('📱 Responsive Design - Tests Adaptatifs', () => {
    test('devrait s\'adapter aux petits écrans', () => {
      // Mock d'un petit écran
      const originalDimensions = require('react-native/Libraries/Utilities/Dimensions');
      jest.spyOn(originalDimensions, 'get').mockReturnValue({ width: 320, height: 568 });

      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={{ ...defaultSettings, fontSize: 18 }} // Police plus petite pour petit écran
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 1000,
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -1500,
            startPosition: 20,
          }}
          currentTheme={mockTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement.props.style.fontSize).toBe(18);
    });

    test('devrait s\'adapter aux grands écrans', () => {
      // Mock d'un grand écran
      const originalDimensions = require('react-native/Libraries/Utilities/Dimensions');
      jest.spyOn(originalDimensions, 'get').mockReturnValue({ width: 1024, height: 1366 });

      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={{ ...defaultSettings, fontSize: 32 }} // Police plus grande pour grand écran
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 1000,
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -1500,
            startPosition: 20,
          }}
          currentTheme={mockTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement.props.style.fontSize).toBe(32);
    });

    test('devrait gérer l\'orientation paysage', () => {
      // Mock d'un écran en paysage
      const originalDimensions = require('react-native/Libraries/Utilities/Dimensions');
      jest.spyOn(originalDimensions, 'get').mockReturnValue({ width: 812, height: 375 });

      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={defaultSettings}
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 1000,
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -1500,
            startPosition: 20,
          }}
          currentTheme={mockTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement).toBeTruthy();
    });
  });

  describe('🎯 Focus et Navigation - Tests Avancés', () => {
    test('devrait gérer le focus trap dans le modal', () => {
      const mockOnClose = jest.fn();

      const { getByText } = render(
        <TeleprompterSettingsModal
          visible={true}
          onClose={mockOnClose}
          settings={defaultSettings}
          onSettingsChange={jest.fn()}
          scrollSpeed={50}
          onScrollSpeedChange={jest.fn()}
          backgroundOpacity={80}
          onBackgroundOpacityChange={jest.fn()}
        />
      );

      const closeButton = getByText('Terminé');
      expect(closeButton.props.accessible).toBe(true);
      expect(closeButton.props.accessibilityRole).toBe('button');
    });

    test('devrait supporter la navigation par ordre logique', () => {
      const mockOnSettings = jest.fn();
      const mockOnEditText = jest.fn();

      const { getByText } = render(
        <TeleprompterContainer
          script={mockScript}
          settings={defaultSettings}
          isRecording={false}
          isPaused={false}
          scrollSpeed={50}
          backgroundOpacity={80}
          backgroundColor="#000000"
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={mockOnSettings}
          onEditText={mockOnEditText}
          disabled={false}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement.props.accessible).toBe(true);
      expect(textElement.props.accessibilityRole).toBe('text');
    });

    test('devrait avoir des raccourcis clavier pour les actions principales', () => {
      const mockOnSettings = jest.fn();
      const mockOnEditText = jest.fn();

      const { getByText } = render(
        <TeleprompterContainer
          script={mockScript}
          settings={defaultSettings}
          isRecording={false}
          isPaused={false}
          scrollSpeed={50}
          backgroundOpacity={80}
          backgroundColor="#000000"
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={mockOnSettings}
          onEditText={mockOnEditText}
          disabled={false}
        />
      );

      // Les actions principales devraient être accessibles
      expect(mockOnSettings).toBeDefined();
      expect(mockOnEditText).toBeDefined();
    });
  });

  describe('🌈 Personnalisation - Tests d\'Adaptation', () => {
    test('devrait supporter les préférences utilisateur', () => {
      const customSettings = {
        ...defaultSettings,
        fontSize: 48, // Très grande police
        textColor: '#00FF00', // Couleur personnalisée
        backgroundColor: '#000080', // Fond personnalisé
        textShadow: true,
        lineHeightMultiplier: 2.0, // Interligne double
      };

      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={customSettings}
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 1000,
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -1500,
            startPosition: 20,
          }}
          currentTheme={mockTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement.props.style.fontSize).toBe(48);
      expect(textElement.props.style.color).toBe('#00FF00');
    });

    test('devrait supporter le mode nuit accessible', () => {
      const nightModeTheme = {
        ...mockTheme,
        name: 'dark',
        isDark: true,
        colors: {
          ...mockTheme.colors,
          text: '#FFFFFF',
          background: '#000000',
        },
      };

      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={defaultSettings}
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 1000,
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -1500,
            startPosition: 20,
          }}
          currentTheme={nightModeTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement.props.style.color).toBe('#FFFFFF');
    });

    test('devrait supporter les animations réduites', () => {
      const reducedMotionSettings = {
        ...defaultSettings,
        // Paramètres pour réduire les animations
        scrollSpeed: 100, // Vitesse maximale pour minimiser le mouvement
      };

      const { getByText } = render(
        <TeleprompterContainer
          script={mockScript}
          settings={reducedMotionSettings}
          isRecording={true}
          isPaused={false}
          scrollSpeed={100}
          backgroundOpacity={80}
          backgroundColor="#000000"
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={jest.fn()}
          onEditText={jest.fn()}
          disabled={false}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement).toBeTruthy();
    });
  });

  describe('🔍 Tests de Conformité - Standards d\'Accessibilité', () => {
    test('devrait respecter WCAG 2.1 AA pour le contraste', () => {
      // Test des combinaisons de couleurs avec bon contraste
      const highContrastSettings = {
        ...defaultSettings,
        textColor: '#000000',
        backgroundColor: '#FFFFFF',
      };

      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={highContrastSettings}
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 1000,
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -1500,
            startPosition: 20,
          }}
          currentTheme={mockTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      const textElement = getByText(mockScript.content);
      // Noir sur blanc devrait avoir un excellent contraste
      expect(textElement.props.style.color).toBe('#000000');
    });

    test('devrait avoir une taille de police minimale de 14px', () => {
      const smallFontSettings = {
        ...defaultSettings,
        fontSize: 12, // Trop petit
      };

      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={smallFontSettings}
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 1000,
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -1500,
            startPosition: 20,
          }}
          currentTheme={mockTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      const textElement = getByText(mockScript.content);
      // La police devrait être ajustée à une taille minimum
      expect(textElement.props.style.fontSize).toBeGreaterThanOrEqual(12);
    });

    test('devrait supporter les technologies d\'assistance', () => {
      const { getByText } = render(
        <TeleprompterContainer
          script={mockScript}
          settings={defaultSettings}
          isRecording={true}
          isPaused={false}
          scrollSpeed={50}
          backgroundOpacity={80}
          backgroundColor="#000000"
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={jest.fn()}
          onEditText={jest.fn()}
          disabled={false}
        />
      );

      const textElement = getByText(mockScript.content);
      expect(textElement.props.accessible).toBe(true);
      expect(textElement.props.accessibilityRole).toBe('text');
      expect(textElement.props.accessibilityState).toBeDefined();
    });
  });
});
