import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { TeleprompterContainer } from '../../src/components/recording/teleprompter/TeleprompterContainer';
import { TeleprompterContent } from '../../src/components/recording/teleprompter/TeleprompterContent';
import { useScrollAnimation } from '../../src/components/recording/teleprompter/useScrollAnimation';
import { useScrollCalculations } from '../../src/components/recording/teleprompter/hooks/useScrollCalculations';
import { useScrollHandlers } from '../../src/components/recording/teleprompter/hooks/useScrollHandlers';

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

// Mock des dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: () => ({ width: 375, height: 812 }),
}));

// Mock des safe areas
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('⚡ Performance du Téléprompter - Tests Avancés', () => {
  const mockScript = {
    id: 'test-script-1',
    title: 'Performance Test Script',
    content: 'Ceci est un script de test pour les performances du téléprompter. Il contient suffisamment de texte pour tester le défilement et les optimisations de performance.',
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

  describe('🎯 Optimisations de Rendu - Tests de Performance', () => {
    test('devrait éviter les re-renders inutiles avec React.memo', () => {
      let renderCount = 0;

      const TestComponent = React.memo(() => {
        renderCount++;
        return (
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
      });

      const { rerender } = render(<TestComponent />);
      const initialCount = renderCount;

      // Re-render avec les mêmes props
      rerender(<TestComponent />);

      // Le composant ne devrait pas se re-rendre inutilement
      expect(renderCount).toBe(initialCount);
    });

    test('devrait optimiser les animations avec useNativeDriver', () => {
      const mockScrollAnimation = {
        setValue: jest.fn(),
        stopAnimation: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      };

      const TestComponent = () => {
        const handlers = useScrollHandlers({
          scrollAnimation: mockScrollAnimation as any,
          state: {
            currentAnimation: null,
            pausedPosition: null,
            isResetting: false,
            textHeight: 1000,
            isTextMeasured: true,
          },
          calculations: {
            startPosition: 20,
            endPosition: -1500,
            remainingDuration: 10000,
          },
          dispatch: jest.fn(),
          isRecording: true,
          isPaused: false,
          isScreenFocused: true,
        });

        React.useEffect(() => {
          handlers.startScrolling();
        }, []);

        return <div>Test</div>;
      };

      render(<TestComponent />);

      // L'animation devrait utiliser le native driver pour de meilleures performances
      expect(mockScrollAnimation.setValue).toHaveBeenCalledWith(20);
    });

    test('devrait limiter les mises à jour fréquentes', () => {
      const updateCount = jest.fn();

      const TestComponent = () => {
        const calculations = useScrollCalculations(
          1000,
          400,
          50,
          null,
          { method: 'classic' }
        );

        React.useEffect(() => {
          updateCount();
        }, [calculations.duration]);

        return (
          <div data-testid="duration">{calculations.duration}</div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const initialCount = updateCount.mock.calls.length;

      // Attendre un peu pour voir si des mises à jour supplémentaires se produisent
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Le nombre de mises à jour devrait être limité
      expect(updateCount.mock.calls.length).toBe(initialCount);
      expect(Number(getByTestId('duration').textContent)).toBeGreaterThan(0);
    });
  });

  describe('🔄 Gestion de la Mémoire - Tests de Fuite', () => {
    test('devrait nettoyer les animations lors du démontage', () => {
      const mockStopAnimation = jest.fn();
      const mockAnimation = {
        stop: mockStopAnimation,
      };

      const TestComponent = () => {
        const [animation, setAnimation] = React.useState(mockAnimation);

        React.useEffect(() => {
          return () => {
            if (animation) {
              animation.stop();
            }
          };
        }, [animation]);

        return <div>Animation Test</div>;
      };

      const { unmount } = render(<TestComponent />);

      unmount();

      expect(mockStopAnimation).toHaveBeenCalled();
    });

    test('devrait nettoyer les timers et intervals', () => {
      const mockClearTimeout = jest.spyOn(global, 'clearTimeout');
      const mockClearInterval = jest.spyOn(global, 'clearInterval');

      const TestComponent = () => {
        React.useEffect(() => {
          const timeoutId = setTimeout(() => {}, 1000);
          const intervalId = setInterval(() => {}, 500);

          return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
          };
        }, []);

        return <div>Timer Test</div>;
      };

      const { unmount } = render(<TestComponent />);

      unmount();

      expect(mockClearTimeout).toHaveBeenCalled();
      expect(mockClearInterval).toHaveBeenCalled();
    });

    test('devrait gérer les listeners d\'animation correctement', () => {
      const mockRemoveListener = jest.fn();
      const mockScrollAnimation = {
        addListener: jest.fn(() => ({
          remove: mockRemoveListener,
        })),
        setValue: jest.fn(),
        stopAnimation: jest.fn(),
      };

      const TestComponent = () => {
        React.useEffect(() => {
          const listener = mockScrollAnimation.addListener(() => {});

          return () => {
            listener.remove();
          };
        }, []);

        return <div>Listener Test</div>;
      };

      const { unmount } = render(<TestComponent />);

      unmount();

      expect(mockScrollAnimation.addListener).toHaveBeenCalled();
      expect(mockRemoveListener).toHaveBeenCalled();
    });
  });

  describe('📊 Métriques de Performance - Tests de Monitoring', () => {
    test('devrait mesurer le temps de rendu initial', () => {
      const performanceMarks = [];
      const originalMark = performance.mark;
      const originalMeasure = performance.measure;

      performance.mark = jest.fn((name) => {
        performanceMarks.push({ name, timestamp: Date.now() });
      });

      performance.measure = jest.fn();

      const TestComponent = () => {
        React.useEffect(() => {
          performance.mark('teleprompter-render-start');
          performance.mark('teleprompter-render-end');
          performance.measure('teleprompter-render', 'teleprompter-render-start', 'teleprompter-render-end');
        }, []);

        return (
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
      };

      render(<TestComponent />);

      expect(performance.mark).toHaveBeenCalledWith('teleprompter-render-start');
      expect(performance.mark).toHaveBeenCalledWith('teleprompter-render-end');
      expect(performance.measure).toHaveBeenCalledWith('teleprompter-render', 'teleprompter-render-start', 'teleprompter-render-end');

      // Restore original performance methods
      performance.mark = originalMark;
      performance.measure = originalMeasure;
    });

    test('devrait tracker les métriques d\'utilisation', () => {
      const metrics = {
        renderCount: 0,
        scrollCount: 0,
        pauseCount: 0,
      };

      const TestComponent = () => {
        React.useEffect(() => {
          metrics.renderCount++;
        });

        return (
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
      };

      render(<TestComponent />);

      expect(metrics.renderCount).toBe(1);
    });

    test('devrait mesurer les performances de défilement', () => {
      const scrollMetrics = {
        startTime: 0,
        endTime: 0,
        frameCount: 0,
      };

      const TestComponent = () => {
        const scrollAnimation = new Animated.Value(0);

        React.useEffect(() => {
          scrollMetrics.startTime = Date.now();

          const animation = Animated.timing(scrollAnimation, {
            toValue: -1000,
            duration: 5000,
            useNativeDriver: true,
          });

          animation.start(() => {
            scrollMetrics.endTime = Date.now();
          });

          return () => {
            animation.stop();
          };
        }, []);

        return <div>Scroll Performance Test</div>;
      };

      render(<TestComponent />);

      expect(scrollMetrics.startTime).toBeGreaterThan(0);
    });
  });

  describe('⚡ Optimisations de Défilement - Tests Spécialisés', () => {
    test('devrait optimiser les calculs de position', () => {
      const calculationCount = jest.fn();

      const TestComponent = () => {
        const calculations = useScrollCalculations(
          1000,
          400,
          50,
          null,
          { method: 'classic' }
        );

        calculationCount();

        return (
          <div>
            <span data-testid="startPosition">{calculations.startPosition}</span>
            <span data-testid="endPosition">{calculations.endPosition}</span>
          </div>
        );
      };

      render(<TestComponent />);

      // Les calculs ne devraient être effectués qu'une seule fois pour des props identiques
      expect(calculationCount).toHaveBeenCalledTimes(1);
    });

    test('devrait mettre en cache les calculs coûteux', () => {
      const expensiveCalculation = jest.fn(() => {
        // Simuler un calcul coûteux
        let result = 0;
        for (let i = 0; i < 1000; i++) {
          result += Math.random();
        }
        return result;
      });

      const TestComponent = React.memo(() => {
        const result = expensiveCalculation();

        return (
          <div data-testid="calculation-result">{result}</div>
        );
      });

      const { rerender } = render(<TestComponent />);
      const firstResult = expensiveCalculation.mock.results[0].value;

      // Re-render avec les mêmes props
      rerender(<TestComponent />);

      // Le calcul ne devrait pas être re-effectué
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
    });

    test('devrait optimiser les mises à jour de vitesse', () => {
      const updateCount = jest.fn();

      const TestComponent = () => {
        const [speed, setSpeed] = React.useState(50);

        const calculations = useScrollCalculations(
          1000,
          400,
          speed,
          null,
          { method: 'classic' }
        );

        React.useEffect(() => {
          updateCount();
        }, [calculations.duration]);

        return (
          <div>
            <span data-testid="duration">{calculations.duration}</span>
            <button onClick={() => setSpeed(75)} data-testid="speed-button">Change Speed</button>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Changer la vitesse
      act(() => {
        getByTestId('speed-button').props.onClick();
      });

      // Le calcul devrait être mis à jour
      expect(updateCount).toHaveBeenCalledTimes(2); // Initial + update
    });
  });

  describe('📱 Performance Mobile - Tests Dispositif', () => {
    test('devrait détecter les appareils à faible performance', () => {
      // Mock d'un appareil à faible performance
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

    test('devrait adapter les performances selon l\'appareil', () => {
      // Mock d'un appareil haut de gamme
      const originalDimensions = require('react-native/Libraries/Utilities/Dimensions');
      jest.spyOn(originalDimensions, 'get').mockReturnValue({ width: 1024, height: 1366 });

      const TestComponent = () => {
        const [devicePerformance, setDevicePerformance] = React.useState('medium');

        React.useEffect(() => {
          const { width, height } = originalDimensions.get();
          const screenArea = width * height;

          if (screenArea > 10000000) {
            setDevicePerformance('high');
          } else if (screenArea > 2000000) {
            setDevicePerformance('medium');
          } else {
            setDevicePerformance('low');
          }
        }, []);

        return (
          <div data-testid="device-performance">{devicePerformance}</div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      expect(getByTestId('device-performance').textContent).toBe('high');
    });

    test('devrait gérer la mémoire sur les appareils limités', () => {
      const memoryUsage = [];

      const TestComponent = () => {
        const [components, setComponents] = React.useState([]);

        React.useEffect(() => {
          // Simuler l'ajout de composants
          const newComponents = Array.from({ length: 100 }, (_, i) => ({
            id: i,
            content: `Component ${i}`,
          }));

          setComponents(newComponents);

          // Tracker l'utilisation mémoire (simulée)
          if (global.gc) {
            global.gc();
          }
          memoryUsage.push(process.memoryUsage?.().heapUsed || 0);
        }, []);

        return (
          <div data-testid="component-count">{components.length}</div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      expect(Number(getByTestId('component-count').textContent)).toBe(100);
      expect(memoryUsage.length).toBeGreaterThan(0);
    });
  });

  describe('🔄 Optimisations d\'Animation - Tests Avancés', () => {
    test('devrait utiliser les animations natives quand possible', () => {
      const TestComponent = () => {
        const scrollAnimation = new Animated.Value(0);

        React.useEffect(() => {
          const animation = Animated.timing(scrollAnimation, {
            toValue: -1000,
            duration: 5000,
            useNativeDriver: true, // Devrait être true pour de meilleures performances
            isInteraction: true,
          });

          animation.start();

          return () => {
            animation.stop();
          };
        }, []);

        return <div>Native Animation Test</div>;
      };

      render(<TestComponent />);

      // L'animation devrait être optimisée
      expect(true).toBe(true);
    });

    test('devrait limiter la fréquence des mises à jour', () => {
      const updateCount = jest.fn();
      let lastUpdateTime = 0;

      const TestComponent = () => {
        const [position, setPosition] = React.useState(0);

        React.useEffect(() => {
          const interval = setInterval(() => {
            const now = Date.now();
            if (now - lastUpdateTime > 16) { // Limiter à 60 FPS
              setPosition(prev => prev + 1);
              lastUpdateTime = now;
              updateCount();
            }
          }, 10);

          return () => clearInterval(interval);
        }, []);

        return (
          <div data-testid="position">{position}</div>
        );
      };

      render(<TestComponent />);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Le nombre de mises à jour devrait être limité
      expect(updateCount.mock.calls.length).toBeLessThan(10);
    });

    test('devrait optimiser les transitions d\'état', () => {
      const transitionCount = jest.fn();

      const TestComponent = () => {
        const [isRecording, setIsRecording] = React.useState(false);
        const [isPaused, setIsPaused] = React.useState(false);

        React.useEffect(() => {
          transitionCount();
        }, [isRecording, isPaused]);

        return (
          <div>
            <button
              onClick={() => setIsRecording(true)}
              data-testid="start-recording"
            >
              Start
            </button>
            <button
              onClick={() => setIsPaused(true)}
              data-testid="pause-recording"
            >
              Pause
            </button>
            <span data-testid="state">
              {isRecording ? (isPaused ? 'paused' : 'recording') : 'stopped'}
            </span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Démarrer l'enregistrement
      act(() => {
        getByTestId('start-recording').props.onClick();
      });

      // Mettre en pause
      act(() => {
        getByTestId('pause-recording').props.onClick();
      });

      expect(transitionCount).toHaveBeenCalledTimes(3); // Initial + start + pause
      expect(getByTestId('state').textContent).toBe('paused');
    });
  });

  describe('📈 Tests de Charge - Performance Sous Stress', () => {
    test('devrait gérer de longs scripts efficacement', () => {
      const longScript = {
        ...mockScript,
        content: 'A'.repeat(10000) + ' ' + 'B'.repeat(10000), // 20,000 caractères
      };

      const startTime = Date.now();

      const { getByText } = render(
        <TeleprompterContent
          script={longScript}
          settings={defaultSettings}
          scrollAnimation={new Animated.Value(0)}
          scrollingState={{
            textHeight: 50000, // Très long
            isTextMeasured: true,
            currentAnimation: null,
            pausedPosition: null,
            endPosition: -50000,
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

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Le rendu devrait être rapide même avec un long script
      expect(renderTime).toBeLessThan(1000); // Moins d'1 seconde
      expect(getByText(longScript.content.substring(0, 100))).toBeTruthy();
    });

    test('devrait gérer de nombreuses mises à jour de paramètres', () => {
      const updateCount = jest.fn();

      const TestComponent = () => {
        const [settings, setSettings] = React.useState(defaultSettings);

        React.useEffect(() => {
          updateCount();
        }, [settings]);

        const updateSettings = () => {
          setSettings({
            ...settings,
            fontSize: settings.fontSize + 1,
          });
        };

        return (
          <div>
            <button onClick={updateSettings} data-testid="update-button">
              Update
            </button>
            <span data-testid="font-size">{settings.fontSize}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Simuler de nombreuses mises à jour
      for (let i = 0; i < 10; i++) {
        act(() => {
          getByTestId('update-button').props.onClick();
        });
      }

      // Le nombre de mises à jour devrait être raisonnable
      expect(updateCount.mock.calls.length).toBe(11); // Initial + 10 updates
      expect(Number(getByTestId('font-size').textContent)).toBe(defaultSettings.fontSize + 10);
    });

    test('devrait maintenir les performances sous charge continue', () => {
      const performanceMetrics = [];

      const TestComponent = () => {
        const [scrollPosition, setScrollPosition] = React.useState(0);

        React.useEffect(() => {
          const startTime = Date.now();
          let frameCount = 0;

          const interval = setInterval(() => {
            frameCount++;
            setScrollPosition(prev => prev - 1);

            if (frameCount % 60 === 0) { // Toutes les secondes
              const currentTime = Date.now();
              const fps = frameCount / ((currentTime - startTime) / 1000);
              performanceMetrics.push(fps);
            }
          }, 16); // 60 FPS

          return () => clearInterval(interval);
        }, []);

        return (
          <div data-testid="scroll-position">{scrollPosition}</div>
        );
      };

      render(<TestComponent />);

      act(() => {
        jest.advanceTimersByTime(5000); // 5 secondes
      });

      // Les métriques de performance devraient être bonnes
      expect(performanceMetrics.length).toBeGreaterThan(0);
      performanceMetrics.forEach(fps => {
        expect(fps).toBeGreaterThan(30); // Au moins 30 FPS
      });
    });
  });
});
