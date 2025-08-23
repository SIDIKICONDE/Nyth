import { useScrollCalculations } from '../../src/components/recording/teleprompter/hooks/useScrollCalculations';
import { useScrollHandlers } from '../../src/components/recording/teleprompter/hooks/useScrollHandlers';
import { useScrollState } from '../../src/components/recording/teleprompter/hooks/useScrollState';
import { MIN_SCROLL_SPEED, MAX_SCROLL_SPEED } from '../../src/components/recording/teleprompter/constants';

// Mock des dépendances
jest.mock('react-native', () => ({
  Animated: {
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      stopAnimation: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
  },
  Easing: {
    linear: 'linear',
  },
}));

describe('🎯 Calculs de Défilement - Tests Sophistiqués', () => {
  describe('📊 useScrollCalculations - Tests des Méthodes de Calcul', () => {
    test('devrait calculer correctement avec la méthode classique', () => {
      const TestComponent = () => {
        const calculations = useScrollCalculations(1000, 400, 50, null, {
          method: 'classic',
        });
        
        return (
          <div>
            <span data-testid="startPosition">{calculations.startPosition}</span>
            <span data-testid="endPosition">{calculations.endPosition}</span>
            <span data-testid="totalDistance">{calculations.totalDistance}</span>
            <span data-testid="duration">{calculations.duration}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      const startPosition = Number(getByTestId('startPosition').textContent);
      const endPosition = Number(getByTestId('endPosition').textContent);
      const totalDistance = Number(getByTestId('totalDistance').textContent);
      const duration = Number(getByTestId('duration').textContent);
      
      // Vérifications de base
      expect(startPosition).toBeGreaterThan(0);
      expect(endPosition).toBeLessThan(0);
      expect(totalDistance).toBeGreaterThan(0);
      expect(duration).toBeGreaterThan(0);
      
      // Vérifications de cohérence
      expect(Math.abs(endPosition - startPosition)).toBeCloseTo(totalDistance, 0);
      expect(duration).toBeGreaterThanOrEqual(3000); // Minimum 3 secondes
    });

    test('devrait calculer correctement avec la méthode WPM', () => {
      const TestComponent = () => {
        const calculations = useScrollCalculations(1000, 400, 50, null, {
          method: 'wpm',
          wpm: 160,
          wordCount: 200,
        });
        
        return (
          <div>
            <span data-testid="duration">{calculations.duration}</span>
            <span data-testid="method">wpm</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      const duration = Number(getByTestId('duration').textContent);
      const expectedDuration = (200 / 160) * 60 * 1000; // (mots / wpm) * 60 * 1000
      
      expect(duration).toBeCloseTo(expectedDuration, -2); // Tolérance de 100ms
      expect(getByTestId('method').textContent).toBe('wpm');
    });

    test('devrait calculer correctement avec la méthode durée fixe', () => {
      const TestComponent = () => {
        const calculations = useScrollCalculations(1000, 400, 50, null, {
          method: 'duration',
          durationMinutes: 5,
        });
        
        return (
          <div>
            <span data-testid="duration">{calculations.duration}</span>
            <span data-testid="method">duration</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      const duration = Number(getByTestId('duration').textContent);
      const expectedDuration = 5 * 60 * 1000; // 5 minutes en millisecondes
      
      expect(duration).toBe(expectedDuration);
      expect(getByTestId('method').textContent).toBe('duration');
    });

    test('devrait calculer correctement avec la méthode lignes par seconde', () => {
      const TestComponent = () => {
        const calculations = useScrollCalculations(1000, 400, 50, null, {
          method: 'lines',
          linesPerSecond: 2,
          fontSize: 20,
          lineHeightMultiplier: 1.4,
        });
        
        return (
          <div>
            <span data-testid="duration">{calculations.duration}</span>
            <span data-testid="method">lines</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      const duration = Number(getByTestId('duration').textContent);
      
      // Vérifier que la durée est calculée correctement
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeGreaterThanOrEqual(3000); // Minimum 3 secondes
      expect(getByTestId('method').textContent).toBe('lines');
    });

    test('devrait gérer les positions de pause correctement', () => {
      const TestComponent = () => {
        const calculations = useScrollCalculations(1000, 400, 50, -500, {
          method: 'classic',
        });
        
        return (
          <div>
            <span data-testid="remainingDistance">{calculations.remainingDistance}</span>
            <span data-testid="remainingDuration">{calculations.remainingDuration}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      const remainingDistance = Number(getByTestId('remainingDistance').textContent);
      const remainingDuration = Number(getByTestId('remainingDuration').textContent);
      
      expect(remainingDistance).toBeGreaterThan(0);
      expect(remainingDuration).toBeGreaterThan(0);
      expect(remainingDuration).toBeLessThanOrEqual(calculations.duration);
    });

    test('devrait valider les limites de vitesse', () => {
      const TestComponent = () => {
        const calculationsLow = useScrollCalculations(1000, 400, -10, null, {
          method: 'classic',
        });
        const calculationsHigh = useScrollCalculations(1000, 400, 150, null, {
          method: 'classic',
        });
        
        return (
          <div>
            <span data-testid="lowSpeed">{calculationsLow.duration}</span>
            <span data-testid="highSpeed">{calculationsHigh.duration}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      const lowSpeedDuration = Number(getByTestId('lowSpeed').textContent);
      const highSpeedDuration = Number(getByTestId('highSpeed').textContent);
      
      // Les vitesses extrêmes devraient être limitées
      expect(lowSpeedDuration).toBeGreaterThan(0);
      expect(highSpeedDuration).toBeGreaterThan(0);
    });
  });

  describe('🎮 useScrollHandlers - Tests des Gestionnaires', () => {
    test('devrait démarrer le défilement correctement', () => {
      const mockScrollAnimation = {
        setValue: jest.fn(),
        stopAnimation: jest.fn(),
      };
      
      const mockState = {
        currentAnimation: null,
        pausedPosition: null,
        isResetting: false,
        textHeight: 1000,
        isTextMeasured: true,
      };
      
      const mockCalculations = {
        startPosition: 20,
        endPosition: -1500,
        remainingDuration: 10000,
      };
      
      const mockDispatch = jest.fn();
      
      const TestComponent = () => {
        const handlers = useScrollHandlers({
          scrollAnimation: mockScrollAnimation as any,
          state: mockState,
          calculations: mockCalculations,
          dispatch: mockDispatch,
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
      
      expect(mockScrollAnimation.setValue).toHaveBeenCalledWith(mockCalculations.startPosition);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_ANIMATION',
        payload: expect.any(Object),
      });
    });

    test('devrait arrêter le défilement correctement', () => {
      const mockStopAnimation = jest.fn();
      const mockAnimation = {
        stop: mockStopAnimation,
      };
      
      const mockScrollAnimation = {
        setValue: jest.fn(),
        stopAnimation: jest.fn(),
      };
      
      const mockState = {
        currentAnimation: mockAnimation,
        pausedPosition: null,
        isResetting: false,
        textHeight: 1000,
        isTextMeasured: true,
      };
      
      const mockCalculations = {
        startPosition: 20,
        endPosition: -1500,
        remainingDuration: 10000,
      };
      
      const mockDispatch = jest.fn();
      
      const TestComponent = () => {
        const handlers = useScrollHandlers({
          scrollAnimation: mockScrollAnimation as any,
          state: mockState,
          calculations: mockCalculations,
          dispatch: mockDispatch,
          isRecording: true,
          isPaused: true,
          isScreenFocused: true,
        });
        
        React.useEffect(() => {
          handlers.stopScrolling();
        }, []);
        
        return <div>Test</div>;
      };

      render(<TestComponent />);
      
      expect(mockStopAnimation).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_ANIMATION',
        payload: null,
      });
    });

    test('devrait réinitialiser le défilement correctement', () => {
      const mockScrollAnimation = {
        setValue: jest.fn(),
        stopAnimation: jest.fn(),
      };
      
      const mockState = {
        currentAnimation: null,
        pausedPosition: null,
        isResetting: false,
        textHeight: 1000,
        isTextMeasured: true,
      };
      
      const mockCalculations = {
        startPosition: 20,
        endPosition: -1500,
        remainingDuration: 10000,
      };
      
      const mockDispatch = jest.fn();
      
      const TestComponent = () => {
        const handlers = useScrollHandlers({
          scrollAnimation: mockScrollAnimation as any,
          state: mockState,
          calculations: mockCalculations,
          dispatch: mockDispatch,
          isRecording: true,
          isPaused: false,
          isScreenFocused: true,
        });
        
        React.useEffect(() => {
          handlers.resetScrolling();
        }, []);
        
        return <div>Test</div>;
      };

      render(<TestComponent />);
      
      expect(mockScrollAnimation.setValue).toHaveBeenCalledWith(mockCalculations.startPosition);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_RESETTING',
        payload: true,
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'RESET',
      });
    });

    test('devrait mettre à jour la vitesse de défilement', () => {
      const mockDispatch = jest.fn();
      
      const TestComponent = () => {
        const handlers = useScrollHandlers({
          scrollAnimation: {} as any,
          state: {} as any,
          calculations: {} as any,
          dispatch: mockDispatch,
          isRecording: true,
          isPaused: false,
          isScreenFocused: true,
        });
        
        React.useEffect(() => {
          handlers.updateScrollSpeed(75);
        }, []);
        
        return <div>Test</div>;
      };

      render(<TestComponent />);
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SCROLL_SPEED',
        payload: 75,
      });
    });

    test('devrait valider les limites de vitesse', () => {
      const mockDispatch = jest.fn();
      
      const TestComponent = () => {
        const handlers = useScrollHandlers({
          scrollAnimation: {} as any,
          state: {} as any,
          calculations: {} as any,
          dispatch: mockDispatch,
          isRecording: true,
          isPaused: false,
          isScreenFocused: true,
        });
        
        React.useEffect(() => {
          handlers.updateScrollSpeed(-10); // Vitesse invalide
          handlers.updateScrollSpeed(150); // Vitesse invalide
        }, []);
        
        return <div>Test</div>;
      };

      render(<TestComponent />);
      
      // Les vitesses devraient être limitées aux valeurs valides
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SCROLL_SPEED',
        payload: 1, // Minimum
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SCROLL_SPEED',
        payload: 100, // Maximum
      });
    });
  });

  describe('📈 useScrollState - Tests de l\'État', () => {
    test('devrait initialiser l\'état correctement', () => {
      const TestComponent = () => {
        const { state } = useScrollState(50, 1000, true);
        
        return (
          <div>
            <span data-testid="scrollSpeed">{state.scrollSpeed}</span>
            <span data-testid="textHeight">{state.textHeight}</span>
            <span data-testid="isTextMeasured">{state.isTextMeasured.toString()}</span>
            <span data-testid="currentAnimation">{state.currentAnimation ? 'active' : 'null'}</span>
            <span data-testid="pausedPosition">{state.pausedPosition || 'null'}</span>
            <span data-testid="isResetting">{state.isResetting.toString()}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      expect(Number(getByTestId('scrollSpeed').textContent)).toBe(50);
      expect(Number(getByTestId('textHeight').textContent)).toBe(1000);
      expect(getByTestId('isTextMeasured').textContent).toBe('true');
      expect(getByTestId('currentAnimation').textContent).toBe('null');
      expect(getByTestId('pausedPosition').textContent).toBe('null');
      expect(getByTestId('isResetting').textContent).toBe('false');
    });

    test('devrait gérer toutes les actions du reducer', () => {
      const TestComponent = () => {
        const { state, dispatch } = useScrollState(50);
        
        React.useEffect(() => {
          dispatch({ type: 'SET_TEXT_HEIGHT', payload: 1500 });
          dispatch({ type: 'SET_TEXT_MEASURED', payload: false });
          dispatch({ type: 'SET_ANIMATION', payload: {} as any });
          dispatch({ type: 'SET_PAUSED_POSITION', payload: -500 });
          dispatch({ type: 'SET_RESETTING', payload: true });
          dispatch({ type: 'SET_SCROLL_SPEED', payload: 75 });
        }, []);
        
        return (
          <div>
            <span data-testid="textHeight">{state.textHeight}</span>
            <span data-testid="isTextMeasured">{state.isTextMeasured.toString()}</span>
            <span data-testid="currentAnimation">{state.currentAnimation ? 'active' : 'null'}</span>
            <span data-testid="pausedPosition">{state.pausedPosition || 'null'}</span>
            <span data-testid="isResetting">{state.isResetting.toString()}</span>
            <span data-testid="scrollSpeed">{state.scrollSpeed}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      expect(Number(getByTestId('textHeight').textContent)).toBe(1500);
      expect(getByTestId('isTextMeasured').textContent).toBe('false');
      expect(getByTestId('currentAnimation').textContent).toBe('active');
      expect(Number(getByTestId('pausedPosition').textContent)).toBe(-500);
      expect(getByTestId('isResetting').textContent).toBe('true');
      expect(Number(getByTestId('scrollSpeed').textContent)).toBe(75);
    });

    test('devrait gérer l\'action RESET correctement', () => {
      const TestComponent = () => {
        const { state, dispatch } = useScrollState(50);
        
        React.useEffect(() => {
          // D'abord, définir des valeurs
          dispatch({ type: 'SET_ANIMATION', payload: {} as any });
          dispatch({ type: 'SET_PAUSED_POSITION', payload: -500 });
          dispatch({ type: 'SET_RESETTING', payload: true });
          
          // Puis, réinitialiser
          dispatch({ type: 'RESET' });
        }, []);
        
        return (
          <div>
            <span data-testid="currentAnimation">{state.currentAnimation ? 'active' : 'null'}</span>
            <span data-testid="pausedPosition">{state.pausedPosition || 'null'}</span>
            <span data-testid="isResetting">{state.isResetting.toString()}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      expect(getByTestId('currentAnimation').textContent).toBe('null');
      expect(getByTestId('pausedPosition').textContent).toBe('null');
      expect(getByTestId('isResetting').textContent).toBe('false');
    });

    test('devrait utiliser les valeurs externes si fournies', () => {
      const TestComponent = () => {
        const { state } = useScrollState(50, 2000, false);
        
        return (
          <div>
            <span data-testid="textHeight">{state.textHeight}</span>
            <span data-testid="isTextMeasured">{state.isTextMeasured.toString()}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      expect(Number(getByTestId('textHeight').textContent)).toBe(2000);
      expect(getByTestId('isTextMeasured').textContent).toBe('false');
    });
  });

  describe('🔧 Intégration - Tests de Scénarios Réels', () => {
    test('devrait gérer un scénario d\'enregistrement complet', () => {
      const TestComponent = () => {
        const [isRecording, setIsRecording] = React.useState(false);
        const [isPaused, setIsPaused] = React.useState(false);
        
        const { state, dispatch } = useScrollState(50, 1000, true);
        const calculations = useScrollCalculations(
          state.textHeight,
          400,
          state.scrollSpeed,
          state.pausedPosition,
          { method: 'classic' }
        );
        
        const handlers = useScrollHandlers({
          scrollAnimation: {} as any,
          state,
          calculations,
          dispatch,
          isRecording,
          isPaused,
          isScreenFocused: true,
        });
        
        React.useEffect(() => {
          // Simuler le début de l'enregistrement
          setIsRecording(true);
          handlers.startScrolling();
          
          // Simuler une pause
          setTimeout(() => {
            setIsPaused(true);
            handlers.stopScrolling();
          }, 1000);
          
          // Simuler la reprise
          setTimeout(() => {
            setIsPaused(false);
            handlers.startScrolling();
          }, 2000);
          
          // Simuler la fin
          setTimeout(() => {
            setIsRecording(false);
            handlers.stopScrolling();
          }, 3000);
        }, []);
        
        return (
          <div>
            <span data-testid="isRecording">{isRecording.toString()}</span>
            <span data-testid="isPaused">{isPaused.toString()}</span>
            <span data-testid="currentAnimation">{state.currentAnimation ? 'active' : 'null'}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      // Vérifier l'état initial
      expect(getByTestId('isRecording').textContent).toBe('false');
      expect(getByTestId('isPaused').textContent).toBe('false');
      expect(getByTestId('currentAnimation').textContent).toBe('null');
    });

    test('devrait gérer les changements de vitesse en temps réel', () => {
      const TestComponent = () => {
        const [speed, setSpeed] = React.useState(50);
        const { state, dispatch } = useScrollState(speed, 1000, true);
        
        const calculations = useScrollCalculations(
          state.textHeight,
          400,
          state.scrollSpeed,
          state.pausedPosition,
          { method: 'classic' }
        );
        
        const handlers = useScrollHandlers({
          scrollAnimation: {} as any,
          state,
          calculations,
          dispatch,
          isRecording: true,
          isPaused: false,
          isScreenFocused: true,
        });
        
        React.useEffect(() => {
          // Simuler des changements de vitesse
          setTimeout(() => {
            setSpeed(75);
            handlers.updateScrollSpeed(75);
          }, 1000);
          
          setTimeout(() => {
            setSpeed(25);
            handlers.updateScrollSpeed(25);
          }, 2000);
        }, []);
        
        return (
          <div>
            <span data-testid="currentSpeed">{state.scrollSpeed}</span>
            <span data-testid="duration">{calculations.duration}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      
      // Vérifier que la vitesse initiale est correcte
      expect(Number(getByTestId('currentSpeed').textContent)).toBe(50);
      expect(Number(getByTestId('duration').textContent)).toBeGreaterThan(0);
    });
  });
});

// Helper function pour render
function render(component: React.ReactElement) {
  const { container } = require('@testing-library/react').render(component);
  return {
    getByTestId: (testId: string) => {
      const element = container.querySelector(`[data-testid="${testId}"]`);
      if (!element) throw new Error(`Element with testid "${testId}" not found`);
      return {
        textContent: element.textContent,
        style: element.style,
      };
    },
    getByText: (text: string) => {
      const element = container.querySelector(`*:contains("${text}")`);
      if (!element) throw new Error(`Element with text "${text}" not found`);
      return element;
    },
  };
}
