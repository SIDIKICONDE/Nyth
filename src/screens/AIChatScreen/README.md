# AIChatScreen - Structure refactorisée

Ce dossier contient la version refactorisée de l'écran AIChatScreen, organisée en plusieurs fichiers pour une meilleure maintenabilité.

## Structure

```
AIChatScreen/
├── components/
│   ├── QuickActionsMenu.tsx    # Composant pour le menu d'actions rapides
│   └── index.ts                # Export des composants
├── hooks/
│   ├── useQuickActions.ts      # Hook pour gérer les actions rapides
│   ├── useInitialContext.ts    # Hook pour gérer le contexte initial
│   └── index.ts                # Export des hooks
├── types/
│   └── index.ts                # Types TypeScript
├── AIChatScreen.tsx            # Composant principal refactorisé
├── index.tsx                   # Point d'entrée
└── README.md                   # Documentation
```

## Composants

### QuickActionsMenu
Composant responsable de l'affichage du menu d'actions rapides qui apparaît lorsqu'un contexte initial est fourni.

**Props :**
- `visible`: boolean - Contrôle la visibilité du menu
- `quickActions`: QuickAction[] - Liste des actions disponibles
- `onActionPress`: (action: QuickAction) => void - Callback pour les clics sur les actions
- `onClose`: () => void - Callback pour fermer le menu

## Hooks

### useQuickActions
Hook personnalisé qui retourne la configuration des actions rapides (analyser, améliorer, corriger, question personnalisée) avec internationalisation.

**Retourne :** `QuickAction[]`

### useInitialContext
Hook personnalisé qui gère la logique du contexte initial pour éviter les duplications et déclencher l'affichage du menu d'actions rapides.

**Paramètres :**
- `initialContext`: string? - Le contexte initial fourni
- `onContextReceived`: (content: string) => void - Callback appelé quand le contexte est reçu

## Types

### QuickAction
Interface définissant la structure d'une action rapide.

```typescript
interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  prompt: (content: string) => string;
}
```

### AIChatScreenParams
Interface définissant les paramètres de route pour l'écran AIChatScreen.

```typescript
interface AIChatScreenParams {
  initialContext?: string;
  returnScreen?: string;
}
```

## Clés de traduction

Les clés de traduction utilisées dans cette refactorisation :

### Section `ai.actions`
- `ai.actions.analyze` - "Analyser" / "Analyze"
- `ai.actions.improve` - "Améliorer" / "Improve"
- `ai.actions.correct` - "Corriger" / "Correct"
- `ai.actions.customQuestion` - "Question personnalisée" / "Custom Question"

### Section `ai.quickActions`
- `ai.quickActions.title` - "Que voulez-vous faire avec ce script ?" / "What would you like to do with this script?"

### Section `common`
- `common.cancel` - "Annuler" / "Cancel"
- `common.language` - "Langue" / "Language"

## Avantages de cette refactorisation

1. **Séparation des responsabilités** : Chaque fichier a une responsabilité claire
2. **Réutilisabilité** : Les hooks et composants peuvent être réutilisés
3. **Maintenabilité** : Plus facile de maintenir et de déboguer
4. **Testabilité** : Chaque partie peut être testée indépendamment
5. **Lisibilité** : Code plus clair et mieux organisé
6. **Internationalisation** : Support complet de l'i18n avec le hook `useTranslation`

## Utilisation

Pour utiliser cette version refactorisée, il suffit d'importer le composant :

```typescript
import AIChatScreen from './AIChatScreen';
```

Le composant fonctionne exactement comme avant, mais avec une architecture interne améliorée. 