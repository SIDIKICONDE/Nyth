# GoalsList Module

Module refactorisé pour la gestion et l'affichage des objectifs dans l'écran de planification.

## Structure

```
GoalsList/
├── index.ts                    # Point d'entrée principal
├── GoalsList.tsx              # Composant principal
├── types.ts                   # Définitions TypeScript
├── constants.ts               # Constantes et configuration
├── README.md                  # Documentation
├── components/                # Composants UI
│   ├── index.ts
│   ├── EmptyState.tsx         # État vide
│   ├── ActionMenu.tsx         # Menu contextuel
│   └── GoalCard.tsx           # Carte d'objectif
├── hooks/                     # Hooks personnalisés
│   └── useGoalActions.ts      # Gestion des actions
└── utils/                     # Utilitaires
    └── goalUtils.ts           # Fonctions utilitaires
```

## Composants

### GoalsList

Composant principal qui orchestre l'affichage des objectifs.

**Props:**

- `goals`: Liste des objectifs
- `onGoalPress`: Callback pour l'édition
- `onGoalDelete`: Callback pour la suppression
- `onGoalProgressUpdate`: Callback pour la mise à jour de progression
- `onGoalComplete`: Callback pour marquer accompli
- `onGoalReactivate`: Callback pour réactiver

### GoalCard

Composant pour afficher une carte d'objectif individuelle.

**Fonctionnalités:**

- Affichage du titre, progression, priorité
- Actions rapides (+1/-1)
- Bouton "Accompli" à 100%
- Menu contextuel
- États visuels (actif/accompli)

### ActionMenu

Menu contextuel modal avec les actions disponibles.

**Actions:**

- Modifier
- Marquer accompli (si actif)
- Réactiver (si accompli)
- Supprimer

### EmptyState

État vide affiché quand aucun objectif n'existe.

## Hooks

### useGoalActions

Hook pour centraliser la logique des actions avec confirmations.

**Fonctionnalités:**

- Gestion des alertes de confirmation
- Calculs de progression
- Callbacks optimisés avec useCallback

## Utilitaires

### goalUtils

Fonctions utilitaires pour les objectifs.

**Fonctions:**

- `getPriorityColor()`: Couleur selon priorité
- `getPriorityIcon()`: Icône selon priorité
- `calculateIncrement/Decrement()`: Calculs de progression
- `canMarkComplete()`: Vérification d'accomplissement
- `formatProgress()`: Formatage du texte de progression

## Constantes

### PRIORITY_COLORS

Couleurs par priorité:

- `high`: #EF4444 (rouge)
- `medium`: #F59E0B (orange)
- `low`: #10B981 (vert)

### PRIORITY_ICONS

Icônes par priorité:

- `high`: 🔴
- `medium`: 🟡
- `low`: 🟢

### GOAL_CARD_CONFIG

Configuration des cartes:

- `padding`: 12px
- `borderRadius`: 12px
- `progressCircleSize`: 36px
- `progressBarHeight`: 4px

## Usage

```tsx
import { GoalsList } from "./components/GoalsList";

<GoalsList
  goals={goals}
  onGoalPress={handleEditGoal}
  onGoalDelete={handleDeleteGoal}
  onGoalProgressUpdate={handleUpdateProgress}
  onGoalComplete={handleCompleteGoal}
  onGoalReactivate={handleReactivateGoal}
/>;
```

## Avantages de la Refactorisation

1. **Séparation des responsabilités**: Chaque composant a un rôle précis
2. **Réutilisabilité**: Composants modulaires réutilisables
3. **Maintenabilité**: Code plus facile à maintenir et déboguer
4. **Testabilité**: Composants isolés plus faciles à tester
5. **Performance**: Optimisations avec useCallback et React.memo
6. **Type Safety**: Types TypeScript bien définis
7. **Documentation**: Code auto-documenté avec types et utilitaires
