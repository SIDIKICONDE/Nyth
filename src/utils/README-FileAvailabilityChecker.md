# FileAvailabilityChecker - Vérification intelligente de disponibilité des fichiers

## Description

Le `FileAvailabilityChecker` est un utilitaire intelligent qui remplace les attentes fixes par une vérification réelle de la disponibilité et de la stabilité des fichiers. Il est particulièrement utile pour les fichiers générés de manière asynchrone comme les vidéos enregistrées.

## Problèmes résolus

1. **Attente fixe inefficace** : Remplace le `setTimeout(300)` par une vérification intelligente
2. **Race conditions** : Attend que les fichiers soient complètement écrits
3. **Fichiers corrompus** : Vérifie la stabilité de la taille des fichiers
4. **Timeouts infinis** : Timeout configurable pour éviter les blocages

## Fonctions disponibles

### `waitForFileAvailability(filePath, options)`

Attend intelligemment qu'un fichier soit disponible et stable.

```typescript
import { waitForFileAvailability, DEFAULT_FILE_OPTIONS } from "@/utils/fileAvailabilityChecker";

// Attendre une vidéo avec options par défaut
const isAvailable = await waitForFileAvailability("/path/video.mp4", DEFAULT_FILE_OPTIONS.video);

// Attendre avec options personnalisées
const isAvailable = await waitForFileAvailability("/path/video.mp4", {
  timeoutMs: 10000,        // Timeout de 10 secondes
  checkIntervalMs: 200,    // Vérifier toutes les 200ms
  minSizeBytes: 1024,      // Au moins 1KB
  requiredStableChecks: 3  // 3 vérifications stables
});
```

### `isFileAvailable(filePath, minSizeBytes?)`

Vérification rapide de disponibilité sans attendre la stabilité.

```typescript
import { isFileAvailable } from "@/utils/fileAvailabilityChecker";

const isAvailable = await isFileAvailable("/path/video.mp4", 1024);
```

### `getFileDetails(filePath)`

Obtient des informations détaillées sur un fichier.

```typescript
import { getFileDetails } from "@/utils/fileAvailabilityChecker";

const details = await getFileDetails("/path/video.mp4");
// {
//   exists: true,
//   size: 2048,
//   isFile: true,
//   modificationTime: 1234567890
// }
```

## Options de configuration

### FileAvailabilityOptions

```typescript
interface FileAvailabilityOptions {
  timeoutMs?: number;           // Timeout maximum (défaut: 5000ms)
  checkIntervalMs?: number;     // Intervalle de vérification (défaut: 100ms)
  minSizeBytes?: number;        // Taille minimale requise (défaut: 0)
  requiredStableChecks?: number; // Nombre de vérifications stables (défaut: 2)
}
```

### Options par défaut par type de fichier

```typescript
const DEFAULT_FILE_OPTIONS = {
  video: {
    timeoutMs: 10000,         // 10s pour les vidéos
    checkIntervalMs: 200,     // Vérifier toutes les 200ms
    minSizeBytes: 1024,       // Au moins 1KB
    requiredStableChecks: 3   // 3 vérifications stables
  },

  image: {
    timeoutMs: 3000,          // 3s pour les images
    checkIntervalMs: 100,     // Vérifier toutes les 100ms
    minSizeBytes: 512,        // Au moins 512B
    requiredStableChecks: 2   // 2 vérifications stables
  },

  generic: {
    timeoutMs: 5000,          // 5s pour les fichiers génériques
    checkIntervalMs: 100,
    minSizeBytes: 1,
    requiredStableChecks: 2
  }
};
```

## Algorithme de vérification

1. **Vérification d'existence** : Le fichier doit exister
2. **Validation de type** : Doit être un fichier (pas un dossier)
3. **Contrôle de taille** : Doit avoir au moins la taille minimale
4. **Stabilité de taille** : La taille doit être stable sur plusieurs vérifications
5. **Timeout** : Abandon si le timeout est dépassé

## Avantages

1. **Efficacité** : Pas d'attente inutile, vérification dès que possible
2. **Fiabilité** : Détecte les fichiers corrompus ou incomplets
3. **Flexibilité** : Options configurables selon le type de fichier
4. **Performance** : Interruption immédiate dès que les conditions sont remplies
5. **Debugging** : Logs détaillés pour le troubleshooting

## Utilisation dans l'application

Le FileAvailabilityChecker est utilisé dans :

- **FileManager** : Vérification des vidéos avant sauvegarde dans la galerie
- **RecordingScreen** : Validation des fichiers enregistrés
- **Services de stockage** : Contrôle des fichiers avant upload

## Exemple d'utilisation

### Avant (attente fixe)
```typescript
// Attendre 300ms sans savoir si le fichier est prêt
await new Promise(resolve => setTimeout(resolve, 300));
```

### Après (vérification intelligente)
```typescript
// Attendre que le fichier soit réellement prêt
const isAvailable = await waitForFileAvailability(videoPath, DEFAULT_FILE_OPTIONS.video);
if (!isAvailable) {
  throw new Error("Fichier vidéo non disponible");
}
```

## Gestion d'erreurs

Le système gère automatiquement :

- **Fichiers inexistants** : Retry jusqu'au timeout
- **Fichiers trop petits** : Continue jusqu'à atteindre la taille minimale
- **Fichiers instables** : Attend la stabilisation
- **Timeouts** : Retourne `false` avec un log d'erreur

## Tests

Les tests sont disponibles dans `src/utils/__tests__/fileAvailabilityChecker.test.ts` :

```bash
# Exécuter les tests
npm test -- fileAvailabilityChecker.test.ts
```

## Logging

Toutes les opérations sont loggées avec le logger `FileAvailabilityChecker` :

- **Debug** : Détails des vérifications en cours
- **Info** : Fichier disponible avec succès
- **Warn** : Timeout atteint
- **Error** : Erreurs lors des opérations

## Plateformes supportées

- **iOS** : Support complet avec gestion des chemins spécifiques
- **Android** : Support complet avec RNFS

## Migration

Pour migrer vers ce système :

1. Importer les fonctions nécessaires
2. Remplacer les `setTimeout` par `waitForFileAvailability`
3. Configurer les options selon le type de fichier
4. Gérer les cas où la fonction retourne `false`
5. Tester avec différents scénarios
