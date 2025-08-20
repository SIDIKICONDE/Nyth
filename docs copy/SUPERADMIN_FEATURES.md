# 🛡️ Documentation des Fonctionnalités Superadmin

## Vue d'ensemble

Le panneau Superadmin offre un contrôle complet sur l'application avec des fonctionnalités avancées de gestion, monitoring et sécurité.

## 📋 Collections Firestore

### 1. Configuration Système (`/system/config`)
Stocke la configuration globale de l'application.

**Champs:**
- `maintenanceMode`: boolean - Active/désactive le mode maintenance
- `maintenanceMessage`: string - Message affiché en mode maintenance
- `allowNewRegistrations`: boolean - Autorise les nouvelles inscriptions
- `allowGuestAccess`: boolean - Autorise l'accès invité
- `maxRecordingsPerUser`: number - Limite d'enregistrements par utilisateur
- `maxRecordingDuration`: number - Durée max en minutes
- `enableAIFeatures`: boolean - Active les fonctionnalités IA
- `enablePushNotifications`: boolean - Active les notifications push
- `enableAutoBackup`: boolean - Active les sauvegardes automatiques
- `backupFrequency`: string - Fréquence des backups (daily/weekly/monthly)
- `enableDataExport`: boolean - Autorise l'export de données
- `enableUserDeletion`: boolean - Autorise la suppression d'utilisateurs
- `sessionTimeout`: number - Timeout de session en minutes
- `maxLoginAttempts`: number - Tentatives de connexion max
- `enableTwoFactor`: boolean - Active la 2FA
- `enableEmailVerification`: boolean - Vérification email obligatoire
- `enableRateLimiting`: boolean - Active le rate limiting
- `rateLimitRequests`: number - Requêtes max par minute
- `enableDebugMode`: boolean - Mode debug
- `enableAnalytics`: boolean - Active les analytics
- `enableCrashReporting`: boolean - Rapports de crash
- `enablePerformanceMonitoring`: boolean - Monitoring de performance

### 2. Logs Système (`/system_logs`)
Enregistre tous les événements système.

**Champs:**
- `timestamp`: timestamp - Date/heure de l'événement
- `level`: string - Niveau (info/warning/error/critical)
- `category`: string - Catégorie (auth/admin/user/system/security/performance)
- `message`: string - Message du log
- `userId`: string - ID de l'utilisateur concerné
- `userEmail`: string - Email de l'utilisateur
- `metadata`: object - Données supplémentaires
- `ip`: string - Adresse IP
- `userAgent`: string - User agent du navigateur
- `stackTrace`: string - Stack trace pour les erreurs

### 3. Audit Trail (`/audit_trail`)
Trace toutes les actions administratives.

**Champs:**
- `timestamp`: timestamp - Date/heure de l'action
- `action`: string - Type d'action effectuée
- `userId`: string - ID de l'admin qui a effectué l'action
- `targetId`: string - ID de la cible de l'action
- `metadata`: object - Détails de l'action
- `result`: string - Résultat de l'action (success/failure)

### 4. Sessions Actives (`/active_sessions`)
Gère les sessions utilisateur actives.

**Champs:**
- `userId`: string - ID de l'utilisateur
- `sessionId`: string - ID unique de session
- `startTime`: timestamp - Début de session
- `lastActivity`: timestamp - Dernière activité
- `deviceInfo`: object - Informations sur l'appareil
- `ip`: string - Adresse IP

### 5. Rate Limits (`/rate_limits`)
Contrôle les limites de taux par utilisateur.

**Champs:**
- `userId`: string - ID de l'utilisateur
- `requests`: number - Nombre de requêtes effectuées
- `resetTime`: timestamp - Heure de réinitialisation
- `blocked`: boolean - Si l'utilisateur est bloqué

### 6. Notifications Admin (`/admin_notifications`)
Notifications pour les administrateurs.

**Champs:**
- `title`: string - Titre de la notification
- `message`: string - Message
- `timestamp`: timestamp - Date/heure
- `createdBy`: string - ID du créateur
- `priority`: string - Priorité (low/medium/high/critical)
- `read`: boolean - Si la notification a été lue
- `readAt`: timestamp - Date/heure de lecture
- `readBy`: string - ID de l'admin qui a lu

### 7. Templates Email (`/email_templates`)
Templates pour les emails automatiques.

**Champs:**
- `name`: string - Nom du template
- `subject`: string - Sujet de l'email
- `body`: string - Corps de l'email (HTML)
- `variables`: array - Variables disponibles
- `lastModified`: timestamp - Dernière modification
- `modifiedBy`: string - ID du modificateur

### 8. Métriques de Performance (`/performance_metrics`)
Données de performance de l'application.

**Champs:**
- `timestamp`: timestamp - Date/heure de la métrique
- `metric`: string - Nom de la métrique
- `value`: number - Valeur mesurée
- `userId`: string - ID de l'utilisateur concerné
- `operation`: string - Opération mesurée
- `duration`: number - Durée en millisecondes

### 9. Backups (`/backups`)
Informations sur les sauvegardes.

**Champs:**
- `timestamp`: timestamp - Date/heure du backup
- `type`: string - Type de backup (manual/automatic)
- `size`: number - Taille en bytes
- `status`: string - Statut (pending/in_progress/completed/failed)
- `location`: string - Emplacement de stockage
- `createdBy`: string - ID du créateur (pour backups manuels)

## 🔒 Règles de Sécurité

### Permissions par Rôle

| Collection | User | Admin | Super Admin |
|------------|------|-------|-------------|
| system/config | Read | Read | Read/Write |
| system_logs | - | Read | Read/Write |
| audit_trail | - | - | Read |
| active_sessions | Own | Read All | Read/Write All |
| rate_limits | Own | Read All | Read/Write All |
| admin_notifications | - | Read/Write | Read/Write |
| email_templates | - | Read | Read/Write |
| performance_metrics | Create Own | Read All | Read/Write All |
| backups | - | - | Read/Write |

## 📊 Index Firestore

Les index suivants sont créés pour optimiser les requêtes :

### system_logs
- `[level, timestamp DESC]` - Filtrer par niveau
- `[category, timestamp DESC]` - Filtrer par catégorie
- `[level, category, timestamp DESC]` - Filtrer par niveau et catégorie
- `[userId, timestamp DESC]` - Logs par utilisateur
- `[timestamp DESC]` - Tous les logs récents

### audit_trail
- `[userId, timestamp DESC]` - Actions par admin
- `[action, timestamp DESC]` - Filtrer par type d'action
- `[targetId, timestamp DESC]` - Actions sur une cible

### active_sessions
- `[userId, lastActivity DESC]` - Sessions par utilisateur
- `[lastActivity ASC]` - Sessions expirées

### performance_metrics
- `[metric, timestamp DESC]` - Métriques par type
- `[userId, metric, timestamp DESC]` - Métriques par utilisateur

### admin_notifications
- `[read, timestamp DESC]` - Notifications non lues
- `[createdBy, timestamp DESC]` - Notifications par créateur

### backups
- `[timestamp DESC]` - Backups récents
- `[type, timestamp DESC]` - Backups par type

## 🚀 Déploiement

### 1. Déployer les règles et index

```bash
# Depuis la racine du projet
./scripts/deploy-firestore-rules.sh
```

### 2. Initialiser la configuration

```javascript
// Dans la console Firebase ou via un script
const defaultConfig = {
  maintenanceMode: false,
  maintenanceMessage: "L'application est en maintenance.",
  allowNewRegistrations: true,
  allowGuestAccess: false,
  maxRecordingsPerUser: 100,
  maxRecordingDuration: 60,
  enableAIFeatures: true,
  enablePushNotifications: true,
  enableAutoBackup: true,
  backupFrequency: "daily",
  enableDataExport: true,
  enableUserDeletion: false,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  enableTwoFactor: false,
  enableEmailVerification: true,
  enableRateLimiting: true,
  rateLimitRequests: 60,
  enableDebugMode: false,
  enableAnalytics: true,
  enableCrashReporting: true,
  enablePerformanceMonitoring: true
};

await setDoc(doc(firestore, "system", "config"), defaultConfig);
```

## 🔧 Utilisation dans l'Application

### Hook useSystemConfig

```typescript
import { useSystemConfig } from '@/hooks/useSystemConfig';

function MyComponent() {
  const { config, loading, updateConfig } = useSystemConfig();
  
  if (config.maintenanceMode) {
    return <MaintenanceScreen message={config.maintenanceMessage} />;
  }
  
  // ...
}
```

### Service de Logging

```typescript
import { systemLog } from '@/services/SystemLogService';

// Log d'information
systemLog.info('auth', 'Utilisateur connecté', { userId: user.uid });

// Log d'erreur
systemLog.error('system', 'Erreur de connexion', error);

// Log de performance
systemLog.logPerformance('api_call', duration, { endpoint: '/api/data' });

// Log de sécurité
systemLog.logSecurity('suspicious_activity', 'high', { ip: request.ip });
```

## 📈 Monitoring

### Dashboard Métriques
- Nombre total de logs par niveau
- Erreurs critiques des dernières 24h
- Sessions actives en temps réel
- Performance moyenne par opération
- Taux de requêtes par minute

### Alertes Automatiques
- Mode maintenance activé/désactivé
- Erreurs critiques détectées
- Limite de taux dépassée
- Sessions suspectes
- Échec de backup

## 🛠️ Maintenance

### Nettoyage Automatique
- Logs > 30 jours
- Sessions expirées
- Métriques > 90 jours
- Backups > 6 mois

### Backup Manuel
```bash
# Via le panneau admin ou script
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)
```

## ⚠️ Considérations de Sécurité

1. **Accès Restreint** : Seuls les super admins ont accès complet
2. **Audit Trail** : Toutes les actions admin sont enregistrées
3. **Rate Limiting** : Protection contre les abus
4. **Logs Immutables** : Les logs ne peuvent pas être modifiés
5. **Chiffrement** : Données sensibles chiffrées
6. **2FA** : Authentification à deux facteurs pour les admins

## 📝 Checklist de Mise en Production

- [ ] Déployer les règles Firestore
- [ ] Créer les index
- [ ] Initialiser la configuration par défaut
- [ ] Configurer les backups automatiques
- [ ] Activer le monitoring
- [ ] Tester le mode maintenance
- [ ] Vérifier les permissions
- [ ] Configurer les alertes
- [ ] Former les administrateurs
- [ ] Documenter les procédures d'urgence