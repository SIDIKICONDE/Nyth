import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Animated, PanResponder } from 'react-native';
import { useContainerGestures } from '../../src/components/recording/teleprompter/useContainerGestures';
import { useDoubleTapHandler } from '../../src/components/recording/teleprompter/hooks/useDoubleTapHandler';
import { useTouchHandlers } from '../../src/components/recording/teleprompter/hooks/useTouchHandlers';
import { TouchPauseHandler } from '../../src/components/recording/teleprompter/TouchPauseHandler';

// Mock des dépendances
jest.mock('react-native', () => ({
  Animated: {
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      stopAnimation: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      setOffset: jest.fn(),
      flattenOffset: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
  },
  PanResponder: {
    create: jest.fn(() => ({
      panHandlers: {
        onStartShouldSetPanResponder: jest.fn(),
        onMoveShouldSetPanResponder: jest.fn(),
        onPanResponderGrant: jest.fn(),
        onPanResponderMove: jest.fn(),
        onPanResponderRelease: jest.fn(),
      },
    })),
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('🎮 Gestes et Interactions - Tests Sophistiqués', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('🖐️ useContainerGestures - Tests des Gestes de Conteneur', () => {
    test('devrait initialiser les gestes de déplacement correctement', () => {
      const mockOnResize = jest.fn();
      const mockOnResizeEnd = jest.fn();

      const TestComponent = () => {
        const [containerState, panResponder, resizePanResponder, resetPosition] = useContainerGestures(
          mockOnResize,
          mockOnResizeEnd
        );

        React.useEffect(() => {
          // Vérifier l'état initial
          expect(containerState.containerHeight).toBeGreaterThan(0);
          expect(containerState.isDragging).toBe(false);
          expect(containerState.isResizing).toBe(false);
        }, []);

        return (
          <div>
            <span data-testid="containerHeight">{containerState.containerHeight}</span>
            <span data-testid="isDragging">{containerState.isDragging.toString()}</span>
            <span data-testid="isResizing">{containerState.isResizing.toString()}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      expect(Number(getByTestId('containerHeight').textContent)).toBeGreaterThan(0);
      expect(getByTestId('isDragging').textContent).toBe('false');
      expect(getByTestId('isResizing').textContent).toBe('false');
    });

    test('devrait gérer le déplacement du conteneur', () => {
      const mockOnResize = jest.fn();
      const mockOnResizeEnd = jest.fn();

      const TestComponent = () => {
        const [containerState, panResponder, resizePanResponder, resetPosition] = useContainerGestures(
          mockOnResize,
          mockOnResizeEnd
        );

        const handlePanGrant = () => {
          // Simuler le début du déplacement
          if (panResponder.panHandlers.onPanResponderGrant) {
            panResponder.panHandlers.onPanResponderGrant(
              { nativeEvent: { pageX: 100, pageY: 200 } } as any,
              { y0: 200, dy: 0 } as any
            );
          }
        };

        const handlePanMove = () => {
          // Simuler le mouvement
          if (panResponder.panHandlers.onPanResponderMove) {
            panResponder.panHandlers.onPanResponderMove(
              { nativeEvent: { pageX: 100, pageY: 250 } } as any,
              { y0: 200, dy: 50 } as any
            );
          }
        };

        const handlePanRelease = () => {
          // Simuler la fin du déplacement
          if (panResponder.panHandlers.onPanResponderRelease) {
            panResponder.panHandlers.onPanResponderRelease(
              { nativeEvent: { pageX: 100, pageY: 250 } } as any,
              { y0: 200, dy: 50 } as any
            );
          }
        };

        return (
          <div>
            <button onClick={handlePanGrant} data-testid="pan-grant">Start Pan</button>
            <button onClick={handlePanMove} data-testid="pan-move">Move Pan</button>
            <button onClick={handlePanRelease} data-testid="pan-release">End Pan</button>
            <span data-testid="isDragging">{containerState.isDragging.toString()}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Simuler le début du déplacement
      fireEvent.press(getByTestId('pan-grant'));
      expect(getByTestId('isDragging').textContent).toBe('true');

      // Simuler le mouvement
      fireEvent.press(getByTestId('pan-move'));

      // Simuler la fin du déplacement
      fireEvent.press(getByTestId('pan-release'));
      expect(getByTestId('isDragging').textContent).toBe('false');
    });

    test('devrait gérer le redimensionnement du conteneur', () => {
      const mockOnResize = jest.fn();
      const mockOnResizeEnd = jest.fn();

      const TestComponent = () => {
        const [containerState, panResponder, resizePanResponder, resetPosition] = useContainerGestures(
          mockOnResize,
          mockOnResizeEnd
        );

        const handleResizeGrant = () => {
          // Simuler le début du redimensionnement
          if (resizePanResponder.panHandlers.onPanResponderGrant) {
            resizePanResponder.panHandlers.onPanResponderGrant(
              { nativeEvent: { pageX: 100, pageY: 200 } } as any,
              { y0: 200, dy: 0 } as any
            );
          }
        };

        const handleResizeMove = () => {
          // Simuler le redimensionnement
          if (resizePanResponder.panHandlers.onPanResponderMove) {
            resizePanResponder.panHandlers.onPanResponderMove(
              { nativeEvent: { pageX: 100, pageY: 250 } } as any,
              { y0: 200, dy: 50 } as any
            );
          }
        };

        const handleResizeRelease = () => {
          // Simuler la fin du redimensionnement
          if (resizePanResponder.panHandlers.onPanResponderRelease) {
            resizePanResponder.panHandlers.onPanResponderRelease(
              { nativeEvent: { pageX: 100, pageY: 250 } } as any,
              { y0: 200, dy: 50 } as any
            );
          }
        };

        return (
          <div>
            <button onClick={handleResizeGrant} data-testid="resize-grant">Start Resize</button>
            <button onClick={handleResizeMove} data-testid="resize-move">Resize</button>
            <button onClick={handleResizeRelease} data-testid="resize-release">End Resize</button>
            <span data-testid="isResizing">{containerState.isResizing.toString()}</span>
            <span data-testid="containerHeight">{containerState.containerHeight}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      const initialHeight = Number(getByTestId('containerHeight').textContent);

      // Simuler le début du redimensionnement
      fireEvent.press(getByTestId('resize-grant'));
      expect(getByTestId('isResizing').textContent).toBe('true');

      // Simuler le redimensionnement
      fireEvent.press(getByTestId('resize-move'));
      expect(mockOnResize).toHaveBeenCalled();

      // Simuler la fin du redimensionnement
      fireEvent.press(getByTestId('resize-release'));
      expect(getByTestId('isResizing').textContent).toBe('false');
      expect(mockOnResizeEnd).toHaveBeenCalled();
    });

    test('devrait réinitialiser la position du conteneur', () => {
      const mockOnResize = jest.fn();
      const mockOnResizeEnd = jest.fn();

      const TestComponent = () => {
        const [containerState, panResponder, resizePanResponder, resetPosition] = useContainerGestures(
          mockOnResize,
          mockOnResizeEnd
        );

        const handleReset = () => {
          resetPosition();
        };

        return (
          <div>
            <button onClick={handleReset} data-testid="reset-position">Reset Position</button>
            <span data-testid="containerHeight">{containerState.containerHeight}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      const initialHeight = Number(getByTestId('containerHeight').textContent);

      // Réinitialiser la position
      fireEvent.press(getByTestId('reset-position'));

      // Vérifier que la hauteur est réinitialisée
      expect(Number(getByTestId('containerHeight').textContent)).toBe(initialHeight);
    });
  });

  describe('👆 useDoubleTapHandler - Tests du Double-Tap', () => {
    test('devrait détecter un double-tap correctement', async () => {
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
            Double Tap Area
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Simuler un double-tap rapide
      fireEvent.touchStart(getByTestId('double-tap-area'));
      fireEvent.touchEnd(getByTestId('double-tap-area'));
      
      // Attendre un peu puis faire un second tap
      act(() => {
        jest.advanceTimersByTime(200);
      });

      fireEvent.touchStart(getByTestId('double-tap-area'));
      fireEvent.touchEnd(getByTestId('double-tap-area'));

      await waitFor(() => {
        expect(mockSetShowResetIndicator).toHaveBeenCalledWith(true);
        expect(mockSetIsResetting).toHaveBeenCalledWith(true);
        expect(mockScrollHandlers.stopScrolling).toHaveBeenCalled();
        expect(mockScrollHandlers.resetScrolling).toHaveBeenCalled();
      });
    });

    test('devrait ignorer les taps trop espacés', async () => {
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
            Double Tap Area
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Premier tap
      fireEvent.touchStart(getByTestId('double-tap-area'));
      fireEvent.touchEnd(getByTestId('double-tap-area'));

      // Attendre trop longtemps
      act(() => {
        jest.advanceTimersByTime(500); // Plus que le délai de double-tap
      });

      // Second tap
      fireEvent.touchStart(getByTestId('double-tap-area'));
      fireEvent.touchEnd(getByTestId('double-tap-area'));

      // Le double-tap ne devrait pas être détecté
      expect(mockSetShowResetIndicator).not.toHaveBeenCalled();
      expect(mockSetIsResetting).not.toHaveBeenCalled();
    });

    test('devrait gérer les double-taps pendant l\'enregistrement', async () => {
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
            Double Tap Area
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Simuler un double-tap pendant l'enregistrement
      fireEvent.touchStart(getByTestId('double-tap-area'));
      fireEvent.touchEnd(getByTestId('double-tap-area'));
      
      act(() => {
        jest.advanceTimersByTime(200);
      });

      fireEvent.touchStart(getByTestId('double-tap-area'));
      fireEvent.touchEnd(getByTestId('double-tap-area'));

      await waitFor(() => {
        expect(mockSetShowResetIndicator).toHaveBeenCalledWith(true);
        expect(mockSetIsResetting).toHaveBeenCalledWith(true);
        expect(mockScrollHandlers.stopScrolling).toHaveBeenCalled();
        expect(mockScrollHandlers.resetScrolling).toHaveBeenCalled();
      });

      // Vérifier que le défilement redémarre après la réinitialisation
      act(() => {
        jest.advanceTimersByTime(250); // Attendre la fin de la réinitialisation
      });

      expect(mockScrollHandlers.startScrolling).toHaveBeenCalled();
    });
  });

  describe('🖐️ useTouchHandlers - Tests des Gestionnaires de Touches', () => {
    test('devrait gérer le toggle pause/reprise', () => {
      const mockSetIsTouchPaused = jest.fn();
      const mockScrollHandlers = {
        stopScrolling: jest.fn(),
        startScrolling: jest.fn(),
      };

      const TestComponent = () => {
        const [isTouchPaused, setIsTouchPaused] = React.useState(false);
        
        const { handleTogglePause } = useTouchHandlers({
          isRecording: true,
          isPaused: false,
          isTouchPaused,
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

      // Simuler un tap pour mettre en pause
      fireEvent.touchStart(getByTestId('touch-area'));
      
      expect(mockSetIsTouchPaused).toHaveBeenCalledWith(true);
      expect(mockScrollHandlers.stopScrolling).toHaveBeenCalled();
    });

    test('devrait gérer la pause pendant le maintien', () => {
      const mockSetIsTouchPaused = jest.fn();
      const mockScrollHandlers = {
        stopScrolling: jest.fn(),
        startScrolling: jest.fn(),
      };

      const TestComponent = () => {
        const { handlePauseScroll, handleResumeScroll } = useTouchHandlers({
          isRecording: true,
          isPaused: false,
          isTouchPaused: false,
          isResetting: false,
          setIsTouchPaused: mockSetIsTouchPaused,
          scrollHandlers: mockScrollHandlers,
        });

        return (
          <div>
            <div onTouchStart={handlePauseScroll} data-testid="pause-area">Pause Area</div>
            <div onTouchEnd={handleResumeScroll} data-testid="resume-area">Resume Area</div>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Simuler le début de la pause
      fireEvent.touchStart(getByTestId('pause-area'));
      expect(mockSetIsTouchPaused).toHaveBeenCalledWith(true);
      expect(mockScrollHandlers.stopScrolling).toHaveBeenCalled();

      // Simuler la fin de la pause
      fireEvent.touchEnd(getByTestId('resume-area'));
      expect(mockSetIsTouchPaused).toHaveBeenCalledWith(false);
    });

    test('devrait ignorer les touches quand l\'enregistrement est arrêté', () => {
      const mockSetIsTouchPaused = jest.fn();
      const mockScrollHandlers = {
        stopScrolling: jest.fn(),
        startScrolling: jest.fn(),
      };

      const TestComponent = () => {
        const { handleTogglePause } = useTouchHandlers({
          isRecording: false, // Enregistrement arrêté
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

      // Simuler un tap
      fireEvent.touchStart(getByTestId('touch-area'));
      
      // Les gestionnaires ne devraient pas être appelés
      expect(mockSetIsTouchPaused).not.toHaveBeenCalled();
      expect(mockScrollHandlers.stopScrolling).not.toHaveBeenCalled();
    });

    test('devrait ignorer les touches pendant la réinitialisation', () => {
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
          isResetting: true, // En cours de réinitialisation
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

      // Simuler un tap
      fireEvent.touchStart(getByTestId('touch-area'));
      
      // Les gestionnaires ne devraient pas être appelés
      expect(mockSetIsTouchPaused).not.toHaveBeenCalled();
      expect(mockScrollHandlers.stopScrolling).not.toHaveBeenCalled();
    });
  });

  describe('🎯 TouchPauseHandler - Tests du Gestionnaire de Touches', () => {
    test('devrait gérer les différents types de touches', () => {
      const mockOnTogglePause = jest.fn();
      const mockOnPauseScroll = jest.fn();
      const mockOnResumeScroll = jest.fn();
      const mockOnDoubleTap = jest.fn();

      const TestComponent = () => {
        return (
          <TouchPauseHandler
            onTogglePause={mockOnTogglePause}
            onPauseScroll={mockOnPauseScroll}
            onResumeScroll={mockOnResumeScroll}
            onDoubleTap={mockOnDoubleTap}
          >
            <div data-testid="content">Content</div>
          </TouchPauseHandler>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Simuler un tap rapide
      fireEvent.touchStart(getByTestId('content'));
      
      act(() => {
        jest.advanceTimersByTime(100); // Tap rapide
      });
      
      fireEvent.touchEnd(getByTestId('content'));

      // Attendre que le tap soit traité
      act(() => {
        jest.advanceTimersByTime(350); // Plus que le délai de double-tap
      });

      expect(mockOnTogglePause).toHaveBeenCalled();
    });

    test('devrait gérer le maintien prolongé', () => {
      const mockOnTogglePause = jest.fn();
      const mockOnPauseScroll = jest.fn();
      const mockOnResumeScroll = jest.fn();
      const mockOnDoubleTap = jest.fn();

      const TestComponent = () => {
        return (
          <TouchPauseHandler
            onTogglePause={mockOnTogglePause}
            onPauseScroll={mockOnPauseScroll}
            onResumeScroll={mockOnResumeScroll}
            onDoubleTap={mockOnDoubleTap}
          >
            <div data-testid="content">Content</div>
          </TouchPauseHandler>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Simuler un maintien prolongé
      fireEvent.touchStart(getByTestId('content'));
      
      act(() => {
        jest.advanceTimersByTime(600); // Plus que le délai de maintien
      });
      
      fireEvent.touchEnd(getByTestId('content'));

      expect(mockOnPauseScroll).toHaveBeenCalled();
      expect(mockOnResumeScroll).toHaveBeenCalled();
    });

    test('devrait gérer le double-tap avec distance', () => {
      const mockOnTogglePause = jest.fn();
      const mockOnPauseScroll = jest.fn();
      const mockOnResumeScroll = jest.fn();
      const mockOnDoubleTap = jest.fn();

      const TestComponent = () => {
        return (
          <TouchPauseHandler
            onTogglePause={mockOnTogglePause}
            onPauseScroll={mockOnPauseScroll}
            onResumeScroll={mockOnResumeScroll}
            onDoubleTap={mockOnDoubleTap}
          >
            <div data-testid="content">Content</div>
          </TouchPauseHandler>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Premier tap à une position
      fireEvent.touchStart(getByTestId('content'), {
        nativeEvent: { pageX: 100, pageY: 100 }
      });
      fireEvent.touchEnd(getByTestId('content'));
      
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Second tap à une position proche
      fireEvent.touchStart(getByTestId('content'), {
        nativeEvent: { pageX: 120, pageY: 120 }
      });
      fireEvent.touchEnd(getByTestId('content'));

      expect(mockOnDoubleTap).toHaveBeenCalled();
    });

    test('devrait ignorer le double-tap si les positions sont trop éloignées', () => {
      const mockOnTogglePause = jest.fn();
      const mockOnPauseScroll = jest.fn();
      const mockOnResumeScroll = jest.fn();
      const mockOnDoubleTap = jest.fn();

      const TestComponent = () => {
        return (
          <TouchPauseHandler
            onTogglePause={mockOnTogglePause}
            onPauseScroll={mockOnPauseScroll}
            onResumeScroll={mockOnResumeScroll}
            onDoubleTap={mockOnDoubleTap}
          >
            <div data-testid="content">Content</div>
          </TouchPauseHandler>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Premier tap à une position
      fireEvent.touchStart(getByTestId('content'), {
        nativeEvent: { pageX: 100, pageY: 100 }
      });
      fireEvent.touchEnd(getByTestId('content'));
      
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Second tap à une position éloignée
      fireEvent.touchStart(getByTestId('content'), {
        nativeEvent: { pageX: 200, pageY: 200 }
      });
      fireEvent.touchEnd(getByTestId('content'));

      expect(mockOnDoubleTap).not.toHaveBeenCalled();
    });
  });

  describe('🔧 Intégration - Tests de Scénarios Complexes', () => {
    test('devrait gérer une séquence complexe d\'interactions', async () => {
      const mockSetShowResetIndicator = jest.fn();
      const mockSetIsResetting = jest.fn();
      const mockSetIsTouchPaused = jest.fn();
      const mockScrollHandlers = {
        stopScrolling: jest.fn(),
        resetScrolling: jest.fn(),
        startScrolling: jest.fn(),
      };

      const TestComponent = () => {
        const [isTouchPaused, setIsTouchPaused] = React.useState(false);
        
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

        const { handleTogglePause } = useTouchHandlers({
          isRecording: true,
          isPaused: false,
          isTouchPaused,
          isResetting: false,
          setIsTouchPaused: mockSetIsTouchPaused,
          scrollHandlers: mockScrollHandlers,
        });

        return (
          <div>
            <div onTouchStart={handleDoubleTap} data-testid="double-tap-area">
              Double Tap Area
            </div>
            <div onTouchStart={handleTogglePause} data-testid="toggle-area">
              Toggle Area
            </div>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // 1. Commencer par un double-tap pour réinitialiser
      fireEvent.touchStart(getByTestId('double-tap-area'));
      fireEvent.touchEnd(getByTestId('double-tap-area'));
      
      act(() => {
        jest.advanceTimersByTime(200);
      });

      fireEvent.touchStart(getByTestId('double-tap-area'));
      fireEvent.touchEnd(getByTestId('double-tap-area'));

      await waitFor(() => {
        expect(mockSetShowResetIndicator).toHaveBeenCalledWith(true);
        expect(mockSetIsResetting).toHaveBeenCalledWith(true);
      });

      // 2. Attendre la fin de la réinitialisation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 3. Faire un toggle pause
      fireEvent.touchStart(getByTestId('toggle-area'));
      
      expect(mockSetIsTouchPaused).toHaveBeenCalledWith(true);
      expect(mockScrollHandlers.stopScrolling).toHaveBeenCalled();

      // 4. Vérifier que le défilement redémarre après la réinitialisation
      expect(mockScrollHandlers.startScrolling).toHaveBeenCalled();
    });

    test('devrait gérer les interactions pendant les transitions d\'état', () => {
      const mockOnResize = jest.fn();
      const mockOnResizeEnd = jest.fn();

      const TestComponent = () => {
        const [isRecording, setIsRecording] = React.useState(false);
        const [isPaused, setIsPaused] = React.useState(false);
        
        const [containerState, panResponder, resizePanResponder, resetPosition] = useContainerGestures(
          mockOnResize,
          mockOnResizeEnd
        );

        const { handleTogglePause } = useTouchHandlers({
          isRecording,
          isPaused,
          isTouchPaused: false,
          isResetting: false,
          setIsTouchPaused: jest.fn(),
          scrollHandlers: {
            stopScrolling: jest.fn(),
            startScrolling: jest.fn(),
          },
        });

        React.useEffect(() => {
          // Simuler le début de l'enregistrement
          setTimeout(() => setIsRecording(true), 1000);
          
          // Simuler une pause
          setTimeout(() => setIsPaused(true), 2000);
          
          // Simuler la reprise
          setTimeout(() => setIsPaused(false), 3000);
        }, []);

        return (
          <div>
            <span data-testid="isRecording">{isRecording.toString()}</span>
            <span data-testid="isPaused">{isPaused.toString()}</span>
            <span data-testid="isDragging">{containerState.isDragging.toString()}</span>
            <span data-testid="isResizing">{containerState.isResizing.toString()}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Vérifier l'état initial
      expect(getByTestId('isRecording').textContent).toBe('false');
      expect(getByTestId('isPaused').textContent).toBe('false');
      expect(getByTestId('isDragging').textContent).toBe('false');
      expect(getByTestId('isResizing').textContent).toBe('false');

      // Simuler le temps qui passe
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(getByTestId('isRecording').textContent).toBe('true');

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(getByTestId('isPaused').textContent).toBe('true');

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(getByTestId('isPaused').textContent).toBe('false');
    });
  });
});
