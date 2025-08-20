# Tests du Système de Mémoire AI

Cette suite de tests couvre l'ensemble du système de mémoire AI avec des tests unitaires, d'intégration et de performance.

## Structure des Tests

```
memory/
├── MemoryManager.test.ts              # Tests unitaires pour MemoryManager
├── CitationManager.test.ts            # Tests unitaires pour CitationManager
├── EmbeddingService.test.ts           # Tests pour le service d'embeddings
├── MemorySystem.integration.test.ts   # Tests d'intégration complets
├── jest.config.js                     # Configuration Jest spécifique
└── README.md                         # Documentation
```

## Couverture des Tests

### MemoryManager
- ✅ Singleton pattern
- ✅ Génération d'IDs uniques
- ✅ Chargement de la mémoire utilisateur
- ✅ Ajout de nouvelles mémoires avec validation
- ✅ Mise à jour des mémoires existantes
- ✅ Suppression de mémoires
- ✅ Recherche par mots-clés et filtres
- ✅ Recherche sémantique avec embeddings
- ✅ Détection et résolution de conflits
- ✅ Validation des données sensibles
- ✅ Statistiques mémoire
- ✅ Effacement complet de la mémoire

### CitationManager
- ✅ Singleton pattern
- ✅ Traitement automatique des citations
- ✅ Validation des citations obligatoires
- ✅ Extraction des IDs de mémoires citées
- ✅ Conversion des citations en format lisible
- ✅ Génération de rapports d'utilisation
- ✅ Détection d'utilisation de mémoire dans le texte
- ✅ Extraction de mots-clés
- ✅ Détection par catégorie de mémoire

### EmbeddingService
- ✅ Singleton pattern
- ✅ Intégration OpenAI embeddings
- ✅ Intégration Gemini embeddings
- ✅ Intégration Mistral embeddings
- ✅ Calcul de similarité cosinus
- ✅ Mean pooling des embeddings
- ✅ Fallback entre providers
- ✅ Gestion d'erreurs réseau
- ✅ Cache des embeddings

### Tests d'Intégration
- ✅ Flux complet de création de mémoire
- ✅ Traitement des citations automatique
- ✅ Validation des citations
- ✅ Recherche sémantique et par mots-clés
- ✅ Résolution de conflits
- ✅ Intégration avec les hooks React
- ✅ Gestion d'erreurs inter-services
- ✅ Performance avec opérations bulk
- ✅ Persistance des données

## Exécution des Tests

### Tous les tests de mémoire
```bash
cd src/services/__tests__/memory
npm test
```

### Tests avec couverture
```bash
cd src/services/__tests__/memory
npm test -- --coverage
```

### Tests unitaires uniquement
```bash
cd src/services/__tests__/memory
npm test -- --testPathPattern="\.test\.ts$"
```

### Tests d'intégration uniquement
```bash
cd src/services/__tests__/memory
npm test -- --testPathPattern="\.integration\.test\.ts$"
```

## Mocks et Configuration

### Mocks Principaux

- **AsyncStorage**: Mock pour le stockage local React Native
- **Firebase Firestore**: Mock pour les opérations de base de données
- **EmbeddingService**: Mock pour les opérations d'embeddings
- **ApiKeyManager**: Mock pour la gestion des clés API
- **Logger**: Mock pour les logs optimisés

### Variables d'Environnement de Test

```javascript
// Dans setup.ts
process.env.NODE_ENV = 'test';
process.env.MEMORY_TEST_MODE = 'true';
```

## Métriques de Qualité

### Seuils de Couverture
- **Branches**: 70%
- **Fonctions**: 75%
- **Lignes**: 80%
- **Instructions**: 80%

### Performance des Tests
- **Timeout par test**: 10 secondes
- **Timeout total**: 5 minutes
- **Taille de heap**: 512MB

## Bonnes Pratiques

### 1. Mocks Appropriés
```typescript
// ❌ Éviter
jest.mock('module', () => ({ /* mock complet */ }));

// ✅ Préférer
const mockModule = jest.fn();
jest.mock('module', () => mockModule);
```

### 2. Setup/TearDown
```typescript
// Utiliser beforeEach pour reset les mocks
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 3. Tests Isolés
```typescript
// Chaque test doit être indépendant
it('should work independently', async () => {
  // Setup spécifique au test
  // ...
});
```

### 4. Nommage des Tests
```typescript
describe('ComponentName', () => {
  describe('MethodName', () => {
    it('should do something specific', () => {
      // Test spécifique
    });
  });
});
```

## Debugging

### Logs en Mode Debug
```bash
DEBUG=memory:* npm test
```

### Tests en Mode Verbose
```bash
npm test -- --verbose
```

### Tests avec Breakpoints
```typescript
// Dans le code de test
debugger; // Point d'arrêt pour Node.js inspector
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Memory Tests
  run: |
    cd src/services/__tests__/memory
    npm test -- --coverage --watchAll=false
    npm run coverage:check
```

### Coverage Reports
```bash
# Générer rapport HTML
npm test -- --coverage --coverageReporters=html

# Publier sur Codecov
npm run coverage:upload
```

## Maintenance

### Ajouter de Nouveaux Tests
1. Créer le fichier de test dans le dossier approprié
2. Importer les mocks nécessaires
3. Suivre la structure existante
4. Mettre à jour la configuration Jest si nécessaire

### Mettre à Jour les Mocks
1. Identifier les changements dans l'API
2. Mettre à jour les mocks correspondants
3. Vérifier que tous les tests passent
4. Mettre à jour la documentation si nécessaire

## Troubleshooting

### Problèmes Courants

**Tests lents**
- Vérifier les timeouts
- Optimiser les mocks
- Réduire les opérations async

**Memory leaks**
- Reset proper des singletons
- Clear des intervals/timeouts
- Libération des ressources

**Flaky tests**
- Utiliser des seeds fixes
- Éviter les opérations non déterministes
- Mocker les services externes
