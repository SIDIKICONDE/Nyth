# Configuration des Limites API Firebase Functions

## 📍 Localisation

Fichier: `functions/src/openaiKey.ts`
Lignes: 12-21

## ⚙️ Limites actuelles

### Utilisateurs Gratuits

- **Quotidien**: 10 requêtes/jour
- **Horaire**: 3 requêtes/heure

### Utilisateurs Premium

- **Quotidien**: 100 requêtes/jour
- **Horaire**: 20 requêtes/heure

## 🔧 Modifier les limites

Pour ajuster les limites, modifiez l'objet `DEFAULT_LIMITS` :

```typescript
const DEFAULT_LIMITS = {
  freeUsers: {
    requestsPerDay: 10, // ← Changez ici
    requestsPerHour: 3, // ← Changez ici
  },
  premiumUsers: {
    requestsPerDay: 100, // ← Changez ici
    requestsPerHour: 20, // ← Changez ici
  },
};
```

## 🚀 Appliquer les changements

Après modification, redéployez :

```bash
cd functions
firebase deploy --only functions
```

## 📊 Surveiller l'usage

Les données sont stockées dans Firestore :

- Collection: `usage/`
- Documents: `api_usage_{userId}_{date}`
- Champs: `requests`, `lastUpdate`

## 💡 Conseils

- **Démarrez conservateur** : Augmentez graduellement
- **Surveillez les coûts** OpenAI via leur dashboard
- **Logs Firebase** : Surveillez les rejets pour ajuster
- **Premium incentive** : Gardez un écart significatif gratuit vs premium

## 🚨 Urgence - Désactiver temporairement

Pour désactiver complètement la clé par défaut :

```typescript
// Dans getOpenAIKey, ajoutez au début :
throw new HttpsError("unavailable", "Service temporairement indisponible");
```

## 📈 Évolutions futures possibles

- Limites par minute/seconde
- Quotas basés sur les tokens/coût
- Limites variables selon l'heure
- Système de crédits/points
