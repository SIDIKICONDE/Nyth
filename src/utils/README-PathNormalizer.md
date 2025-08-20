# PathNormalizer - Utilitaire de normalisation des chemins

## Description

Le `PathNormalizer` est un utilitaire centralisé pour gérer la normalisation des chemins de fichiers dans l'application. Il résout les problèmes de cohérence entre les plateformes iOS et Android, ainsi que les différents formats de chemins (avec/sans préfixe `file://`).

## Problèmes résolus

1. **Inconsistance des chemins** : Différents formats selon la plateforme et le contexte
2. **Gestion manuelle du préfixe `file://`** : Code dupliqué dans plusieurs services
3. **Encodage URI** : Problèmes avec les espaces et caractères spéciaux
4. **Validation de fichiers** : Vérifications répétitives de l'existence des fichiers

## Fonctions disponibles

### `normalizeFilePath(inputPath, options?)`

Normalise un chemin de fichier selon les options spécifiées.

```typescript
import { normalizeFilePath } from "@/utils/pathNormalizer";

// Utilisation basique
const path = await normalizeFilePath("/storage/video.mp4");

// Avec options
const path = await normalizeFilePath("/storage/video.mp4", {
  forceFilePrefix: true,    // Force l'ajout de file://
  decodeUri: true,          // Décode les %20, etc.
  validateExistence: true   // Vérifie que le fichier existe
});
```

### `toLocalPath(uri)`

Convertit une URI en chemin local (sans préfixe `file://`).

```typescript
import { toLocalPath } from "@/utils/pathNormalizer";

const localPath = toLocalPath("file:///storage/video.mp4");
// Résultat: "/storage/video.mp4"
```

### `toFileUri(localPath)`

Convertit un chemin local en URI (avec préfixe `file://`).

```typescript
import { toFileUri } from "@/utils/pathNormalizer";

const fileUri = toFileUri("/storage/video.mp4");
// Résultat: "file:///storage/video.mp4"
```

### `isValidFileUri(path)`

Vérifie si un chemin est une URI de fichier valide.

```typescript
import { isValidFileUri } from "@/utils/pathNormalizer";

console.log(isValidFileUri("file:///storage/video.mp4")); // true
console.log(isValidFileUri("/storage/video.mp4")); // true
console.log(isValidFileUri("http://example.com/video.mp4")); // false
```

### `getFileName(path)`

Extrait le nom du fichier d'un chemin.

```typescript
import { getFileName } from "@/utils/pathNormalizer";

const fileName = getFileName("/storage/videos/video.mp4");
// Résultat: "video.mp4"
```

### `getDirectoryPath(path)`

Extrait le chemin du répertoire parent.

```typescript
import { getDirectoryPath } from "@/utils/pathNormalizer";

const dirPath = getDirectoryPath("/storage/videos/video.mp4");
// Résultat: "/storage/videos"
```

## Avantages

1. **Cohérence** : Tous les chemins sont normalisés de la même manière
2. **Maintenance** : Modifications centralisées
3. **Robustesse** : Gestion d'erreurs et logging intégrés
4. **Performance** : Évite les duplications de logique
5. **Testabilité** : Fonctions pures et testables

## Utilisation dans l'application

Le PathNormalizer est utilisé dans :

- `FileManager` : Validation et sauvegarde des vidéos
- `RecordingsService` : Gestion des chemins de vidéos
- `useRecordingSave` : Sauvegarde des enregistrements
- `AttachmentService` : Upload de fichiers
- `ProfileService` : Gestion des photos de profil

## Exemple d'utilisation

```typescript
// Avant (code dupliqué)
const fileUri = videoPath.startsWith("file://") ? videoPath : `file://${videoPath}`;

// Après (utilisation centralisée)
const { toFileUri } = require("@/utils/pathNormalizer");
const fileUri = toFileUri(videoPath);
```

## Tests

Les tests sont disponibles dans `src/utils/__tests__/pathNormalizer.test.ts` :

```bash
# Exécuter les tests
npm test -- pathNormalizer.test.ts
```

## Migration

Pour migrer vers cette nouvelle fonction :

1. Importer la fonction appropriée
2. Remplacer le code de gestion manuelle des chemins
3. Supprimer les fonctions locales dupliquées
4. Vérifier que les tests passent

## Plateformes supportées

- **iOS** : Gestion spécifique du préfixe `file://` obligatoire
- **Android** : Flexible, supporte les deux formats

## Logging

Toutes les opérations sont loggées avec le logger `PathNormalizer` pour faciliter le debugging.
