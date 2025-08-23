# Tests du Composant HamburgerMenu

Ce dossier contient une suite complète de tests pour le composant `HamburgerMenu`.

## Structure des Tests

```
home/components/
├── HamburgerMenu.test.tsx           # Tests unitaires
├── HamburgerMenu.integration.test.tsx # Tests d'intégration
├── HamburgerMenu.setup.js           # Configuration et utilitaires
└── README.md                       # Cette documentation
```

## Couverture des Tests

### Tests Unitaires (`HamburgerMenu.test.tsx`)

- ✅ **Rendu Initial** : Vérification du rendu avec props minimales
- ✅ **Interactions Utilisateur** : Clics, ouverture/fermeture du menu
- ✅ **Animations** : Vérification des animations d'ouverture/fermeture
- ✅ **Thèmes** : Support des thèmes clair/sombre
- ✅ **Accessibilité** : Labels, rôles, états d'accessibilité
- ✅ **Cas d'Erreur** : Listes vides, actions sans icônes, etc.

### Tests d'Intégration (`HamburgerMenu.integration.test.tsx`)

- ✅ **Scénarios d'Usage Complets** : Workflows utilisateur réels
- ✅ **Animations et Transitions** : Orchestration des animations
- ✅ **Comportement Mobile** : Scroll, orientation, etc.
- ✅ **Accessibilité Avancée** : Navigation clavier, VoiceOver
- ✅ **Performance** : Optimisations et nettoyage mémoire
- ✅ **Cas d'Usage Réels** : Scénarios audio, gestion de fichiers

## Utilitaires de Test

### AnimationTestUtils
- `advanceAnimationByTime(time)` : Avance les animations dans le temps
- `expectAnimationStarted(mock, calls)` : Vérifie qu'une animation est démarrée
- `expectAnimationWithParams(mock, params)` : Vérifie les paramètres d'animation
- `resetAnimationMocks()` : Reset les mocks d'animation

### AccessibilityTestUtils
- `expectAccessible(element, options)` : Vérifie l'accessibilité
- `simulateScreenReader(element, action)` : Simule les lecteurs d'écran

### ThemeTestUtils
- `mockDarkTheme()` / `mockLightTheme()` : Mocks de thèmes
- `applyThemeMock(theme)` : Applique un mock de thème

### PerformanceTestUtils
- `measureRenderTime(component, iterations)` : Mesure les performances de rendu
- `testMemoryLeak(component)` : Test des fuites mémoire

## Exécution des Tests

### Tests unitaires uniquement
```bash
npm test -- HamburgerMenu.test.tsx
```

### Tests d'intégration uniquement
```bash
npm test -- HamburgerMenu.integration.test.tsx
```

### Tous les tests HamburgerMenu
```bash
npm test -- --testPathPattern="HamburgerMenu"
```

### Avec couverture de code
```bash
npm test -- --testPathPattern="HamburgerMenu" --coverage
```

## Mocks et Configuration

### Mocks Externes
- **react-native-linear-gradient** : Mock du composant LinearGradient
- **react-native-vector-icons** : Mock des icônes MaterialCommunityIcons
- **@react-native-community/blur** : Mock du BlurView
- **@contexts/ThemeContext** : Mock du hook useTheme
- **@hooks/useContrastOptimization** : Mock du hook useContrastOptimization

### Animations
Les animations sont mockées pour permettre des tests déterministes :
- `Animated.timing` retourne un mock avec `start()` et `stop()`
- `Animated.spring` même comportement
- `Animated.parallel` orchestre plusieurs animations
- `Animated.Value` mock avec `interpolate()`

## Métriques de Test

### Couverture Cible
- **Statements** : > 90%
- **Branches** : > 85%
- **Functions** : > 95%
- **Lines** : > 90%

### Performance
- **Temps de rendu** : < 100ms
- **Temps d'animation** : < 300ms (simulé)
- **Mémoire** : Pas de fuites détectées

## Bonnes Pratiques Appliquées

### 1. Tests Isolés
- Chaque test est indépendant
- Reset des mocks entre les tests
- Pas de dépendances entre tests

### 2. Tests Déterministes
- Mocks des animations pour éviter la flakiness
- Pas de timers réels (utilisation de `jest.advanceTimersByTime()`)
- États initiaux prédictibles

### 3. Tests Accessibles
- Vérification des propriétés d'accessibilité
- Tests de navigation au clavier
- Support des lecteurs d'écran

### 4. Tests de Performance
- Mesure des temps de rendu
- Détection des fuites mémoire
- Vérification des optimisations (useNativeDriver)

### 5. Tests de Cas Limites
- Props undefined/null
- Listes vides ou très longues
- Erreurs réseau simulées
- Changements d'orientation

## Ajout de Nouveaux Tests

### Structure Recommandée
```typescript
describe('Nouvelle Fonctionnalité', () => {
  describe('Comportement Attendu', () => {
    it('devrait faire quelque chose', async () => {
      // Arrange
      const mockData = { /* ... */ };

      // Act
      const { getByTestId } = render(<Component {...mockData} />);

      // Assert
      expect(/* ... */);
    });
  });
});
```

### Utilisation des Utilitaires
```typescript
it('devrait animer correctement', async () => {
  // Utiliser AnimationTestUtils
  await AnimationTestUtils.advanceAnimationByTime(300);

  // Vérifier l'animation
  AnimationTestUtils.expectAnimationStarted(Animated.timing);
});
```

## Dépannage

### Tests Lents
- Vérifiez que les animations sont mockées correctement
- Utilisez `jest.setTimeout()` si nécessaire
- Évitez les attentes réelles avec `waitFor()`

### Tests Flaky
- Utilisez `act()` pour envelopper les interactions
- Attendez la fin des animations avec `AnimationTestUtils`
- Reset les mocks entre les tests

### Erreurs de Mock
- Vérifiez que tous les imports sont mockés
- Utilisez `jest.clearAllMocks()` dans `beforeEach`
- Assurez-vous que les mocks correspondent aux imports réels
