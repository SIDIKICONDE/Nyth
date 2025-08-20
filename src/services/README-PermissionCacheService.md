# PermissionCacheService - Cache des permissions

## Description

Le `PermissionCacheService` est un service centralisé de gestion et cache des permissions dans l'application. Il évite les demandes répétées de permissions déjà accordées ou refusées, améliorant ainsi l'expérience utilisateur et réduisant les latences.

## Problèmes résolus

1. **Demandes répétées** : Évite de redemander des permissions déjà accordées/réfusées
2. **Performance** : Cache persistant via AsyncStorage pour une disponibilité immédiate
3. **Expiration intelligente** : Cache avec durée configurable selon le type de permission
4. **Gestion multi-plateforme** : Support iOS et Android avec leurs spécificités
5. **Centralisation** : Point unique pour toute gestion des permissions

## Types de permissions supportés

```typescript
enum PermissionType {
  CAMERA = "camera",
  MICROPHONE = "microphone",
  PHOTO_LIBRARY = "photo_library",
  PHOTO_LIBRARY_ADD_ONLY = "photo_library_add_only",
  WRITE_EXTERNAL_STORAGE = "write_external_storage",
  READ_EXTERNAL_STORAGE = "read_external_storage",
  READ_MEDIA_VIDEO = "read_media_video",
  READ_MEDIA_IMAGES = "read_media_images",
}

enum PermissionStatus {
  GRANTED = "granted",
  DENIED = "denied",
  LIMITED = "limited",
  BLOCKED = "blocked",
  UNAVAILABLE = "unavailable",
  UNKNOWN = "unknown",
}
```

## Utilisation de base

### Vérifier une permission

```typescript
import { PermissionCacheService, PermissionType } from "@/services/PermissionCacheService";

const permissionCache = PermissionCacheService.getInstance();

// Vérifier si la permission est accordée (avec cache)
const isGranted = await permissionCache.isPermissionGranted(PermissionType.CAMERA);
if (isGranted) {
  // Permission déjà accordée, pas besoin de demander
  startCamera();
} else {
  // Permission non accordée ou expirée, il faut demander
  requestCameraPermission();
}
```

### Mettre à jour le cache après demande

```typescript
// Après avoir demandé une permission
const granted = await requestCameraPermission();
await permissionCache.updatePermissionCache(PermissionType.CAMERA, granted);
```

### Utilisation avec FileManager

```typescript
import { FileManager } from "@/services/social-share/utils/fileManager";

// Demander les permissions caméra et micro avec cache
const result = await FileManager.requestCameraAndMicrophonePermissions();
if (result.allGranted) {
  startRecording();
}

// Vérifier le statut d'une permission spécifique
const status = await FileManager.getCachedPermissionStatus(PermissionType.CAMERA);

// Invalider le cache si nécessaire
await FileManager.invalidatePermissionCache(PermissionType.CAMERA);
```

## Fonctionnalités avancées

### Statistiques du cache

```typescript
const stats = FileManager.getPermissionCacheStats();
console.log(`Total: ${stats.total}, Accordées: ${stats.granted}, Refusées: ${stats.denied}`);
```

### Gestion manuelle du cache

```typescript
const permissionCache = PermissionCacheService.getInstance();

// Invalider une permission spécifique
await permissionCache.invalidatePermissionCache(PermissionType.CAMERA);

// Nettoyer tout le cache
await permissionCache.clearCache();

// Obtenir le statut brut du cache
const status = await permissionCache.getCachedPermissionStatus(PermissionType.CAMERA);
```

## Configuration du cache

### Durées d'expiration par défaut

- **Permissions accordées** : 24 heures
- **Permissions refusées** : 1 heure (pour permettre de nouveaux essais)
- **Permissions limitées** : 24 heures

### Personnalisation des durées

```typescript
// Cache court pour les permissions sensibles
await permissionCache.updatePermissionCache(
  PermissionType.CAMERA,
  true, // granted
  false, // limited
  60 * 60 * 1000 // 1 heure
);
```

## Avantages

1. **Performance** : Accès instantané aux permissions déjà vérifiées
2. **UX** : Réduction des popups de demande de permissions
3. **Persistance** : Cache sauvegardé entre les sessions
4. **Flexibilité** : Durées d'expiration configurables
5. **Debugging** : Statistiques et logs détaillés
6. **Multi-plateforme** : Gestion unifiée iOS/Android

## Services utilisant le cache

- **FileManager** : Permissions galerie, caméra, microphone
- **CameraModule** : Permissions caméra et micro
- **RecordingScreen** : Permissions d'enregistrement
- **ProfileService** : Permissions photos de profil

## Architecture

### Singleton Pattern

Le service utilise le pattern Singleton pour garantir une instance unique et un cache partagé.

### Persistence

Le cache est automatiquement sauvegardé dans AsyncStorage avec la clé `permission_cache`.

### Expiration automatique

Les entrées expirées sont automatiquement nettoyées au chargement du cache.

## Migration

Pour migrer vers ce système :

1. Importer le PermissionCacheService
2. Remplacer les appels directs aux APIs de permissions
3. Utiliser `isPermissionGranted()` avant de demander
4. Appeler `updatePermissionCache()` après chaque demande
5. Tester avec les différentes plateformes

## Tests

Les tests sont disponibles dans `src/services/__tests__/PermissionCacheService.test.ts` :

```bash
# Exécuter les tests
npm test -- PermissionCacheService.test.ts
```

## Plateformes supportées

- **iOS** : Support complet des permissions CameraRoll et react-native-permissions
- **Android** : Support des permissions modernes (Android 13+) et legacy

## Debugging

Le service log toutes ses opérations avec le logger `PermissionCacheService`. En production, ces logs peuvent être réduits ou désactivés pour des raisons de performance.
