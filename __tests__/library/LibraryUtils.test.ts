import { getBookColor, BOOK_COLORS } from '../../src/components/home/library/BookColors';
import { getBookDimensions, BOOK_WIDTH, BOOK_HEIGHT, ITEMS_PER_ROW } from '../../src/components/home/library/BookDimensions';
import { bookStyles } from '../../src/components/home/library/BookStyles';

describe('Utilitaires de la Bibliothèque', () => {
  describe('BookColors', () => {
    test('devrait avoir un tableau de couleurs non vide', () => {
      expect(BOOK_COLORS).toBeDefined();
      expect(BOOK_COLORS.length).toBeGreaterThan(0);
    });

    test('devrait avoir des paires de couleurs valides', () => {
      BOOK_COLORS.forEach((colorPair, index) => {
        expect(colorPair).toHaveLength(2);
        expect(colorPair[0]).toMatch(/^#[0-9A-F]{6}$/i);
        expect(colorPair[1]).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('devrait retourner des couleurs cycliques', () => {
      const color1 = getBookColor(0);
      const color2 = getBookColor(BOOK_COLORS.length);
      expect(color1).toEqual(color2);
    });

    test('devrait gérer les index négatifs', () => {
      const color = getBookColor(-5);
      expect(color).toHaveLength(2);
      expect(color[0]).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color[1]).toMatch(/^#[0-9A-F]{6}$/i);
    });

    test('devrait avoir des couleurs contrastées', () => {
      BOOK_COLORS.forEach(([color1, color2]) => {
        // Les deux couleurs ne devraient pas être identiques
        expect(color1).not.toBe(color2);
      });
    });

    test('devrait avoir des couleurs dans la palette vintage', () => {
      const vintageColors = [
        '#2C1810', '#8B4513', '#556B2F', '#8B0000', '#2F4F4F',
        '#CD853F', '#483D8B', '#B8860B', '#1C1C1C', '#8B7355'
      ];
      
      BOOK_COLORS.forEach(([color1, color2]) => {
        expect(vintageColors).toContain(color1);
        expect(vintageColors).toContain(color2);
      });
    });
  });

  describe('BookDimensions', () => {
    test('devrait retourner des dimensions valides par défaut', () => {
      const dimensions = getBookDimensions();
      
      expect(dimensions.BOOK_WIDTH).toBeGreaterThan(0);
      expect(dimensions.BOOK_HEIGHT).toBeGreaterThan(0);
      expect(dimensions.ITEMS_PER_ROW).toBeGreaterThan(0);
      expect(Number.isInteger(dimensions.ITEMS_PER_ROW)).toBe(true);
    });

    test('devrait avoir un ratio de hauteur cohérent (1.3)', () => {
      const dimensions = getBookDimensions();
      const ratio = dimensions.BOOK_HEIGHT / dimensions.BOOK_WIDTH;
      expect(ratio).toBeCloseTo(1.3, 1);
    });

    test('devrait gérer les smartphones en mode portrait', () => {
      const mockOrientation = {
        isTablet: false,
        isLargeTablet: false,
        isLandscape: false,
        width: 375,
        height: 667,
      };

      const dimensions = getBookDimensions(mockOrientation);
      expect(dimensions.ITEMS_PER_ROW).toBe(3);
      expect(dimensions.BOOK_WIDTH).toBe(375 * 0.28);
    });

    test('devrait gérer les smartphones en mode paysage', () => {
      const mockOrientation = {
        isTablet: false,
        isLargeTablet: false,
        isLandscape: true,
        width: 667,
        height: 375,
      };

      const dimensions = getBookDimensions(mockOrientation);
      expect(dimensions.ITEMS_PER_ROW).toBe(4);
      expect(dimensions.BOOK_WIDTH).toBe(667 * 0.22);
    });

    test('devrait gérer les tablettes standard', () => {
      const mockOrientation = {
        isTablet: true,
        isLargeTablet: false,
        isLandscape: false,
        width: 768,
        height: 1024,
      };

      const dimensions = getBookDimensions(mockOrientation);
      expect(dimensions.ITEMS_PER_ROW).toBe(3);
      expect(dimensions.BOOK_WIDTH).toBe(768 * 0.28);
    });

    test('devrait gérer les grandes tablettes', () => {
      const mockOrientation = {
        isTablet: true,
        isLargeTablet: true,
        isLandscape: false,
        width: 1024,
        height: 1366,
      };

      const dimensions = getBookDimensions(mockOrientation);
      expect(dimensions.ITEMS_PER_ROW).toBe(4);
      expect(dimensions.BOOK_WIDTH).toBe(1024 * 0.22);
    });

    test('devrait avoir des constantes exportées valides', () => {
      expect(BOOK_WIDTH).toBeGreaterThan(0);
      expect(BOOK_HEIGHT).toBeGreaterThan(0);
      expect(ITEMS_PER_ROW).toBeGreaterThan(0);
      expect(Number.isInteger(ITEMS_PER_ROW)).toBe(true);
    });

    test('devrait gérer les cas d\'orientation undefined', () => {
      const dimensions = getBookDimensions(undefined);
      expect(dimensions.BOOK_WIDTH).toBeGreaterThan(0);
      expect(dimensions.BOOK_HEIGHT).toBeGreaterThan(0);
      expect(dimensions.ITEMS_PER_ROW).toBeGreaterThan(0);
    });
  });

  describe('BookStyles', () => {
    test('devrait avoir tous les styles requis', () => {
      const requiredStyles = [
        'shelf',
        'rowContainer',
        'bookContainer',
        'bookSpine',
        'titleContainer',
        'bookTitle',
        'bookFooter',
        'bookDate',
        'bookPages',
        'pageLayer',
        'paperLines',
        'artisticDecorations',
        'premiumBadge',
        'selectionIcon',
        'shelfBoard'
      ];

      requiredStyles.forEach(styleName => {
        expect(bookStyles[styleName]).toBeDefined();
      });
    });

    test('devrait avoir des dimensions cohérentes', () => {
      expect(bookStyles.bookContainer.width).toBe(BOOK_WIDTH);
      expect(bookStyles.bookContainer.height).toBe(BOOK_HEIGHT);
    });

    test('devrait avoir des styles pour les états interactifs', () => {
      expect(bookStyles.selectionIcon).toBeDefined();
      expect(bookStyles.premiumBadge).toBeDefined();
      expect(bookStyles.elasticBand).toBeDefined();
    });

    test('devrait avoir des styles pour les animations', () => {
      expect(bookStyles.artisticDecorations).toBeDefined();
      expect(bookStyles.decorativeBorder).toBeDefined();
      expect(bookStyles.starDecoration).toBeDefined();
      expect(bookStyles.waveDecoration).toBeDefined();
      expect(bookStyles.decorativeDots).toBeDefined();
    });

    test('devrait avoir des styles pour la structure', () => {
      expect(bookStyles.bookBinding).toBeDefined();
      expect(bookStyles.spiralHoles).toBeDefined();
      expect(bookStyles.spiralHole).toBeDefined();
      expect(bookStyles.pageLayer1).toBeDefined();
      expect(bookStyles.pageLayer2).toBeDefined();
      expect(bookStyles.pageLayer3).toBeDefined();
    });

    test('devrait avoir des styles pour les textures', () => {
      expect(bookStyles.bookTexture).toBeDefined();
      expect(bookStyles.noiseTexture).toBeDefined();
      expect(bookStyles.paperLine).toBeDefined();
    });

    test('devrait avoir des styles pour l\'étagère', () => {
      expect(bookStyles.shelf).toBeDefined();
      expect(bookStyles.shelfBoard).toBeDefined();
      expect(bookStyles.shelfReflection).toBeDefined();
    });

    test('devrait avoir des styles avec des propriétés valides', () => {
      // Vérifier que les styles ont des propriétés de base valides
      expect(bookStyles.bookContainer).toHaveProperty('width');
      expect(bookStyles.bookContainer).toHaveProperty('height');
      expect(bookStyles.bookSpine).toHaveProperty('borderRadius');
      expect(bookStyles.bookTitle).toHaveProperty('color');
    });

    test('devrait avoir des styles pour les décorations', () => {
      expect(bookStyles.decorativeDot).toBeDefined();
      expect(bookStyles.notebookMark).toBeDefined();
      expect(bookStyles.floralPattern).toBeDefined();
      expect(bookStyles.curvedLines).toBeDefined();
      expect(bookStyles.heartDecoration).toBeDefined();
    });
  });

  describe('Intégration des utilitaires', () => {
    test('devrait fonctionner ensemble de manière cohérente', () => {
      const colorPair = getBookColor(0);
      const dimensions = getBookDimensions();
      
      // Les couleurs devraient être valides
      expect(colorPair).toHaveLength(2);
      expect(colorPair[0]).toMatch(/^#[0-9A-F]{6}$/i);
      expect(colorPair[1]).toMatch(/^#[0-9A-F]{6}$/i);
      
      // Les dimensions devraient être valides
      expect(dimensions.BOOK_WIDTH).toBeGreaterThan(0);
      expect(dimensions.BOOK_HEIGHT).toBeGreaterThan(0);
      expect(dimensions.ITEMS_PER_ROW).toBeGreaterThan(0);
      
      // Les styles devraient être cohérents
      expect(bookStyles.bookContainer.width).toBe(dimensions.BOOK_WIDTH);
      expect(bookStyles.bookContainer.height).toBe(dimensions.BOOK_HEIGHT);
    });

    test('devrait gérer les cas limites', () => {
      // Index très grand
      const color1 = getBookColor(999999);
      expect(color1).toHaveLength(2);
      
      // Index négatif
      const color2 = getBookColor(-999999);
      expect(color2).toHaveLength(2);
      
      // Orientation avec des valeurs extrêmes
      const extremeOrientation = {
        isTablet: true,
        isLargeTablet: true,
        isLandscape: true,
        width: 2000,
        height: 1500,
      };
      
      const dimensions = getBookDimensions(extremeOrientation);
      expect(dimensions.BOOK_WIDTH).toBeGreaterThan(0);
      expect(dimensions.BOOK_HEIGHT).toBeGreaterThan(0);
      expect(dimensions.ITEMS_PER_ROW).toBeGreaterThan(0);
    });

    test('devrait maintenir la cohérence des couleurs', () => {
      const colors = [];
      for (let i = 0; i < 50; i++) {
        colors.push(getBookColor(i));
      }
      
      // Vérifier qu'il y a de la variété dans les couleurs
      const uniqueColors = new Set(colors.flat());
      expect(uniqueColors.size).toBeGreaterThan(10);
      
      // Vérifier que les couleurs sont cycliques
      expect(colors[0]).toEqual(colors[BOOK_COLORS.length]);
    });
  });
});
