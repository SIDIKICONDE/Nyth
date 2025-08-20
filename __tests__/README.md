# 🧪 Tests Complets de l'Application Nyth

Cette suite de tests complète couvre tous les aspects de l'application Nyth, incluant l'initialisation, les providers, la navigation, les services et les hooks personnalisés.

## 📋 Vue d'ensemble

L'application utilise Jest avec Testing Library React Native pour tester :
- ✅ **App principale** - Initialisation et services
- ✅ **Providers/Contextes** - Gestion d'état globale
- ✅ **Navigation** - Routage et transitions
- ✅ **Services** - Logique métier et APIs
- ✅ **Hooks personnalisés** - Logique réutilisable
- ✅ **Authentification** - Gestion des utilisateurs
- ✅ **Enregistrement vidéo** - Fonctionnalités multimédia

## 🚀 Installation et Configuration

### Prérequis
```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

### Configuration Jest
La configuration principale se trouve dans `__tests__/jest.config.js` avec :
- Support TypeScript complet
- Mocks pour React Native et Firebase
- Configuration de couverture de code
- Alias de modules personnalisés

## 📁 Structure des Tests

```
__tests__/
├── App.integration.test.tsx          # Test intégration App principale
├── contexts/
│   └── CombinedProviders.test.tsx   # Test des providers React
├── navigation/
│   └── AppNavigator.test.tsx        # Test de la navigation
├── services/
│   └── PerformanceMonitor.test.ts   # Test des services principaux
├── hooks/
│   └── useSimpleSessionTracker.test.ts # Test des hooks personnalisés
├── setup/
│   ├── jest.setup.js               # Configuration globale Jest
│   └── README.md                   # Documentation setup
├── test-runner.js                  # Lanceur de tests personnalisé
├── jest.config.js                  # Configuration Jest
└── README.md                       # Documentation principale
```

## 🎯 Lancer les Tests

### Utilisation du Test Runner personnalisé

```bash
# Lancer tous les tests
node __tests__/test-runner.js all

# Lancer les tests par module
node __tests__/test-runner.js auth          # Tests d'authentification
node __tests__/test-runner.js services      # Tests des services
node __tests__/test-runner.js hooks         # Tests des hooks
node __tests__/test-runner.js contexts      # Tests des contextes
node __tests__/test-runner.js navigation    # Tests de navigation

# Lancer avec couverture
node __tests__/test-runner.js coverage

# Mode watch
node __tests__/test-runner.js watch

# Aide
node __tests__/test-runner.js help
```

### Utilisation directe de Jest

```bash
# Tous les tests
npm test

# Tests d'authentification uniquement
npm run test:auth

# Tests avec couverture
npm test -- --coverage

# Tests en mode watch
npm test -- --watch
```

## 🧪 Description des Tests

### 1. Test d'Intégration App (`App.integration.test.tsx`)

Teste l'initialisation complète de l'application :
- ✅ Rendu sans crash
- ✅ Initialisation des services (i18n, Firebase, performance)
- ✅ Gestion d'erreurs
- ✅ Monitoring en développement
- ✅ Cleanup au démontage

### 2. Test des Providers (`CombinedProviders.test.tsx`)

Teste la hiérarchie des contextes :
- ✅ Rendu de tous les providers
- ✅ Ordre correct des providers
- ✅ Mémoisation pour les performances
- ✅ Gestion d'erreurs
- ✅ Providers groupés (UI, User Data, App Features)

### 3. Test de Navigation (`AppNavigator.test.tsx`)

Teste la logique de navigation :
- ✅ États d'authentification
- ✅ Transitions entre écrans
- ✅ Gestion des utilisateurs
- ✅ Navigation conditionnelle
- ✅ Gestion d'erreurs

### 4. Test des Services (`PerformanceMonitor.test.tsx`)

Teste les services principaux :
- ✅ Initialisation du monitoring
- ✅ Configuration des seuils
- ✅ Tracking des performances
- ✅ Gestion des erreurs
- ✅ Cleanup approprié

### 5. Test des Hooks (`useSimpleSessionTracker.test.tsx`)

Teste les hooks personnalisés :
- ✅ Initialisation de session
- ✅ Tracking d'activité
- ✅ Gestion du stockage
- ✅ Analytics intégrés
- ✅ Cleanup au démontage

## 🛠️ Mocks et Configuration

### Mocks principaux

```javascript
// Services Firebase mockés
jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('@react-native-firebase/messaging');

// Services React Native mockés
jest.mock('react-native-localize');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native-reanimated');
```

### Variables globales de test

```javascript
global.__TEST__ = true;
global.__DEV__ = true;
```

### Utilitaires de test

```javascript
global.testUtils = {
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  flushPromises: () => new Promise(setImmediate),
};
```

## 📊 Couverture de Code

La configuration Jest génère des rapports de couverture :

```bash
node __tests__/test-runner.js coverage
```

Seuil minimum configuré :
- ✅ Branches: 70%
- ✅ Fonctions: 70%
- ✅ Lignes: 70%
- ✅ Statements: 70%

Rapports générés dans `coverage/` :
- `coverage/lcov-report/index.html` - Rapport HTML
- `coverage/coverage-final.json` - Données JSON

## 🔧 Scripts NPM

Ajoutez ces scripts à votre `package.json` :

```json
{
  "scripts": {
    "test": "jest",
    "test:all": "node __tests__/test-runner.js all",
    "test:auth": "node __tests__/test-runner.js auth",
    "test:services": "node __tests__/test-runner.js services",
    "test:hooks": "node __tests__/test-runner.js hooks",
    "test:contexts": "node __tests__/test-runner.js contexts",
    "test:navigation": "node __tests__/test-runner.js navigation",
    "test:coverage": "node __tests__/test-runner.js coverage",
    "test:watch": "node __tests__/test-runner.js watch"
  }
}
```

## 🎯 Bonnes Pratiques

### Écriture de tests

1. **Nommer les tests clairement** :
```typescript
test('should handle user login successfully', async () => {
  // Test implementation
});
```

2. **Utiliser des mocks appropriés** :
```typescript
jest.mock('../../src/services/authService', () => ({
  login: jest.fn().mockResolvedValue({ success: true }),
}));
```

3. **Tester les cas d'erreur** :
```typescript
test('should handle network error gracefully', async () => {
  mockService.mockRejectedValue(new Error('Network error'));
  // Test error handling
});
```

4. **Cleanup après les tests** :
```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

### Structure des tests

```typescript
describe('Feature Name', () => {
  describe('Main Functionality', () => {
    test('should do something', () => {
      // Test implementation
    });
  });

  describe('Error Handling', () => {
    test('should handle errors', () => {
      // Error test
    });
  });
});
```

## 🚨 Dépannage

### Problèmes courants

1. **Tests qui échouent à cause des timers** :
```javascript
// Utiliser des timers fake
jest.useFakeTimers();
act(() => {
  jest.advanceTimersByTime(1000);
});
```

2. **Problèmes de mocks** :
```javascript
// Reset des mocks entre les tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

3. **Async/await issues** :
```javascript
// Attendre les promises
await act(async () => {
  await flushPromises();
});
```

### Debug des tests

```bash
# Mode debug détaillé
npm test -- --verbose

# Un seul test
npm test -- --testNamePattern="should handle user login"

# Debug avec Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📈 Intégration CI/CD

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          file: ./coverage/coverage-final.json
```

### Scripts de qualité

```json
{
  "scripts": {
    "quality": "npm run lint && npm run test:coverage",
    "precommit": "npm run quality",
    "prepush": "npm run test:all"
  }
}
```

## 🎉 Contribution

Pour ajouter de nouveaux tests :

1. **Créer le fichier de test** dans le répertoire approprié
2. **Suivre la convention de nommage** : `*.test.tsx` ou `*.test.ts`
3. **Mocker les dépendances externes**
4. **Tester les cas d'erreur et les cas normaux**
5. **Ajouter la documentation**

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library React Native](https://testing-library.com/docs/react-native-testing-library/intro/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [Guide des bonnes pratiques de test](https://kentcdodds.com/blog/common-testing-patterns)

---

🎯 **Prêt à tester votre application Nyth !** Lancez `node __tests__/test-runner.js all` pour commencer.
