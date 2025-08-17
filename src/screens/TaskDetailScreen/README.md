# TaskDetailScreen

Un écran de détails de tâche refactorisé et modulaire pour afficher et gérer les informations d'une tâche.

## 🏗️ Structure

```
TaskDetailScreen/
├── components/              # Composants UI réutilisables
│   ├── TaskDetailHeader.tsx        # En-tête avec navigation et menu
│   ├── TaskStatusSlider.tsx        # Slider pour changer le statut
│   ├── TaskDetailsCard.tsx         # Carte des détails de la tâche
│   ├── TaskAttachmentsCard.tsx     # Carte des pièces jointes
│   ├── TaskMenuOverlay.tsx         # Menu overlay des actions
│   ├── TaskErrorView.tsx           # Vue d'erreur si tâche non trouvée
│   └── index.ts                    # Exports des composants
├── hooks/                   # Hooks personnalisés
│   └── useTaskDetail.ts            # Logique métier principale
├── __tests__/              # Tests unitaires
│   └── TaskDetailScreen.test.tsx   # Tests du composant principal
├── constants.ts             # Constantes (options de statut, labels)
├── types.ts                 # Interfaces TypeScript
├── utils.ts                 # Fonctions utilitaires
├── styles.ts                # Styles partagés
├── TaskDetailScreen.tsx     # Composant principal
├── index.ts                 # Export public
└── README.md                # Cette documentation
```

## 🎯 Architecture

### Séparation des responsabilités

1. **`TaskDetailScreen.tsx`** : Composant principal qui orchestre la structure
2. **`useTaskDetail.ts`** : Hook contenant toute la logique d'état et les handlers
3. **Composants modulaires** : Chaque partie de l'UI est un composant indépendant
4. **Styles centralisés** : Tous les styles dans `styles.ts`

### Flux de données

```
TaskDetailScreen
    ├── useTaskDetail (logique)
    ├── TaskDetailHeader
    ├── TaskStatusSlider
    ├── TaskDetailsCard
    ├── TaskAttachmentsCard
    └── TaskMenuOverlay
```

## 🚀 Utilisation

```tsx
import { TaskDetailScreen } from "./screens/TaskDetailScreen";

// Dans votre navigation
<Stack.Screen name="TaskDetail" component={TaskDetailScreen} />;
```

## 📦 Composants

### TaskDetailHeader

En-tête avec bouton de retour, titre de la tâche et menu d'actions.

### TaskStatusSlider

Slider interactif pour changer le statut de la tâche avec indicateurs visuels. **Masqué par défaut** et peut être affiché via le menu.

### TaskDetailsCard

Affichage des détails de la tâche (description, priorité, dates, etc.).

### TaskAttachmentsCard

Affichage des pièces jointes, images et tags de la tâche.

### TaskMenuOverlay

Menu contextuel pour les actions (modifier, supprimer, masquer/afficher le statut).

### TaskErrorView

Vue d'erreur affichée quand une tâche n'est pas trouvée.

## 🔧 Hooks

### useTaskDetail

Hook principal contenant :

- Gestion de l'état local
- Handlers pour les actions
- Logique de navigation
- Gestion des erreurs

## 📁 Fichiers utilitaires

### constants.ts

Contient les constantes partagées :

- `STATUS_OPTIONS` : Options de statut avec labels et couleurs
- `PRIORITY_LABELS` : Labels des priorités

### types.ts

Interfaces TypeScript pour tous les composants et props.

### utils.ts

Fonctions utilitaires réutilisables :

- `getStatusIndex` : Obtenir l'index d'un statut
- `getStatusFromIndex` : Obtenir un statut depuis un index
- `formatDate` : Formater une date
- `getPriorityColor` : Obtenir la couleur d'une priorité

## 🎨 Styles

Tous les styles sont centralisés dans `styles.ts` avec une structure claire et réutilisable.

## 🧪 Tests

Tests unitaires dans `__tests__/` pour vérifier le bon fonctionnement des composants.

## 🔄 Avantages de la refactorisation

1. **Maintenabilité** : Code plus facile à maintenir et à tester
2. **Réutilisabilité** : Composants modulaires réutilisables
3. **Lisibilité** : Structure claire et logique séparée
4. **Performance** : Optimisations possibles par composant
5. **Testabilité** : Tests unitaires plus faciles à écrire
