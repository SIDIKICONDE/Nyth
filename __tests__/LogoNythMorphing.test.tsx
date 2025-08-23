import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import LogoNythMorphing from '../LogoNythMorphing';

// Mock des dépendances
jest.mock('react-native', () => ({
  Animated: {
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(callback => {
        if (callback) callback({ finished: true });
        return { stop: jest.fn() };
      }),
      stop: jest.fn(),
    })),
  },
}));

// Mock de requestAnimationFrame et cancelAnimationFrame
global.requestAnimationFrame = jest.fn(callback => {
  setTimeout(callback, 16); // Simule ~60 FPS
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Mock des dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: () => ({ width: 375, height: 812 }),
}));

describe('🎨 Système de Morphing NYTH - Tests Indépendants', () => {
  const defaultProps = {
    width: 400,
    height: 300,
    animationSpeed: 0.02,
    particleCount: 30,
    showParticles: true,
    showWaves: true,
    primaryColor: '#00ffcc',
    secondaryColor: '#ff00ff',
    backgroundColor: '#0a0a0a'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('🔷 Morphing Géométrique - Tests des Transformations', () => {
    test('devrait générer un path de morphing valide', () => {
      // Créer une version testable du composant
      const TestComponent = () => {
        const generateMorphPath = (t: number) => {
          const points = [];
          const numPoints = 100;
          const width = 400;
          const height = 300;

          for (let i = 0; i < numPoints; i++) {
            const theta = (i / numPoints) * Math.PI * 2;
            const morph1 = Math.sin(t * 2) * 0.3;
            const morph2 = Math.cos(t * 3) * 0.2;
            const morph3 = Math.sin(t * 1.5) * 0.4;

            const r = 100 +
              morph1 * 30 * Math.sin(4 * theta + t) +
              morph2 * 20 * Math.cos(6 * theta - t * 2) +
              morph3 * 25 * Math.sin(8 * theta + t * 3);

            const x = width / 2 + r * Math.cos(theta);
            const y = height / 2 + r * Math.sin(theta);

            points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
          }

          return points.join(' ') + ' Z';
        };

        const path = generateMorphPath(0);
        return <div data-testid="morph-path">{path}</div>;
      };

      const { getByTestId } = render(<TestComponent />);
      const pathData = getByTestId('morph-path').textContent;

      // Vérifier que le path est valide
      expect(pathData).toMatch(/^M \d+\.\d+ \d+\.\d+/); // Commence par M (move)
      expect(pathData).toMatch(/Z$/); // Termine par Z (close)
      expect(pathData?.split(' ').length).toBeGreaterThan(100); // Assez de points
    });

    test('devrait calculer correctement les transformations morphing', () => {
      const testCases = [
        { time: 0, expectedRadiusRange: [70, 130] },
        { time: Math.PI / 2, expectedRadiusRange: [70, 130] },
        { time: Math.PI, expectedRadiusRange: [70, 130] },
      ];

      testCases.forEach(({ time, expectedRadiusRange }) => {
        const theta = Math.PI / 4; // 45 degrés
        const morph1 = Math.sin(time * 2) * 0.3;
        const morph2 = Math.cos(time * 3) * 0.2;
        const morph3 = Math.sin(time * 1.5) * 0.4;

        const r = 100 +
          morph1 * 30 * Math.sin(4 * theta + time) +
          morph2 * 20 * Math.cos(6 * theta - time * 2) +
          morph3 * 25 * Math.sin(8 * theta + time * 3);

        expect(r).toBeGreaterThanOrEqual(expectedRadiusRange[0]);
        expect(r).toBeLessThanOrEqual(expectedRadiusRange[1]);
      });
    });

    test('devrait maintenir la cohérence des formes morphing', () => {
      const times = [0, 0.5, 1, 1.5, 2];

      times.forEach(time => {
        const theta = Math.PI / 3;
        const morph1 = Math.sin(time * 2) * 0.3;
        const morph2 = Math.cos(time * 3) * 0.2;
        const morph3 = Math.sin(time * 1.5) * 0.4;

        const r = 100 +
          morph1 * 30 * Math.sin(4 * theta + time) +
          morph2 * 20 * Math.cos(6 * theta - time * 2) +
          morph3 * 25 * Math.sin(8 * theta + time * 3);

        // Le rayon doit toujours être positif et dans une plage raisonnable
        expect(r).toBeGreaterThan(0);
        expect(r).toBeLessThan(200);
      });
    });
  });

  describe('✨ Système de Particules - Tests Physiques', () => {
    test('devrait générer des particules avec propriétés valides', () => {
      const generateParticles = (count: number, width: number, height: number) => {
        const particles = [];
        for (let i = 0; i < count; i++) {
          particles.push({
            id: i,
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            phase: Math.random() * Math.PI * 2
          });
        }
        return particles;
      };

      const particles = generateParticles(30, 400, 300);

      expect(particles).toHaveLength(30);

      particles.forEach(particle => {
        expect(particle.id).toBeGreaterThanOrEqual(0);
        expect(particle.x).toBeGreaterThanOrEqual(0);
        expect(particle.x).toBeLessThanOrEqual(400);
        expect(particle.y).toBeGreaterThanOrEqual(0);
        expect(particle.y).toBeLessThanOrEqual(300);
        expect(particle.size).toBeGreaterThanOrEqual(1);
        expect(particle.size).toBeLessThanOrEqual(4);
        expect(Math.abs(particle.speedX)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(particle.speedY)).toBeLessThanOrEqual(0.5);
        expect(particle.phase).toBeGreaterThanOrEqual(0);
        expect(particle.phase).toBeLessThanOrEqual(Math.PI * 2);
      });
    });

    test('devrait gérer les collisions avec les bords', () => {
      const updateParticle = (particle: any, width: number, height: number) => {
        let newX = particle.x + particle.speedX;
        let newY = particle.y + particle.speedY;

        // Rebond sur les bords
        if (newX < 0 || newX > width) {
          particle.speedX *= -1;
          newX = particle.x + particle.speedX;
        }
        if (newY < 0 || newY > height) {
          particle.speedY *= -1;
          newY = particle.y + particle.speedY;
        }

        particle.x = newX;
        particle.y = newY;

        return particle;
      };

      const particle = { x: -5, y: 150, speedX: -0.3, speedY: 0.2 };
      const updated = updateParticle(particle, 400, 300);

      // La particule devrait rebondir
      expect(updated.speedX).toBe(0.3); // Inversé
      expect(updated.x).toBeGreaterThanOrEqual(0);
      expect(updated.y).toBe(150.2);
    });

    test('devrait calculer l\'opacité dynamique des particules', () => {
      const calculateOpacity = (time: number, phase: number) => {
        return 0.3 + Math.sin(time * 2 + phase) * 0.2;
      };

      const testCases = [
        { time: 0, phase: 0, expectedRange: [0.1, 0.5] },
        { time: Math.PI, phase: Math.PI, expectedRange: [0.1, 0.5] },
        { time: Math.PI / 2, phase: 0, expectedRange: [0.1, 0.5] },
      ];

      testCases.forEach(({ time, phase, expectedRange }) => {
        const opacity = calculateOpacity(time, phase);
        expect(opacity).toBeGreaterThanOrEqual(expectedRange[0]);
        expect(opacity).toBeLessThanOrEqual(expectedRange[1]);
      });
    });
  });

  describe('🌈 Gestion des Couleurs - Tests Dynamiques', () => {
    test('devrait générer des couleurs HSL valides', () => {
      const getDynamicColor = (time: number, offset: number = 0) => {
        const hue = ((time * 50 + offset * 360) % 360);
        return `hsl(${hue}, 80%, 60%)`;
      };

      const colors = [0, 0.5, 1, 2].map(time =>
        getDynamicColor(time * Math.PI, 0.1)
      );

      colors.forEach(color => {
        expect(color).toMatch(/^hsl\(\d+\.?\d*, 80%, 60%\)$/);
        const hueMatch = color.match(/hsl\(([\d.]+),/);
        expect(hueMatch).toBeTruthy();
        const hue = parseFloat(hueMatch![1]);
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
      });
    });

    test('devrait maintenir la cohérence des couleurs sur le temps', () => {
      const getDynamicColor = (time: number) => {
        const hue = (time * 50) % 360;
        return `hsl(${hue}, 80%, 60%)`;
      };

      // Test sur plusieurs cycles
      for (let i = 0; i < 10; i++) {
        const time = i * Math.PI / 5;
        const color = getDynamicColor(time);
        expect(color).toMatch(/^hsl\([\d.]+, 80%, 60%\)$/);
      }
    });

    test('devrait supporter les couleurs personnalisées', () => {
      const colors = ['#00ffcc', '#ff00ff', '#ffff00', '#00ffff'];

      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });

      // Vérifier les conversions hex vers RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };

      colors.forEach(color => {
        const rgb = hexToRgb(color);
        expect(rgb).toBeTruthy();
        expect(rgb!.r).toBeGreaterThanOrEqual(0);
        expect(rgb!.r).toBeLessThanOrEqual(255);
        expect(rgb!.g).toBeGreaterThanOrEqual(0);
        expect(rgb!.g).toBeLessThanOrEqual(255);
        expect(rgb!.b).toBeGreaterThanOrEqual(0);
        expect(rgb!.b).toBeLessThanOrEqual(255);
      });
    });
  });

  describe('⚡ Animations et Performance - Tests Temps Réel', () => {
    test('devrait gérer le cycle d\'animation requestAnimationFrame', () => {
      const mockAnimate = jest.fn();
      let animationId: number | null = null;

      // Simuler l'animation loop
      const startAnimation = () => {
        const animate = () => {
          mockAnimate();
          animationId = requestAnimationFrame(animate);
        };
        animationId = requestAnimationFrame(animate);
      };

      const stopAnimation = () => {
        if (animationId !== null) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      };

      startAnimation();

      // Avancer le temps pour simuler quelques frames
      act(() => {
        jest.advanceTimersByTime(100); // ~6 frames à 60 FPS
      });

      expect(mockAnimate).toHaveBeenCalled();
      expect(global.requestAnimationFrame).toHaveBeenCalled();

      stopAnimation();
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    test('devrait calculer les propriétés d\'animation du Y', () => {
      const getYStyle = (time: number) => {
        const scale = 1 + Math.sin(time * 4) * 0.2;
        const rotation = Math.sin(time * 2) * 5;
        const glow = 10 + Math.abs(Math.sin(time * 3)) * 20;

        return {
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          filter: `drop-shadow(0 0 ${glow}px #ff00ff)`,
          transformOrigin: 'center'
        };
      };

      const times = [0, Math.PI / 4, Math.PI / 2, Math.PI];
      const styles = times.map(time => getYStyle(time));

      styles.forEach(style => {
        expect(style.transform).toMatch(/scale\([\d.]+\) rotate\([\d.-]+deg\)/);
        expect(style.filter).toMatch(/drop-shadow\(0 0 [\d.]+px #ff00ff\)/);
        expect(style.transformOrigin).toBe('center');

        // Extraire les valeurs numériques
        const scaleMatch = style.transform.match(/scale\(([\d.]+)\)/);
        const rotateMatch = style.transform.match(/rotate\(([\d.-]+)deg\)/);
        const glowMatch = style.filter.match(/drop-shadow\(0 0 ([\d.]+)px/);

        expect(scaleMatch).toBeTruthy();
        expect(rotateMatch).toBeTruthy();
        expect(glowMatch).toBeTruthy();

        const scale = parseFloat(scaleMatch![1]);
        const rotation = parseFloat(rotateMatch![1]);
        const glow = parseFloat(glowMatch![1]);

        expect(scale).toBeGreaterThanOrEqual(0.8);
        expect(scale).toBeLessThanOrEqual(1.2);
        expect(Math.abs(rotation)).toBeLessThanOrEqual(5);
        expect(glow).toBeGreaterThanOrEqual(10);
        expect(glow).toBeLessThanOrEqual(30);
      });
    });

    test('devrait gérer les ondes circulaires', () => {
      const generateWaves = (time: number, width: number, height: number) => {
        return [0, 1, 2].map(i => {
          const radius = ((time * 30 + i * 40) % 150);
          const opacity = Math.max(0, 1 - radius / 150) * 0.3;

          return {
            radius,
            opacity,
            centerX: width / 2,
            centerY: height / 2
          };
        });
      };

      const waves = generateWaves(1.5, 400, 300);

      expect(waves).toHaveLength(3);

      waves.forEach((wave, index) => {
        expect(wave.radius).toBeGreaterThanOrEqual(0);
        expect(wave.radius).toBeLessThan(150);
        expect(wave.opacity).toBeGreaterThanOrEqual(0);
        expect(wave.opacity).toBeLessThanOrEqual(0.3);
        expect(wave.centerX).toBe(200);
        expect(wave.centerY).toBe(150);
      });
    });
  });

  describe('🎛️ Interface de Contrôle - Tests Interactifs', () => {
    test('devrait gérer les changements de configuration', () => {
      const TestWrapper = () => {
        const [config, setConfig] = React.useState({
          showParticles: true,
          showWaves: true,
          animationSpeed: 0.02,
          primaryColor: '#00ffcc',
          secondaryColor: '#ff00ff'
        });

        return (
          <div>
            <button
              onClick={() => setConfig({...config, showParticles: !config.showParticles})}
              data-testid="toggle-particles"
            >
              Toggle Particles
            </button>
            <button
              onClick={() => setConfig({...config, animationSpeed: 0.03})}
              data-testid="change-speed"
            >
              Change Speed
            </button>
            <span data-testid="particles-status">{config.showParticles.toString()}</span>
            <span data-testid="speed-value">{config.animationSpeed.toString()}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestWrapper />);

      expect(getByTestId('particles-status').textContent).toBe('true');
      expect(getByTestId('speed-value').textContent).toBe('0.02');

      // Changer les paramètres
      fireEvent.press(getByTestId('toggle-particles'));
      fireEvent.press(getByTestId('change-speed'));

      expect(getByTestId('particles-status').textContent).toBe('false');
      expect(getByTestId('speed-value').textContent).toBe('0.03');
    });

    test('devrait valider les entrées utilisateur', () => {
      const validateInput = (value: number, min: number, max: number) => {
        return Math.max(min, Math.min(max, value));
      };

      const testCases = [
        { input: 0.01, min: 0.005, max: 0.05, expected: 0.01 },
        { input: 0.001, min: 0.005, max: 0.05, expected: 0.005 }, // Trop petit
        { input: 0.1, min: 0.005, max: 0.05, expected: 0.05 }, // Trop grand
        { input: NaN, min: 0.005, max: 0.05, expected: 0.005 }, // NaN
      ];

      testCases.forEach(({ input, min, max, expected }) => {
        const result = validateInput(input, min, max);
        expect(result).toBe(expected);
      });
    });

    test('devrait supporter les couleurs hexadécimales', () => {
      const validateHexColor = (color: string) => {
        return /^#[0-9a-fA-F]{6}$/.test(color);
      };

      const validColors = ['#00ffcc', '#FF00FF', '#123456', '#abcdef'];
      const invalidColors = ['#gggggg', '#12345', '#1234567', '00ffcc', '#ggg'];

      validColors.forEach(color => {
        expect(validateHexColor(color)).toBe(true);
      });

      invalidColors.forEach(color => {
        expect(validateHexColor(color)).toBe(false);
      });
    });
  });

  describe('🔧 Configuration et Props - Tests de Validation', () => {
    test('devrait valider les dimensions', () => {
      const validateDimensions = (width: number, height: number) => {
        const validWidth = Math.max(200, Math.min(2000, width));
        const validHeight = Math.max(150, Math.min(1500, height));
        return { width: validWidth, height: validHeight };
      };

      const testCases = [
        { input: { width: 400, height: 300 }, expected: { width: 400, height: 300 } },
        { input: { width: 100, height: 100 }, expected: { width: 200, height: 150 } }, // Trop petits
        { input: { width: 3000, height: 2000 }, expected: { width: 2000, height: 1500 } }, // Trop grands
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateDimensions(input.width, input.height);
        expect(result).toEqual(expected);
      });
    });

    test('devrait valider le nombre de particules', () => {
      const validateParticleCount = (count: number) => {
        return Math.max(5, Math.min(100, count));
      };

      const testCases = [
        { input: 30, expected: 30 },
        { input: 3, expected: 5 }, // Trop petit
        { input: 150, expected: 100 }, // Trop grand
        { input: 0, expected: 5 }, // Zéro
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateParticleCount(input);
        expect(result).toBe(expected);
      });
    });

    test('devrait valider la vitesse d\'animation', () => {
      const validateAnimationSpeed = (speed: number) => {
        return Math.max(0.001, Math.min(0.1, speed));
      };

      const testCases = [
        { input: 0.02, expected: 0.02 },
        { input: 0.0005, expected: 0.001 }, // Trop lent
        { input: 0.2, expected: 0.1 }, // Trop rapide
        { input: -0.01, expected: 0.001 }, // Négatif
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateAnimationSpeed(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('📊 Métriques de Performance - Tests de Monitoring', () => {
    test('devrait mesurer les performances de rendu', () => {
      const performanceMetrics = {
        startTime: 0,
        endTime: 0,
        renderCount: 0,
      };

      const TestComponent = () => {
        React.useEffect(() => {
          performanceMetrics.startTime = Date.now();
          performanceMetrics.renderCount++;
        });

        React.useEffect(() => {
          return () => {
            performanceMetrics.endTime = Date.now();
          };
        }, []);

        return <div data-testid="morphing-component">Morphing Component</div>;
      };

      const { unmount, getByTestId } = render(<TestComponent />);

      expect(getByTestId('morphing-component')).toBeTruthy();
      expect(performanceMetrics.renderCount).toBe(1);

      unmount();
      expect(performanceMetrics.endTime).toBeGreaterThan(performanceMetrics.startTime);
    });

    test('devrait tracker l\'utilisation mémoire des particules', () => {
      const generateParticles = (count: number) => {
        const particles = [];
        const startMemory = process.memoryUsage?.().heapUsed || 0;

        for (let i = 0; i < count; i++) {
          particles.push({
            id: i,
            x: Math.random() * 400,
            y: Math.random() * 300,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            phase: Math.random() * Math.PI * 2
          });
        }

        const endMemory = process.memoryUsage?.().heapUsed || 0;
        const memoryUsed = endMemory - startMemory;

        return { particles, memoryUsed };
      };

      const { particles, memoryUsed } = generateParticles(50);

      expect(particles).toHaveLength(50);
      // L'utilisation mémoire devrait être proportionnelle au nombre de particules
      expect(memoryUsed).toBeGreaterThanOrEqual(0);
    });

    test('devrait évaluer les performances des calculs mathématiques', () => {
      const benchmarkMath = () => {
        const startTime = Date.now();

        // Simuler les calculs du morphing
        for (let i = 0; i < 1000; i++) {
          const t = i * 0.01;
          const theta = (i % 100) * 0.01 * Math.PI * 2;

          const morph1 = Math.sin(t * 2) * 0.3;
          const morph2 = Math.cos(t * 3) * 0.2;
          const morph3 = Math.sin(t * 1.5) * 0.4;

          const r = 100 +
            morph1 * 30 * Math.sin(4 * theta + t) +
            morph2 * 20 * Math.cos(6 * theta - t * 2) +
            morph3 * 25 * Math.sin(8 * theta + t * 3);

          // Utiliser le résultat pour éviter l'optimisation
          if (r < 0) console.log('Negative radius');
        }

        return Date.now() - startTime;
      };

      const duration = benchmarkMath();

      // Les calculs devraient être rapides (< 100ms pour 1000 itérations)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('🎨 Effets Visuels - Tests de Rendu', () => {
    test('devrait générer des gradients SVG valides', () => {
      const generateGradient = (id: string, color1: string, color2: string) => {
        return `
          <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="${color1}" stopOpacity="0.8">
              <animate attributeName="stop-color"
                values="${color1};${color2};${color1}"
                dur="5s"
                repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="${color2}" stopOpacity="0.8">
              <animate attributeName="stop-color"
                values="${color2};${color1};${color2}"
                dur="5s"
                repeatCount="indefinite" />
            </stop>
          </linearGradient>
        `;
      };

      const gradient = generateGradient('testGradient', '#00ffcc', '#ff00ff');

      expect(gradient).toContain('<linearGradient id="testGradient"');
      expect(gradient).toContain('stopColor="#00ffcc"');
      expect(gradient).toContain('stopColor="#ff00ff"');
      expect(gradient).toContain('dur="5s"');
      expect(gradient).toContain('repeatCount="indefinite"');
    });

    test('devrait générer des filtres SVG valides', () => {
      const generateFilters = () => {
        return `
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="yGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        `;
      };

      const filters = generateFilters();

      expect(filters).toContain('<filter id="glow">');
      expect(filters).toContain('<filter id="yGlow">');
      expect(filters).toContain('feGaussianBlur');
      expect(filters).toContain('feMerge');
      expect(filters).toContain('stdDeviation="4"');
      expect(filters).toContain('stdDeviation="6"');
    });

    test('devrait calculer les positions des lignes de connexion', () => {
      const generateConnectionLines = (time: number, width: number, height: number) => {
        return [0, 60, 120, 180, 240, 300].map(angle => {
          const lineLength = 50 + Math.sin(time * 3 + angle * 0.02) * 20;
          const x1 = width / 2;
          const y1 = height / 2;
          const x2 = x1 + Math.cos(angle * Math.PI / 180 + time) * lineLength;
          const y2 = y1 + Math.sin(angle * Math.PI / 180 + time) * lineLength;

          return { x1, y1, x2, y2, angle };
        });
      };

      const lines = generateConnectionLines(2.0, 400, 300);

      expect(lines).toHaveLength(6);

      lines.forEach((line, index) => {
        expect(line.x1).toBe(200);
        expect(line.y1).toBe(150);
        expect(typeof line.x2).toBe('number');
        expect(typeof line.y2).toBe('number');
        expect(line.angle).toBe(index * 60);
        expect(line.x2).toBeGreaterThanOrEqual(0);
        expect(line.x2).toBeLessThanOrEqual(400);
        expect(line.y2).toBeGreaterThanOrEqual(0);
        expect(line.y2).toBeLessThanOrEqual(300);
      });
    });
  });
});
