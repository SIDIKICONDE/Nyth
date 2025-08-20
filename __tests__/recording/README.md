# Tests d'Enregistrement Vidéo

Ce dossier contient une suite complète de tests pour l'enregistrement vidéo de l'application Nyth.

## Structure des Tests

```
__tests__/recording/
├── mocks.ts                    # Mocks centralisés pour tous les tests
├── setup.js                    # Configuration Jest globale
├── jest.config.js              # Configuration Jest spécifique
├── test-runner.js              # Script d'exécution des tests
├── VideoSaveService.test.ts    # Tests unitaires du service de sauvegarde
├── useCamera.test.ts           # Tests du hook useCamera
├── useRecordingSave.test.ts    # Tests du hook useRecordingSave
├── VideoRecording.integration.test.ts # Tests d'intégration
└── README.md                   # Cette documentation
```

## Types de Tests

### 1. Tests Unitaires
- **VideoSaveService.test.ts**: Teste la logique de sauvegarde des vidéos
- **useCamera.test.ts**: Teste le hook de gestion de la caméra
- **useRecordingSave.test.ts**: Teste le hook de sauvegarde des enregistrements

### 2. Tests d'Intégration
- **VideoRecording.integration.test.ts**: Teste le flux complet d'enregistrement vidéo

## Fonctionnalités Testées

### Enregistrement Vidéo
- ✅ Démarrage et arrêt de l'enregistrement
- ✅ Pause et reprise de l'enregistrement
- ✅ Gestion des erreurs de caméra
- ✅ Gestion des permissions
- ✅ Timer d'enregistrement
- ✅ Basculement entre caméras
- ✅ Contrôle du flash

### Sauvegarde des Vidéos
- ✅ Sauvegarde dans le stockage local
- ✅ Sauvegarde de secours (fallback)
- ✅ Sauvegarde dans la galerie de l'appareil
- ✅ Gestion des métadonnées (script, durée, qualité)
- ✅ Vérification de l'intégrité des fichiers
- ✅ Gestion des erreurs de stockage

### Gestion des Erreurs
- ✅ Erreurs de permissions
- ✅ Erreurs de caméra
- ✅ Erreurs de stockage
- ✅ Fichiers corrompus
- ✅ Récupération gracieuse

## Installation

### Installation automatique (recommandé)
```bash
node __tests__/recording/install-dependencies.js
```

### Installation manuelle

#### Dépendances de test
```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

#### Dépendances React Native (remplace expo-media-library)
```bash
npm install @react-native-camera-roll/camera-roll react-native-permissions react-native-fs --legacy-peer-deps
```

**Note :** `expo-media-library` a été remplacé par `@react-native-camera-roll/camera-roll` et `react-native-permissions` pour une meilleure compatibilité React Native pure.

## Exécution des Tests

### Tous les tests d'enregistrement vidéo
```bash
npm test -- __tests__/recording/
```

### Avec le script dédié
```bash
node __tests__/recording/test-runner.js
```

### Tests avec couverture
```bash
node __tests__/recording/test-runner.js --coverage
```

### Tests en mode watch
```bash
node __tests__/recording/test-runner.js --watch
```

### Tests spécifiques
```bash
# Tests unitaires uniquement
node __tests__/recording/test-runner.js --testNamePattern="VideoSaveService"

# Tests d'intégration uniquement
node __tests__/recording/test-runner.js --testNamePattern="integration"
```

## Configuration

### Variables d'environnement
- `NODE_ENV=test`: Active le mode test
- `JEST_VIDEO_RECORDING=true`: Active les tests d'enregistrement vidéo

### Configuration Jest
- Timeout: 10 secondes pour les tests d'intégration
- Couverture de code activée
- Mocks automatiques configurés
- Timers fake activés

## Mocks Utilisés

### Principaux Mocks
- **react-native-vision-camera**: Simulation de la caméra
- **@react-native-camera-roll/camera-roll**: Galerie et sauvegarde de médias (React Native)
- **react-native-permissions**: Gestion des permissions
- **react-native-fs**: Système de fichiers
- **Services de stockage**: Simulation du stockage local/Firebase

### Utilitaires de Mock
- `setupDefaultMocks()`: Configure tous les mocks avec des valeurs par défaut
- `createMockVideoFile()`: Crée un fichier vidéo de test
- `createMockRecording()`: Crée un enregistrement de test

## Exemples d'Utilisation

### Test d'un flux d'enregistrement simple
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useRecordingSave } from '../../src/screens/RecordingScreen/hooks/useRecordingSave';
import { setupDefaultMocks, createMockVideoFile } from './mocks';

test('enregistrement simple', async () => {
  setupDefaultMocks();

  const { result } = renderHook(() =>
    useRecordingSave({
      script: null,
      settings: { quality: 'high' },
      recordingDuration: 10,
      onSaveSuccess: jest.fn(),
    })
  );

  await act(async () => {
    const videoFile = createMockVideoFile('/test/recording.mp4', 10);
    await result.current.handleRecordingComplete(videoFile);
  });

  expect(result.current.onSaveSuccess).toHaveBeenCalled();
});
```

### Test avec erreur simulée
```typescript
test('gestion d\'erreur de stockage', async () => {
  const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
  hybridStorageService.saveRecording.mockRejectedValue(new Error('Storage full'));

  const { result } = renderHook(() =>
    useRecordingSave({
      script: null,
      settings: { quality: 'low' },
      recordingDuration: 5,
      onSaveError: jest.fn(),
    })
  );

  await act(async () => {
    const videoFile = createMockVideoFile('/test/error.mp4', 5);
    await result.current.handleRecordingComplete(videoFile);
  });

  expect(result.current.onSaveError).toHaveBeenCalledWith(expect.any(Error));
});
```

## Métriques de Test

### Couverture Cible
- **Branches**: 70%
- **Fonctions**: 75%
- **Lignes**: 80%
- **Instructions**: 80%

### Performance
- **Timeout par test**: 10 secondes
- **Taille des mocks**: Optimisée pour la rapidité
- **Parallélisation**: Supportée par Jest

## Dépannage

### Problèmes Courants

1. **Tests lents**: Vérifier les timeouts et les mocks
2. **Mémoires résiduelles**: Utiliser `jest.clearAllMocks()`
3. **Permissions**: Vérifier les mocks de permissions
4. **Timers**: Utiliser `jest.useFakeTimers()`

### Debug
```bash
# Debug mode
node __tests__/recording/test-runner.js --debug

# Verbose logging
node __tests__/recording/test-runner.js --verbose
```

## Contribution

### Ajouter un nouveau test
1. Créer le fichier de test dans `__tests__/recording/`
2. Importer les mocks nécessaires depuis `mocks.ts`
3. Utiliser `setupDefaultMocks()` au début de chaque test
4. Suivre les conventions de nommage existantes

### Ajouter un mock
1. Ajouter le mock dans `mocks.ts`
2. L'exporter depuis le fichier
3. Mettre à jour `setup.js` si nécessaire
4. Documenter l'utilisation dans ce README
