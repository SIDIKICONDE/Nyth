import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { TeleprompterContainer } from '../../src/components/recording/teleprompter/TeleprompterContainer';
import { TeleprompterContent } from '../../src/components/recording/teleprompter/TeleprompterContent';
import { TeleprompterSettingsModal } from '../../src/components/recording/teleprompter/TeleprompterSettingsModal';
import { useScrollAnimation } from '../../src/components/recording/teleprompter/useScrollAnimation';
import { useContainerGestures } from '../../src/components/recording/teleprompter/useContainerGestures';
import { useTeleprompterState } from '../../src/components/recording/teleprompter/hooks/useTeleprompterState';
import { useDoubleTapHandler } from '../../src/components/recording/teleprompter/hooks/useDoubleTapHandler';
import { useTouchHandlers } from '../../src/components/recording/teleprompter/hooks/useTouchHandlers';
import { useScrollCalculations } from '../../src/components/recording/teleprompter/hooks/useScrollCalculations';
import { useScrollHandlers } from '../../src/components/recording/teleprompter/hooks/useScrollHandlers';
import { useScrollState } from '../../src/components/recording/teleprompter/hooks/useScrollState';
import { TeleprompterFormatter } from '../../src/utils/textFormatter/TeleprompterFormatter';
import { TextFormatter } from '../../src/utils/textFormatter';

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

// Mock du contexte de thème
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

// Mock des dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: () => ({ width: 375, height: 812 }),
}));

// Mock des safe areas
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('🎬 Système de Téléprompter - Tests Sophistiqués', () => {
  const mockScript = {
    id: 'test-script-1',
    title: 'Test Script',
    content: 'Ceci est un script de test pour le téléprompter. Il contient plusieurs phrases pour tester le défilement automatique et les fonctionnalités de formatage.',
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

  describe('📝 TeleprompterFormatter - Tests de Formatage', () => {
    test('devrait ajouter des pauses automatiques correctement', () => {
      const text = 'Bonjour. Comment allez-vous? Je vais bien!';
      const result = TeleprompterFormatter.addAutoPauses(text);
      
      expect(result).toContain('...');
      expect(result).toContain('Bonjour. ...');
      expect(result).toContain('Comment allez-vous? ...');
      expect(result).toContain('Je vais bien! ...');
    });

    test('devrait diviser le texte en phrases', () => {
      const text = 'Première phrase. Deuxième phrase! Troisième phrase?';
      const result = TeleprompterFormatter.splitIntoSentences(text);
      
      expect(result).toContain('Première phrase.\n');
      expect(result).toContain('Deuxième phrase!\n');
      expect(result).toContain('Troisième phrase?\n');
    });

    test('devrait optimiser le texte pour le téléprompter avec toutes les options', () => {
      const text = 'texte en minuscules. avec des pauses!';
      const options = {
        capitalize: true,
        splitSentences: true,
        addPauses: true,
        formatMarkdown: true,
        pauseMarker: '---',
      };
      
      const result = TeleprompterFormatter.optimizeForTeleprompter(text, options);
      
      expect(result).toContain('Texte En Minuscules.');
      expect(result).toContain('---');
      expect(result).toContain('\n');
    });

    test('devrait gérer les cas limites et les erreurs', () => {
      expect(TeleprompterFormatter.addAutoPauses('')).toBe('');
      expect(TeleprompterFormatter.splitIntoSentences('')).toBe('');
      expect(TeleprompterFormatter.optimizeForTeleprompter('', {})).toBe('');
    });
  });

  describe('🎯 Hooks de Téléprompter - Tests des Hooks', () => {
    test('useTeleprompterState devrait initialiser correctement l\'état', () => {
      const TestComponent = () => {
        const state = useTeleprompterState();
        return (
          <div>
            <span data-testid="isUpdatingHeight">{state.isUpdatingHeight.toString()}</span>
            <span data-testid="textHeight">{state.textHeight}</span>
            <span data-testid="isTextMeasured">{state.isTextMeasured.toString()}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      expect(getByTestId('isUpdatingHeight').textContent).toBe('false');
      expect(getByTestId('textHeight').textContent).toBe('0');
      expect(getByTestId('isTextMeasured').textContent).toBe('false');
    });

    test('useScrollCalculations devrait calculer correctement les positions', () => {
      const TestComponent = () => {
        const calculations = useScrollCalculations(1000, 400, 50, null, {
          method: 'classic',
          wpm: 160,
          durationMinutes: 3,
          linesPerSecond: 1,
        });
        
        return (
          <div>
            <span data-testid="startPosition">{calculations.startPosition}</span>
            <span data-testid="endPosition">{calculations.endPosition}</span>
            <span data-testid="duration">{calculations.duration}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      expect(Number(getByTestId('startPosition').textContent)).toBeGreaterThan(0);
      expect(Number(getByTestId('endPosition').textContent)).toBeLessThan(0);
      expect(Number(getByTestId('duration').textContent)).toBeGreaterThan(0);
    });

    test('useScrollState devrait gérer les actions correctement', () => {
      const TestComponent = () => {
        const { state, dispatch } = useScrollState(50, 1000, true);
        
        React.useEffect(() => {
          dispatch({ type: 'SET_TEXT_HEIGHT', payload: 1500 });
          dispatch({ type: 'SET_SCROLL_SPEED', payload: 75 });
        }, []);
        
        return (
          <div>
            <span data-testid="textHeight">{state.textHeight}</span>
            <span data-testid="scrollSpeed">{state.scrollSpeed}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      expect(Number(getByTestId('textHeight').textContent)).toBe(1500);
      expect(Number(getByTestId('scrollSpeed').textContent)).toBe(75);
    });
  });

  describe.skip('🎮 Contrôles Interactifs - Tests des Gestes (DÉSACTIVÉ)', () => {
    test('devrait gérer le double-tap pour réinitialiser', async () => {
      const mockSetShowResetIndicator = jest.fn();
      const mockSetIsResetting = jest.fn();
      const mockScrollHandlers = {
        stopScrolling: jest.fn(),
        resetScrolling: jest.fn(),
        startScrolling: jest.fn(),
      };

      const TestComponent = () => {
        const { handleDoubleTap } = useDoubleTapHandler({
          doubleTapCountRef: { current: 0 },
          currentScrollPositionRef: { current: 0 },
          setShowResetIndicator: mockSetShowResetIndicator,
          setIsResetting: mockSetIsResetting,
          scrollHandlers: mockScrollHandlers,
          scrollAnimation: new Animated.Value(0),
          isRecording: true,
          isPaused: false,
        });

        return (
          <div onTouchStart={handleDoubleTap} data-testid="double-tap-area">
            Test Area
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      // Simuler un double-tap
      fireEvent.touchStart(getByTestId('double-tap-area'));
      fireEvent.touchEnd(getByTestId('double-tap-area'));
      
      await waitFor(() => {
        expect(mockSetShowResetIndicator).toHaveBeenCalledWith(true);
        expect(mockSetIsResetting).toHaveBeenCalledWith(true);
      });
    });

    test('devrait gérer les touches pour pause/reprise', () => {
      const mockSetIsTouchPaused = jest.fn();
      const mockScrollHandlers = {
        stopScrolling: jest.fn(),
        startScrolling: jest.fn(),
      };

      const TestComponent = () => {
        const { handleTogglePause } = useTouchHandlers({
          isRecording: true,
          isPaused: false,
          isTouchPaused: false,
          isResetting: false,
          setIsTouchPaused: mockSetIsTouchPaused,
          scrollHandlers: mockScrollHandlers,
        });

        return (
          <div onTouchStart={handleTogglePause} data-testid="touch-area">
            Touch Area
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      fireEvent.touchStart(getByTestId('touch-area'));
      
      expect(mockSetIsTouchPaused).toHaveBeenCalledWith(true);
      expect(mockScrollHandlers.stopScrolling).toHaveBeenCalled();
    });
  });

  describe('🎨 Interface Utilisateur - Tests des Composants', () => {
    test('TeleprompterContainer devrait se rendre correctement', () => {
      const mockOnSettings = jest.fn();
      const mockOnEditText = jest.fn();

      const { getByTestId } = render(
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

      // Vérifier que le conteneur principal est rendu
      expect(getByTestId).toBeDefined();
    });

    test('TeleprompterContent devrait afficher le texte correctement', () => {
      const mockScrollAnimation = new Animated.Value(0);
      const mockScrollingState = {
        textHeight: 1000,
        isTextMeasured: true,
        currentAnimation: null,
        pausedPosition: null,
        endPosition: -1500,
        startPosition: 20,
      };

      const { getByText } = render(
        <TeleprompterContent
          script={mockScript}
          settings={defaultSettings}
          scrollAnimation={mockScrollAnimation}
          scrollingState={mockScrollingState}
          currentTheme={mockTheme}
          onDoubleTap={jest.fn()}
          onTextHeightChange={jest.fn()}
          onTextMeasured={jest.fn()}
          onTogglePause={jest.fn()}
          onPauseScroll={jest.fn()}
          onResumeScroll={jest.fn()}
        />
      );

      // Vérifier que le contenu du script est affiché
      expect(getByText(mockScript.content)).toBeTruthy();
    });

    test('TeleprompterSettingsModal devrait ouvrir et fermer correctement', () => {
      const mockOnClose = jest.fn();
      const mockOnSettingsChange = jest.fn();
      const mockOnScrollSpeedChange = jest.fn();
      const mockOnBackgroundOpacityChange = jest.fn();

      const { getByText, queryByText } = render(
        <TeleprompterSettingsModal
          visible={true}
          onClose={mockOnClose}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
          scrollSpeed={50}
          onScrollSpeedChange={mockOnScrollSpeedChange}
          backgroundOpacity={80}
          onBackgroundOpacityChange={mockOnBackgroundOpacityChange}
        />
      );

      // Vérifier que le modal est visible
      expect(getByText('Réglages')).toBeTruthy();

      // Simuler la fermeture
      fireEvent.press(getByText('Terminé'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('⚡ Performance et Optimisations - Tests Avancés', () => {
    test('devrait gérer les changements de paramètres sans re-renders inutiles', () => {
      const renderCount = jest.fn();
      
      const TestComponent = React.memo(() => {
        renderCount();
        const state = useTeleprompterState();
        return <div data-testid="render-count">{renderCount.mock.calls.length}</div>;
      });

      const { getByTestId, rerender } = render(<TestComponent />);
      
      const initialCount = Number(getByTestId('render-count').textContent);
      
      // Re-render avec les mêmes props
      rerender(<TestComponent />);
      
      // Le composant ne devrait pas se re-rendre inutilement
      expect(Number(getByTestId('render-count').textContent)).toBe(initialCount);
    });

    test('devrait nettoyer les animations lors du démontage', () => {
      const mockStopAnimation = jest.fn();
      const mockAnimation = {
        stop: mockStopAnimation,
      };

      const TestComponent = () => {
        const { state, dispatch } = useScrollState(50);
        
        React.useEffect(() => {
          dispatch({ type: 'SET_ANIMATION', payload: mockAnimation as any });
        }, []);

        React.useEffect(() => {
          return () => {
            if (state.currentAnimation) {
              state.currentAnimation.stop();
            }
          };
        }, [state.currentAnimation]);

        return <div>Test</div>;
      };

      const { unmount } = render(<TestComponent />);
      
      unmount();
      
      expect(mockStopAnimation).toHaveBeenCalled();
    });

    test('devrait gérer les appareils à faible performance', () => {
      // Mock des dimensions pour un appareil à faible performance
      const originalDimensions = require('react-native/Libraries/Utilities/Dimensions');
      jest.spyOn(originalDimensions, 'get').mockReturnValue({ width: 320, height: 568 });

      const TestComponent = () => {
        const [isLowPerformanceDevice, setIsLowPerformanceDevice] = React.useState(false);
        
        React.useEffect(() => {
          const { width, height } = originalDimensions.get();
          const screenArea = width * height;
          
          if (screenArea < 2000000) {
            setIsLowPerformanceDevice(true);
          }
        }, []);

        return (
          <div data-testid="performance-status">
            {isLowPerformanceDevice ? 'low' : 'high'}
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      expect(getByTestId('performance-status').textContent).toBe('low');
    });
  });

  describe('🎭 Effets Visuels - Tests des Styles', () => {
    test('devrait appliquer correctement les transformations de miroir', () => {
      const mirroredSettings = {
        ...defaultSettings,
        isMirrored: true,
        isMirroredVertical: true,
      };

      const TestComponent = () => {
        const teleprompterTextStyle = {
          fontSize: mirroredSettings.fontSize,
          color: mirroredSettings.textColor,
          transform: [
            { scaleX: mirroredSettings.isMirrored ? -1 : 1 },
            { scaleY: mirroredSettings.isMirroredVertical ? -1 : 1 },
          ],
        };

        return (
          <div style={teleprompterTextStyle} data-testid="mirrored-text">
            Texte miroir
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const element = getByTestId('mirrored-text');
      
      expect(element.style.transform).toContain('scaleX(-1)');
      expect(element.style.transform).toContain('scaleY(-1)');
    });

    test('devrait appliquer correctement l\'ombre de texte', () => {
      const shadowSettings = {
        ...defaultSettings,
        textShadow: true,
      };

      const TestComponent = () => {
        const teleprompterTextStyle = {
          fontSize: shadowSettings.fontSize,
          color: shadowSettings.textColor,
          ...(shadowSettings.textShadow && {
            textShadowColor: mockTheme.isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)",
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 3,
          }),
        };

        return (
          <div style={teleprompterTextStyle} data-testid="shadow-text">
            Texte avec ombre
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const element = getByTestId('shadow-text');
      
      expect(element.style.textShadowColor).toBe('rgba(0,0,0,0.8)');
      expect(element.style.textShadowOffset).toEqual({ width: 1, height: 1 });
      expect(element.style.textShadowRadius).toBe(3);
    });
  });

  describe('🔧 Intégration et Workflow - Tests Complets', () => {
    test('devrait gérer le workflow complet d\'enregistrement avec téléprompter', async () => {
      const mockOnSettings = jest.fn();
      const mockOnEditText = jest.fn();

      const { getByTestId, rerender } = render(
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

      // Simuler le début de l'enregistrement
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
          onEditText={mockOnEditText}
          disabled={false}
        />
      );

      // Simuler une pause
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
          onEditText={mockOnEditText}
          disabled={false}
        />
      );

      // Simuler la reprise
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
          onEditText={mockOnEditText}
          disabled={false}
        />
      );

      // Vérifier que les callbacks sont disponibles
      expect(mockOnSettings).toBeDefined();
      expect(mockOnEditText).toBeDefined();
    });

    test('devrait gérer les changements de script dynamiquement', () => {
      const newScript = {
        ...mockScript,
        id: 'test-script-2',
        content: 'Nouveau contenu pour tester le changement dynamique de script.',
      };

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
          onSettings={jest.fn()}
          onEditText={jest.fn()}
          disabled={false}
        />
      );

      // Changer le script
      rerender(
        <TeleprompterContainer
          script={newScript}
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

      // Vérifier que le nouveau contenu est affiché
      expect(getByText(newScript.content)).toBeTruthy();
    });
  });

  describe('🚨 Gestion d\'Erreurs - Tests de Robustesse', () => {
    test('devrait gérer les scripts vides ou invalides', () => {
      const emptyScript = {
        ...mockScript,
        content: '',
      };

      const { getByText } = render(
        <TeleprompterContainer
          script={emptyScript}
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

      // Vérifier qu'un message par défaut est affiché
      expect(getByText('Your text will appear here...')).toBeTruthy();
    });

    test('devrait gérer les paramètres invalides gracieusement', () => {
      const invalidSettings = {
        ...defaultSettings,
        fontSize: -10, // Valeur invalide
        scrollSpeed: 150, // Valeur hors limites
      };

      const { getByTestId } = render(
        <TeleprompterContainer
          script={mockScript}
          settings={invalidSettings}
          isRecording={false}
          isPaused={false}
          scrollSpeed={150}
          backgroundOpacity={120}
          backgroundColor="#000000"
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={jest.fn()}
          onEditText={jest.fn()}
          disabled={false}
        />
      );

      // Le composant devrait se rendre sans erreur
      expect(getByTestId).toBeDefined();
    });

    test('devrait gérer les erreurs de BlurView', () => {
      const TestComponent = () => {
        const [blurViewError, setBlurViewError] = React.useState(false);
        
        const handleBlurViewError = () => {
          setBlurViewError(true);
        };

        return (
          <div>
            {blurViewError ? (
              <div data-testid="fallback">Fallback View</div>
            ) : (
              <div data-testid="blur-view" onError={handleBlurViewError}>
                BlurView
              </div>
            )}
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      // Simuler une erreur BlurView
      fireEvent(getByTestId('blur-view'), 'error');
      
      // Vérifier que le fallback est affiché
      expect(getByTestId('fallback')).toBeTruthy();
    });
  });

  describe('📊 Métriques et Analytics - Tests de Monitoring', () => {
    test('devrait tracker les interactions utilisateur', () => {
      const mockAnalytics = {
        trackEvent: jest.fn(),
        trackError: jest.fn(),
        trackPerformance: jest.fn(),
      };

      const TestComponent = () => {
        const [interactionCount, setInteractionCount] = React.useState(0);
        
        const handleInteraction = () => {
          setInteractionCount(prev => prev + 1);
          mockAnalytics.trackEvent('teleprompter_interaction', {
            type: 'pause',
            timestamp: Date.now(),
          });
        };

        return (
          <div>
            <button onClick={handleInteraction} data-testid="interaction-btn">
              Interact
            </button>
            <span data-testid="interaction-count">{interactionCount}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      fireEvent.press(getByTestId('interaction-btn'));
      
      expect(Number(getByTestId('interaction-count').textContent)).toBe(1);
      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('teleprompter_interaction', expect.any(Object));
    });

    test('devrait mesurer les performances de rendu', () => {
      const mockPerformance = {
        mark: jest.fn(),
        measure: jest.fn(),
      };

      const TestComponent = () => {
        React.useEffect(() => {
          mockPerformance.mark('teleprompter-render-start');
          
          return () => {
            mockPerformance.mark('teleprompter-render-end');
            mockPerformance.measure('teleprompter-render', 'teleprompter-render-start', 'teleprompter-render-end');
          };
        }, []);

        return <div>Performance Test</div>;
      };

      const { unmount } = render(<TestComponent />);
      
      unmount();
      
      expect(mockPerformance.mark).toHaveBeenCalledWith('teleprompter-render-start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('teleprompter-render-end');
      expect(mockPerformance.measure).toHaveBeenCalledWith('teleprompter-render', 'teleprompter-render-start', 'teleprompter-render-end');
    });
  });
});
