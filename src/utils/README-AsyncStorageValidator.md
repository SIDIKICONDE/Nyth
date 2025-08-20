# AsyncStorageValidator - Validation et réparation d'AsyncStorage

## Description

L'`AsyncStorageValidator` est un utilitaire complet de validation, réparation et maintenance d'AsyncStorage. Il détecte automatiquement la corruption des données JSON, tente de les réparer, et nettoie les données obsolètes pour maintenir les performances de l'application.

## Problèmes résolus

1. **Corruption de données** : Détecte les JSON malformés causés par des crashs ou interruptions
2. **Données obsolètes** : Nettoie automatiquement les vieilles données pour économiser l'espace
3. **Récupération silencieuse** : Les services continuent à fonctionner même avec des données corrompues
4. **Maintenance proactive** : Validation automatique au démarrage des services

## Fonctions principales

### `validateAndRepair(options)`

Valide et répare AsyncStorage avec options configurables.

```typescript
import { AsyncStorageValidator } from "@/utils/asyncStorageValidator";

const result = await AsyncStorageValidator.validateAndRepair({
  keys: ["permission_cache", "firestore_error_notifications"], // Clés spécifiques
  autoRepair: true,           // Tenter de réparer automatiquement
  removeCorrupted: true,      // Supprimer les données non réparables
  onProgress: (key, status) => {
    console.log(`Clé ${key}: ${status}`); // 'valid' | 'repaired' | 'corrupted'
  }
});

console.log(result.stats); // { totalKeys: 10, validKeys: 8, repairedKeys: 2, invalidKeys: 0 }
```

### `getStorageStats()`

Obtient des statistiques détaillées sur AsyncStorage.

```typescript
const stats = await AsyncStorageValidator.getStorageStats();
// {
//   totalKeys: 15,
//   totalSize: 245760, // Taille en bytes
//   largestKeys: [
//     { key: "firestore_error_notifications", size: 102400 },
//     { key: "permission_cache", size: 51200 }
//   ]
// }
```

### `cleanupStorage(maxAgeDays?)`

Nettoie les données obsolètes plus vieilles que le nombre de jours spécifié.

```typescript
const result = await AsyncStorageValidator.cleanupStorage(30);
// {
//   cleanedKeys: ["emergency_recording_old"],
//   freedSpace: 2048 // Bytes libérés
// }
```

## Stratégies de réparation

### Par type de clé

L'utilitaire applique différentes stratégies selon le type de données :

- **`firestore_error_notifications`** : Réinitialise avec un tableau vide `[]`
- **`permission_cache`** : Réinitialise avec un objet vide `{}`
- **`emergency_recording_*`** : Crée un objet d'enregistrement par défaut
- **`user_preferences`** : Réinitialise avec un objet vide `{}`
- **Autres clés JSON** : Tente de nettoyer le JSON corrompu

### Nettoyage de JSON corrompu

L'utilitaire tente plusieurs stratégies pour réparer le JSON :

1. **Ajout d'accolades manquantes** : `{"test": "value"` → `{"test": "value"}`
2. **Suppression de caractères de fin** : `{"test": "value"}abc` → `{"test": "value"}`
3. **Récupération de sous-objets valides** : Extrait les objets JSON valides
4. **Valeur par défaut** : Utilise `{}` ou `[]` selon le contexte

## Intégration dans les services

### PermissionCacheService

```typescript
// Validation automatique au chargement
private async loadCache(): Promise<void> {
  const validationResult = await AsyncStorageValidator.validateAndRepair({
    keys: [this.CACHE_KEY],
    autoRepair: true,
    removeCorrupted: false
  });

  if (validationResult.repairedKeys.length > 0) {
    logger.info("Cache des permissions réparé automatiquement");
  }
}
```

### FirestoreErrorNotificationService

```typescript
// Validation des notifications
private async loadNotifications(): Promise<void> {
  const validationResult = await AsyncStorageValidator.validateAndRepair({
    keys: [this.STORAGE_KEY],
    autoRepair: true,
    removeCorrupted: false
  });
}
```

## Avantages

1. **Transparence** : Détection et réparation automatiques sans intervention utilisateur
2. **Robustesse** : L'application continue à fonctionner même avec des données corrompues
3. **Performance** : Nettoyage automatique des données obsolètes
4. **Maintenance** : Validation proactive au démarrage des services
5. **Flexibilité** : Stratégies de réparation adaptées selon le type de données

## Résultats de validation

La méthode `validateAndRepair` retourne un objet détaillé :

```typescript
interface AsyncStorageValidationResult {
  isValid: boolean;
  errors: string[];
  corruptedKeys: string[];
  repairedKeys: string[];
  stats: {
    totalKeys: number;
    validKeys: number;
    invalidKeys: number;
    repairedKeys: number;
  };
}
```

## Gestion d'erreurs

### Erreurs de lecture
- Les clés illisibles sont automatiquement supprimées
- Le service continue avec les données restantes

### Échecs de réparation
- Les données non réparables sont supprimées (si `removeCorrupted: true`)
- Un log détaillé est créé pour le debugging

### Erreurs de nettoyage
- Les erreurs de suppression sont loggées mais n'interrompent pas le processus
- L'espace libéré est calculé approximativement

## Tests

Les tests sont disponibles dans `src/utils/__tests__/asyncStorageValidator.test.ts` :

```bash
# Exécuter les tests
npm test -- asyncStorageValidator.test.ts
```

## Logging

L'utilitaire log toutes ses opérations avec le logger `AsyncStorageValidator` :

- **Info** : Validation terminée avec statistiques
- **Warn** : Données corrompues détectées/réparées
- **Error** : Erreurs lors des opérations
- **Debug** : Détails des réparations individuelles

## Plateformes supportées

- **iOS** : Support complet avec AsyncStorage natif
- **Android** : Support complet avec AsyncStorage natif

## Bonnes pratiques

1. **Validation au démarrage** : Appeler `validateAndRepair()` au démarrage des services critiques
2. **Nettoyage périodique** : Utiliser `cleanupStorage()` régulièrement pour maintenir les performances
3. **Monitoring** : Surveiller les logs pour détecter les patterns de corruption
4. **Backup** : Sauvegarder les données importantes avant réparation
5. **Tests** : Tester la validation avec des données corrompues en développement
