import { getVideoColor, VIDEO_COLORS } from '../../src/components/home/video-library/VideoColors';
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEOS_PER_ROW, VIDEO_SPACING, SHELF_HEIGHT, CASSETTE_DEPTH } from '../../src/components/home/video-library/VideoDimensions';
import { videoStyles } from '../../src/components/home/video-library/VideoStyles';

describe('Utilitaires Vidéo', () => {
  describe('VideoColors', () => {
    test('devrait avoir un tableau de couleurs non vide', () => {
      expect(VIDEO_COLORS).toBeDefined();
      expect(VIDEO_COLORS.length).toBeGreaterThan(0);
    });

    test('devrait retourner une paire de couleurs valide', () => {
      const colorPair = getVideoColor(0);
      expect(colorPair).toHaveLength(2);
      expect(colorPair[0]).toMatch(/^#[0-9A-F]{6}$/i);
      expect(colorPair[1]).toMatch(/^#[0-9A-F]{6}$/i);
    });

    test('devrait retourner toujours la même couleur pour VHS', () => {
      const color1 = getVideoColor(0);
      const color2 = getVideoColor(1);
      const color3 = getVideoColor(999);

      expect(color1).toEqual(color2);
      expect(color2).toEqual(color3);
    });

    test('devrait avoir des couleurs cohérentes', () => {
      const expectedColor = ["#2C3E50", "#34495E"];
      const actualColor = getVideoColor(0);

      expect(actualColor).toEqual(expectedColor);
    });

    test('devrait gérer les index négatifs', () => {
      const color = getVideoColor(-1);
      expect(color).toHaveLength(2);
      expect(color[0]).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('VideoDimensions', () => {
    test('devrait avoir des dimensions valides', () => {
      expect(VIDEO_WIDTH).toBeGreaterThan(0);
      expect(VIDEO_HEIGHT).toBeGreaterThan(0);
      expect(VIDEOS_PER_ROW).toBeGreaterThan(0);
      expect(VIDEO_SPACING).toBeGreaterThanOrEqual(0);
      expect(SHELF_HEIGHT).toBeGreaterThan(0);
      expect(CASSETTE_DEPTH).toBeGreaterThan(0);
    });

    test('devrait avoir des proportions cohérentes', () => {
      const ratio = VIDEO_HEIGHT / VIDEO_WIDTH;
      expect(ratio).toBeGreaterThan(1); // Plus haut que large
      expect(ratio).toBeLessThan(2); // Pas trop haut
    });

    test('devrait avoir des valeurs réalistes', () => {
      expect(VIDEO_WIDTH).toBe(150);
      expect(VIDEO_HEIGHT).toBe(110);
      expect(VIDEOS_PER_ROW).toBe(2);
      expect(VIDEO_SPACING).toBe(8);
      expect(SHELF_HEIGHT).toBe(120);
      expect(CASSETTE_DEPTH).toBe(15);
    });

    test('devrait avoir des dimensions proportionnelles', () => {
      // La hauteur de la cassette devrait être moins que la hauteur totale de l'étagère
      expect(VIDEO_HEIGHT).toBeLessThan(SHELF_HEIGHT);
      // La profondeur devrait être réaliste par rapport à la largeur
      expect(CASSETTE_DEPTH).toBeLessThan(VIDEO_WIDTH / 2);
    });
  });

  describe('VideoStyles', () => {
    test('devrait avoir tous les styles requis', () => {
      const requiredStyles = [
        'shelf',
        'rowContainer',
        'cassetteContainer',
        'cassetteBody',
        'cassetteLabel',
        'cassetteTitle',
        'cassetteDuration',
        'cassetteDate',
        'qualityIndicator',
        'selectionIcon',
        'shelfBoard',
        'cassetteGloss',
        'cassetteHoles',
        'holographicOverlay',
        'statusBadge',
        'progressBar',
        'pulsingLed',
        'newBadge'
      ];

      requiredStyles.forEach(styleName => {
        expect(videoStyles[styleName]).toBeDefined();
      });
    });

    test('devrait avoir des dimensions cohérentes', () => {
      expect(videoStyles.cassetteContainer.width).toBe(VIDEO_WIDTH);
      expect(videoStyles.cassetteContainer.height).toBe(VIDEO_HEIGHT);
    });

    test('devrait avoir des styles pour les effets visuels', () => {
      expect(videoStyles.cassetteGloss).toBeDefined();
      expect(videoStyles.holographicOverlay).toBeDefined();
      expect(videoStyles.cassetteHoles).toBeDefined();
    });

    test('devrait avoir des styles pour les états interactifs', () => {
      expect(videoStyles.selectionIcon).toBeDefined();
      expect(videoStyles.pulsingLed).toBeDefined();
      expect(videoStyles.newBadge).toBeDefined();
    });

    test('devrait avoir des couleurs cohérentes', () => {
      expect(videoStyles.cassetteTitle.color).toBeDefined();
      expect(videoStyles.cassetteDuration.color).toBeDefined();
      expect(videoStyles.cassetteDate.color).toBeDefined();
    });

    test('devrait avoir des styles pour les animations', () => {
      expect(videoStyles.pulsingLed).toBeDefined();
      expect(videoStyles.cassetteGloss).toBeDefined();
    });

    test('devrait avoir des styles pour la structure 3D', () => {
      expect(videoStyles.cassetteSide).toBeDefined();
      expect(videoStyles.cassetteTop).toBeDefined();
      expect(videoStyles.cassetteHoles).toBeDefined();
    });

    test('devrait avoir des valeurs de style cohérentes', () => {
      expect(videoStyles.cassetteContainer.borderRadius).toBe(4);
      expect(videoStyles.cassetteBody.borderRadius).toBe(4);
      expect(videoStyles.pulsingLed.borderRadius).toBe(3);
      expect(videoStyles.selectionIcon.borderRadius).toBe(9);
      expect(videoStyles.newBadge.borderRadius).toBe(12);
    });

    test('devrait avoir des opacités appropriées', () => {
      expect(videoStyles.cassetteGloss.opacity).toBeGreaterThan(0);
      expect(videoStyles.cassetteGloss.opacity).toBeLessThan(1);
      expect(videoStyles.holographicOverlay.opacity).toBeGreaterThan(0);
      expect(videoStyles.holographicOverlay.opacity).toBeLessThan(1);
    });

    test('devrait avoir des tailles cohérentes pour les éléments similaires', () => {
      expect(videoStyles.selectionIcon.width).toBe(18);
      expect(videoStyles.selectionIcon.height).toBe(18);
      expect(videoStyles.pulsingLed.width).toBe(6);
      expect(videoStyles.pulsingLed.height).toBe(6);
    });
  });

  describe('Intégration des utilitaires', () => {
    test('devrait fonctionner ensemble de manière cohérente', () => {
      const colorPair = getVideoColor(0);
      expect(colorPair).toHaveLength(2);
      expect(colorPair[0]).toMatch(/^#[0-9A-F]{6}$/i);

      // Les dimensions devraient être cohérentes
      expect(VIDEO_WIDTH).toBeGreaterThan(0);
      expect(VIDEO_HEIGHT).toBeGreaterThan(0);

      // Les styles devraient être cohérents avec les dimensions
      expect(videoStyles.cassetteContainer.width).toBe(VIDEO_WIDTH);
      expect(videoStyles.cassetteContainer.height).toBe(VIDEO_HEIGHT);
    });

    test('devrait maintenir la cohérence des couleurs VHS', () => {
      // La vidéo library devrait toujours utiliser la même couleur VHS
      for (let i = 0; i < 10; i++) {
        const color1 = getVideoColor(i);
        const color2 = getVideoColor(i + 1);
        expect(color1).toEqual(color2);
      }
    });

    test('devrait avoir des proportions réalistes', () => {
      // Vérifier les proportions réalistes d'une cassette VHS
      const expectedWidth = 150; // Largeur standard
      const expectedHeight = 110; // Hauteur standard

      expect(VIDEO_WIDTH).toBe(expectedWidth);
      expect(VIDEO_HEIGHT).toBe(expectedHeight);

      // La profondeur devrait être réaliste
      expect(CASSETTE_DEPTH).toBeLessThan(VIDEO_WIDTH);
      expect(CASSETTE_DEPTH).toBeGreaterThan(0);
    });

    test('devrait supporter la configuration multi-cassettes', () => {
      // Vérifier que les dimensions supportent plusieurs cassettes par ligne
      const totalWidth = VIDEO_WIDTH * VIDEOS_PER_ROW + VIDEO_SPACING * (VIDEOS_PER_ROW - 1);
      expect(totalWidth).toBeGreaterThan(0);

      // L'espacement devrait être raisonnable
      expect(VIDEO_SPACING).toBeLessThan(VIDEO_WIDTH / 2);
    });
  });
});
