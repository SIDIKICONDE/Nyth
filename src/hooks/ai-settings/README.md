# AI Settings Hooks - Structure Refactorisée

Cette refactorisation divise le hook `useAISettings` monolithique (399 lignes) en plusieurs hooks modulaires spécialisés.

## Structure

```
src/hooks/ai-settings/
├── index.ts                    # Exports centralisés
├── types.ts                    # Types et interfaces
├── useSettingsStorage.ts       # Gestion du stockage AsyncStorage
├── useAPITesting.ts           # Tests des APIs
├── useCacheManagement.ts      # Gestion du cache
├── useSettingsValidation.ts   # Validation des paramètres
├── useHuggingFaceSetup.ts     # Configuration spécifique HuggingFace
└── README.md                  # Cette documentation
```

## Hooks Modulaires

### `useSettingsStorage`
- **Responsabilité** : Chargement et sauvegarde des paramètres
- **Fonctions** : `loadSettings()`, `saveSettings()`, `getDefaultSettings()`
- **Avantages** : Logique de persistance isolée, réutilisable

### `useAPITesting`
- **Responsabilité** : Tests des différentes APIs
- **Fonctions** : `testAPI()`, `testAllAPIs()`
- **État** : `testingApi` (API en cours de test)
- **Avantages** : Tests centralisés, gestion d'erreurs cohérente

### `useCacheManagement`
- **Responsabilité** : Gestion du cache AI
- **Fonctions** : `clearCache()`, `refreshCacheStats()`, `clearCacheForProvider()`
- **État** : `cacheStats`, `clearingCache`
- **Avantages** : Statistiques formatées, nettoyage sélectif

### `useSettingsValidation`
- **Responsabilité** : Validation des paramètres
- **Fonctions** : `validateSettings()`, `validateAPIKey()`, `hasEnabledAPI()`
- **Avantages** : Validation centralisée, messages d'erreur cohérents

### `useHuggingFaceSetup`
- **Responsabilité** : Configuration spécifique HuggingFace
- **Fonctions** : `checkHuggingFaceKey()`, `getDefaultHuggingFaceModels()`
- **Avantages** : Logique spécialisée isolée, suggestions de modèles

## Hook Principal Refactorisé

Le nouveau `useAISettings` (dans `useAISettings.refactored.ts`) :
- **Taille réduite** : ~130 lignes vs 399 lignes originales
- **Responsabilité unique** : Orchestration des hooks modulaires
- **Maintenabilité** : Chaque fonctionnalité dans son propre fichier
- **Testabilité** : Hooks isolés facilement testables

## Migration

Pour utiliser la version refactorisée :

```typescript
// Remplacer
import { useAISettings } from '../hooks/useAISettings';

// Par
import { useAISettings } from '../hooks/useAISettings.refactored';
```

## Avantages de la Refactorisation

1. **Séparation des responsabilités** - Chaque hook a une fonction spécifique
2. **Réutilisabilité** - Les hooks peuvent être utilisés individuellement
3. **Testabilité** - Chaque hook peut être testé isolément
4. **Maintenabilité** - Code plus facile à comprendre et modifier
5. **Performance** - Chargement à la demande des fonctionnalités
6. **Évolutivité** - Ajout facile de nouvelles fonctionnalités

## Types Partagés

Tous les types sont centralisés dans `types.ts` :
- `APISettings` - Configuration des APIs
- `CacheStats` - Statistiques du cache
- `UseAISettingsReturn` - Interface du hook principal
- `APITestResult` - Résultat des tests d'API 