# PlanningScreen

Un écran de planification refactorisé et modulaire pour gérer les objectifs et les événements.

## 🏗️ Structure

```
PlanningScreen/
├── components/              # Composants UI réutilisables
│   ├── PlanningScreenHeader.tsx    # En-tête avec actions
│   ├── PlanningScreenTabs.tsx      # Navigation par onglets
│   ├── TimelineTabContent.tsx      # Contenu de l'onglet Timeline
│   ├── AnalyticsTabContent.tsx     # Contenu de l'onglet Analytics
│   ├── GoalsList.tsx               # Liste des objectifs
│   └── index.ts                    # Exports des composants
├── hooks/                   # Hooks personnalisés
│   └── usePlanningScreen.ts        # Logique métier principale
├── types.ts                 # Interfaces TypeScript
├── constants.ts             # Constantes (tabs, etc.)
├── styles.ts                # Styles partagés
├── PlanningScreen.tsx       # Composant principal
├── index.ts                 # Export public
└── README.md                # Cette documentation
```

## 🎯 Architecture

### Séparation des responsabilités

1. **`PlanningScreen.tsx`** : Composant principal qui orchestre la structure
2. **`usePlanningScreen.ts`** : Hook contenant toute la logique d'état et les handlers
3. **Composants modulaires** : Chaque partie de l'UI est un composant indépendant
4. **Types centralisés** : Toutes les interfaces dans `types.ts`
5. **Constantes externalisées** : Configuration dans `constants.ts`

### Flux de données

```
PlanningScreen
    ├── usePlanningScreen (logique)
    ├── PlanningScreenHeader
    ├── PlanningScreenTabs
    └── TabContent (Timeline/Calendar/Analytics)
```

## 🚀 Utilisation

```tsx
import { PlanningScreen } from "./screens/PlanningScreen";

// Dans votre navigation
<Stack.Screen name="Planning" component={PlanningScreen} />;
```

## 📦 Composants

### PlanningScreenHeader

- Affiche le titre "Planification"
- Boutons d'action : Créer événement, Créer objectif, Paramètres

### PlanningScreenTabs

- Navigation entre : Objectifs (Timeline), Calendrier, Analytics
- Mise en avant visuelle de l'onglet actif

### TimelineTabContent

- Affiche la liste des objectifs via `GoalsList`
- Affiche la timeline des événements via `EventTimeline`

### GoalsList

- Carte pour chaque objectif avec progression
- Indicateur de priorité coloré
- Affichage du progrès et de la période

### AnalyticsTabContent

- Placeholder pour les futures fonctionnalités analytics

## 🔧 Hook usePlanningScreen

Gère :

- État des modals (événement, objectif, paramètres)
- Navigation entre onglets
- Handlers pour CRUD des événements
- Handlers pour CRUD des objectifs
- Intégration avec `usePlanning()`

## 🎨 Thème

Le composant s'adapte automatiquement au thème via `useTheme()` :

- Couleurs de fond et de surface
- Couleurs de texte principal et secondaire
- Couleurs d'accent pour les actions

## 🌐 Internationalisation

Toutes les chaînes sont internationalisées via `useTranslation()` :

- `planning.title` - Titre de l'écran
- `planning.tabs.*` - Labels des onglets
- `planning.goals.*` - Textes liés aux objectifs
- `planning.events.*` - Textes liés aux événements

## 📈 Évolutions futures

- [ ] Implémenter l'onglet Analytics avec graphiques
- [ ] Ajouter des filtres pour les objectifs
- [ ] Permettre la réorganisation des objectifs
- [ ] Ajouter des templates d'objectifs
- [ ] Intégrer des rappels push

## 🔄 Migration

L'ancien fichier monolithique de 606 lignes a été refactorisé en :

- 9 fichiers modulaires
- Code plus maintenable et testable
- Meilleure séparation des responsabilités
- Performance optimisée avec moins de re-renders
