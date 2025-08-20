# 📱 Système de Mode Hors Ligne

## Vue d'ensemble

Le système de mode hors ligne permet à l'application de fonctionner sans connexion internet en mettant en cache les données localement et en synchronisant automatiquement les modifications lorsque la connexion est rétablie.

## 🏗️ Architecture

### Composants principaux

1. **OfflineManager** (`src/services/OfflineManager.ts`)
   - Service singleton qui gère l'état de connexion
   - Gère le cache local et les opérations en attente
   - Synchronise automatiquement au retour en ligne

2. **useOfflineMode** (`src/hooks/useOfflineMode.ts`)
   - Hook React pour accéder aux fonctionnalités hors ligne
   - Fournit l'état de connexion et les méthodes de cache

3. **OfflineIndicator** (`src/components/ui/OfflineIndicator.tsx`)
   - Composant visuel qui informe l'utilisateur du mode hors ligne
   - Affiche le nombre d'opérations en attente

## 🚀 Utilisation

### Dans un composant React

```typescript
import { useOfflineMode } from '@/hooks/useOfflineMode';

function MonComposant() {
  const { 
    isOfflineMode,
    saveForOffline,
    getFromOffline,
    addPendingOperation,
    pendingOperationsCount
  } = useOfflineMode();

  // Sauvegarder des données pour le mode hors ligne
  const handleSave = async (data) => {
    await saveForOffline('mes-donnees', data);
    
    if (isOfflineMode) {
      // Ajouter une opération à synchroniser plus tard
      addPendingOperation({
        type: 'update-data',
        data: data,
        action: async () => {
          // Cette fonction sera exécutée au retour en ligne
          await updateDataInFirebase(data);
        }
      });
    }
  };

  // Récupérer des données du cache
  const loadData = async () => {
    const cachedData = await getFromOffline('mes-donnees');
    if (cachedData) {
      // Utiliser les données en cache
      setData(cachedData);
    }
  };

  return (
    <View>
      {isOfflineMode && (
        <Text>Mode hors ligne - {pendingOperationsCount} modifications en attente</Text>
      )}
      {/* Votre UI */}
    </View>
  );
}
```

### Configuration Firebase

La persistance Firestore est automatiquement activée avec un cache de 50 MB :

```typescript
// src/config/firebase.ts
db.settings({
  persistence: true,
  cacheSizeBytes: 50 * 1024 * 1024, // 50 MB
});
```

## 🔄 Cycle de vie

1. **Détection de l'état réseau**
   - NetInfo surveille en permanence la connexion
   - L'état est mis à jour automatiquement

2. **Mode hors ligne**
   - Les données sont chargées depuis le cache local
   - Les modifications sont stockées dans une file d'attente
   - L'utilisateur est informé via l'indicateur visuel

3. **Retour en ligne**
   - Synchronisation automatique des opérations en attente
   - Mise à jour du cache avec les données du serveur
   - Notification de succès/échec

## 📦 Stockage des données

### Cache local
- Utilise AsyncStorage pour stocker les données
- Clés préfixées par `@offline_`
- Format : `{ data, timestamp }`

### Opérations en attente
- Stockées dans `@pending_operations`
- Exécutées dans l'ordre FIFO au retour en ligne
- Retry automatique en cas d'échec

## 🎨 Personnalisation

### Modifier la taille du cache Firestore

```typescript
// src/config/firebase.ts
db.settings({
  cacheSizeBytes: 100 * 1024 * 1024, // 100 MB
});
```

### Personnaliser l'indicateur visuel

```typescript
// Dans votre composant
<OfflineIndicator 
  position="bottom"  // ou "top"
  showDetails={true}  // Afficher plus d'informations
/>
```

## 🐛 Débogage

### Logs
Le système utilise des loggers optimisés :
- `OfflineManager` : État réseau et synchronisation
- `useOfflineMode` : Utilisation du hook
- `AuthProvider` : Mode hors ligne au démarrage

### Statistiques
```typescript
const stats = await offlineManager.getOfflineStats();
console.log(`
  Données en cache: ${stats.dataCount}
  Opérations en attente: ${stats.pendingOperations}
  Taille du cache: ${stats.cacheSize} octets
`);
```

## ⚠️ Limitations

1. **Taille du cache** : Limitée par l'espace disponible sur l'appareil
2. **Types d'opérations** : Certaines opérations (upload de fichiers) nécessitent une connexion
3. **Synchronisation** : Les conflits doivent être gérés manuellement
4. **Authentification** : La connexion initiale nécessite internet

## 🔒 Sécurité

- Les données sensibles doivent être chiffrées avant le cache
- Le cache est effacé à la déconnexion de l'utilisateur
- Les tokens d'authentification ont une durée de vie limitée

## 📝 TODO

- [ ] Ajouter le chiffrement des données en cache
- [ ] Implémenter la résolution de conflits
- [ ] Ajouter des métriques de performance
- [ ] Créer des tests unitaires
- [ ] Optimiser la synchronisation par batch
