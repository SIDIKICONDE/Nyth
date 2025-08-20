# FirestoreErrorNotificationService - Notifications d'erreur Firestore

## Description

Le `FirestoreErrorNotificationService` est un service centralisé de gestion des notifications d'erreur Firestore. Il informe les utilisateurs quand les métadonnées ne peuvent pas être synchronisées avec le cloud, tout en permettant à l'application de continuer à fonctionner normalement.

## Problèmes résolus

1. **Silence des erreurs Firestore** : Les erreurs de synchronisation étaient seulement loggées
2. **Manque de feedback utilisateur** : L'utilisateur n'était pas informé des problèmes de sync
3. **Pas de récupération** : Aucune possibilité de retry ou de suivi des erreurs
4. **Persistance des erreurs** : Les problèmes temporaires n'étaient pas mémorisés

## Types d'erreurs supportés

```typescript
enum FirestoreErrorType {
  METADATA_SAVE_FAILED = "metadata_save_failed",    // Échec sauvegarde métadonnées
  SYNC_FAILED = "sync_failed",                      // Échec synchronisation
  BACKUP_FAILED = "backup_failed",                   // Échec sauvegarde cloud
  CONNECTION_ISSUE = "connection_issue"              // Problème de connexion
}
```

## Utilisation de base

### Notifier une erreur Firestore

```typescript
import { FirestoreErrorNotificationService, FirestoreErrorType } from "@/services/FirestoreErrorNotificationService";

const notificationService = FirestoreErrorNotificationService.getInstance();

try {
  await firestoreOperation();
} catch (error) {
  await notificationService.notifyError(
    FirestoreErrorType.METADATA_SAVE_FAILED,
    error,
    {
      showAlert: true,
      persistNotification: true,
      customMessage: "Les métadonnées n'ont pas pu être synchronisées mais la vidéo est sauvegardée localement."
    }
  );
}
```

### Vérifier les notifications actives

```typescript
// Vérifier s'il y a des notifications
const hasNotifications = await notificationService.hasActiveNotifications();

// Obtenir le nombre de notifications
const count = await notificationService.getNotificationCount();

// Obtenir toutes les notifications
const notifications = await notificationService.getActiveNotifications();
```

### Afficher un résumé des problèmes

```typescript
// Afficher un résumé des erreurs
await notificationService.showNotificationSummary();
```

## Options de notification

```typescript
interface FirestoreNotificationOptions {
  showAlert?: boolean;              // Afficher une alerte (défaut: true)
  persistNotification?: boolean;    // Sauvegarder la notification (défaut: true)
  allowRetry?: boolean;             // Permettre le retry (défaut: true)
  customTitle?: string;             // Titre personnalisé
  customMessage?: string;           // Message personnalisé
}
```

## Architecture

### Singleton Pattern

Le service utilise le pattern Singleton pour garantir une instance unique et un état partagé.

### Persistence

Les notifications sont sauvegardées dans AsyncStorage avec la clé `firestore_error_notifications`.

### Expiration automatique

Les notifications sont automatiquement nettoyées après 24h.

### Messages par défaut

Chaque type d'erreur a un titre et message par défaut, mais ils peuvent être personnalisés.

## Avantages

1. **Transparence** : L'utilisateur est informé des problèmes de synchronisation
2. **Continuité** : L'application continue à fonctionner même en cas d'erreur
3. **Récupération** : Possibilité de retry et de suivi des problèmes
4. **Persistance** : Les erreurs sont mémorisées entre les sessions
5. **Personnalisation** : Messages adaptables selon le contexte

## Services utilisant les notifications

- **RecordingsService** : Erreurs de sauvegarde des métadonnées vidéo
- **ScriptsService** : Erreurs de synchronisation des scripts
- **ProfileService** : Erreurs de mise à jour du profil
- **AttachmentService** : Erreurs d'upload de fichiers

## Exemple d'intégration

### Avant (silencieux)
```typescript
try {
  await setDoc(docRef, metadata);
} catch (cloudError) {
  logger.warn("Échec Firestore (continuation en local)", cloudError);
  // L'utilisateur n'est pas informé
}
```

### Après (avec notification)
```typescript
try {
  await setDoc(docRef, metadata);
} catch (cloudError) {
  logger.warn("Échec Firestore (continuation en local)", cloudError);

  const notificationService = FirestoreErrorNotificationService.getInstance();
  await notificationService.notifyError(
    FirestoreErrorType.METADATA_SAVE_FAILED,
    cloudError,
    {
      customMessage: `Les métadonnées de "${scriptTitle}" n'ont pas pu être synchronisées.`
    }
  );
}
```

## Gestion des alertes

### Alerte simple
- Titre et message
- Bouton "OK" pour fermer
- Bouton "Réessayer" optionnel

### Résumé des notifications
- Affiche un résumé de toutes les erreurs actives
- Permet de voir les détails
- Option pour marquer toutes les notifications comme lues

## Logging

Le service log toutes ses opérations avec le logger `FirestoreErrorNotificationService` :

- **Info** : Notifications créées avec succès
- **Warn** : Erreurs de synchronisation
- **Debug** : Actions de gestion des notifications
- **Error** : Erreurs internes du service

## Tests

Les tests sont disponibles dans `src/services/__tests__/FirestoreErrorNotificationService.test.ts` :

```bash
# Exécuter les tests
npm test -- FirestoreErrorNotificationService.test.ts
```

## Plateformes supportées

- **iOS** : Support complet avec Alert natif
- **Android** : Support complet avec Alert natif

## Migration

Pour migrer vers ce système :

1. Importer le FirestoreErrorNotificationService
2. Remplacer les logs silencieux par des notifications
3. Configurer les options selon le contexte
4. Tester avec différents types d'erreur
5. Vérifier que les alertes sont appropriées
