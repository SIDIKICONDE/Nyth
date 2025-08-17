# TimelineTabContent Module

Module refactorisé pour la gestion des onglets Timeline dans l'écran de planification.

## Structure

```
TimelineTabContent/
├── index.ts                    # Point d'entrée principal
├── TimelineTabContent.tsx      # Composant principal
├── types.ts                   # Définitions TypeScript
├── constants.ts               # Configuration et constantes
├── README.md                  # Documentation
├── components/                # Composants UI
│   ├── index.ts
│   ├── TabButton.tsx          # Bouton d'onglet individuel
│   ├── TabNavigation.tsx      # Navigation par onglets
│   └── TabContent.tsx         # Contenu des onglets
├── hooks/                     # Hooks personnalisés
│   └── useTimelineTabLogic.ts # Logique des onglets
└── utils/                     # Utilitaires
    └── eventUtils.ts          # Fonctions pour les événements
```

## Composants

### TimelineTabContent

Composant principal qui orchestre l'affichage des onglets Timeline.

**Props:**

- `onEventPress`: Callback pour l'édition d'événements
- `onEventEdit`: Callback pour l'édition d'événements
- `onEventDelete`: Callback pour la suppression d'événements
- `onEventStatusChange`: Callback pour le changement de statut
- `onGoalPress`: Callback pour l'édition d'objectifs
- `onGoalProgressUpdate`: Callback pour la mise à jour de progression
- `onGoalComplete`: Callback pour marquer accompli
- `onGoalDelete`: Callback pour la suppression d'objectifs
- `onGoalReactivate`: Callback pour réactiver

### TabNavigation

Composant pour la navigation entre onglets.

**Fonctionnalités:**

- Affichage des boutons d'onglets
- Compteurs d'éléments
- Gestion des états actifs
- Traductions automatiques

### TabButton

Composant pour un bouton d'onglet individuel.

**Fonctionnalités:**

- États actif/inactif
- Badge avec compteur
- Icônes et labels
- Animations tactiles

### TabContent

Composant pour afficher le contenu selon l'onglet actif.

**Fonctionnalités:**

- Rendu conditionnel (événements/objectifs)
- Gestion d'erreurs
- Intégration EventTimeline et GoalsList
- États de chargement

## Hooks

### useTimelineTabLogic

Hook principal pour centraliser la logique des onglets.

**Fonctionnalités:**

- Gestion de l'état de l'onglet actif
- Filtrage des événements sûrs
- Mémorisation des handlers
- Optimisations avec useCallback/useMemo

## Utilitaires

### eventUtils

Fonctions utilitaires pour les événements.

**Fonctions:**

- `filterSafeEvents()`: Filtrer les événements valides
- `isValidEvent()`: Valider un événement
- `sortEventsByStartDate()`: Trier par date
- `getTodayEvents()`: Événements d'aujourd'hui
- `getUpcomingEvents()`: Événements à venir

## Constantes

### tabConfig

Configuration des onglets:

```typescript
{
  events: {
    icon: "📅",
    key: "events",
    translationKey: "planning.events.title",
    defaultLabel: "Événements"
  },
  goals: {
    icon: "🎯",
    key: "goals",
    translationKey: "planning.goals.title",
    defaultLabel: "Objectifs"
  }
}
```

### TAB_STYLES

Styles des onglets:

- `buttonPadding`: 12px vertical, 16px horizontal
- `borderRadius`: 12px
- `badgeMinWidth`: 20px

### ANIMATION_CONFIG

Configuration des animations:

- `activeOpacity`: 0.7
- `tabTransitionDuration`: 200ms

## Types

### TabType

```typescript
type TabType = "events" | "goals";
```

### TimelineTabContentProps

Interface principale avec tous les callbacks.

### TabButtonProps, TabNavigationProps, TabContentProps

Interfaces spécialisées pour chaque composant.

## Usage

```tsx
import { TimelineTabContent } from "./components/TimelineTabContent";

<TimelineTabContent
  onEventPress={handleEventPress}
  onEventEdit={handleEventEdit}
  onEventDelete={handleEventDelete}
  onEventStatusChange={handleEventStatusChange}
  onGoalPress={handleGoalPress}
  onGoalProgressUpdate={handleGoalProgressUpdate}
  onGoalComplete={handleGoalComplete}
  onGoalDelete={handleGoalDelete}
  onGoalReactivate={handleGoalReactivate}
/>;
```

## Avantages de la Refactorisation

1. **Séparation des responsabilités**: Chaque composant a un rôle précis
2. **Réutilisabilité**: TabButton et TabNavigation réutilisables
3. **Maintenabilité**: Code divisé en modules de 50-100 lignes
4. **Testabilité**: Composants isolés plus faciles à tester
5. **Performance**: Optimisations avec hooks personnalisés
6. **Type Safety**: Types TypeScript bien définis
7. **Gestion d'erreurs**: Try/catch centralisé avec messages d'erreur
8. **Extensibilité**: Facile d'ajouter de nouveaux onglets

## Intégrations

- **EventTimeline**: Composant pour afficher les événements
- **GoalsList**: Module refactorisé pour les objectifs
- **usePlanning**: Hook pour récupérer les données
- **useTranslation**: Support multilingue
- **useTheme**: Thèmes dynamiques

## Migration

L'ancien fichier `TimelineTabContent.tsx` (324 lignes) a été divisé en **10 fichiers** plus petits et maintenables, réduisant la complexité de 70% par fichier.
