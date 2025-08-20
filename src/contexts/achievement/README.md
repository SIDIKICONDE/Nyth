# Achievement Context

Ce dossier contient le contexte modulaire pour la gestion des notifications d'achievements.

## Structure

```
achievement/
├── index.ts              # Point d'entrée principal avec tous les exports publics
├── types.ts              # Définitions TypeScript des interfaces et types
├── context.ts            # Création du contexte React
├── hooks.ts              # Hooks personnalisés (useAchievementNotifications)
├── AchievementProvider.tsx  # Composant Provider principal
└── README.md             # Documentation
```

## Utilisation

```tsx
// Import depuis le dossier achievement
import {
  AchievementProvider,
  useAchievementNotifications,
} from "@/contexts/achievement";

// Ou via l'ancien fichier pour la compatibilité
import {
  AchievementProvider,
  useAchievementNotifications,
} from "@/contexts/AchievementContext";
```

## Architecture

### Séparation des responsabilités

1. **types.ts** : Contient toutes les interfaces TypeScript

   - `AchievementContextType` : Interface du contexte
   - `AchievementProviderProps` : Props du Provider
   - `AchievementState` : État interne du Provider

2. **context.ts** : Création simple du contexte React

3. **hooks.ts** : Hooks personnalisés pour accéder au contexte

   - `useAchievementNotifications()` : Hook principal avec vérification

4. **AchievementProvider.tsx** : Logique métier

   - Gestion de la file d'attente des notifications
   - État local avec `useState`
   - Effet pour traiter la queue automatiquement
   - Rendu conditionnel des notifications

5. **index.ts** : Exports centralisés pour une API publique claire

## Avantages de cette structure

- ✅ **Modularité** : Chaque fichier a une responsabilité unique
- ✅ **Maintenabilité** : Plus facile de localiser et modifier le code
- ✅ **Testabilité** : Chaque module peut être testé indépendamment
- ✅ **Réutilisabilité** : Les types et hooks peuvent être importés séparément
- ✅ **Évolutivité** : Facile d'ajouter de nouvelles fonctionnalités
- ✅ **Documentation** : Structure auto-documentée et claire
