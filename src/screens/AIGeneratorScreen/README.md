# AIGeneratorScreen Module

Module pour la génération de scripts avec l'intelligence artificielle.

## Structure

```
AIGeneratorScreen/
├── components/          # Composants UI spécifiques
│   ├── SettingsButton.tsx
│   └── index.ts
├── hooks/              # Logique métier et état
│   ├── useUserPreferences.ts    # Gestion des préférences utilisateur
│   ├── useScriptGeneration.ts   # Logique de génération de script
│   ├── useAIGeneratorScreen.ts  # Hook principal combinant toute la logique
│   └── index.ts
├── types/              # Types TypeScript
│   └── index.ts
├── utils/              # Utilitaires (si nécessaire)
├── AIGeneratorScreen.tsx  # Composant principal
├── index.tsx           # Point d'entrée du module
└── README.md          # Documentation
```

## Composants

### AIGeneratorScreen
Composant principal qui orchestre l'écran de génération AI.

### SettingsButton
Boutons de navigation vers les paramètres AI et le chat AI.

## Hooks

### useAIGeneratorScreen
Hook principal qui gère tout l'état et la logique de l'écran.

### useUserPreferences
Gère le chargement et la sauvegarde des préférences utilisateur.

### useScriptGeneration
Gère la logique de génération de script avec l'API AI.

## Types

- `AIGeneratorState`: État principal du générateur
- `UserPreferences`: Préférences utilisateur sauvegardées
- `PlatformType`: Types de plateformes supportées
- `ToneType`: Types de tons disponibles

## Utilisation

```tsx
import AIGeneratorScreen from './screens/AIGeneratorScreen';

// Dans votre navigation
<Stack.Screen name="AIGenerator" component={AIGeneratorScreen} />
``` 