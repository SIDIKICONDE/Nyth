# Système Multilingue des Messages Contextuels

## Vue d'ensemble

Le système de messages contextuels prend maintenant en charge 11 langues et détecte automatiquement la langue préférée de l'utilisateur pour afficher les salutations et messages appropriés.

## Langues supportées

- **Français (fr)** - Langue par défaut
- **Anglais (en)** - English
- **Espagnol (es)** - Español
- **Japonais (ja)** - 日本語
- **Allemand (de)** - Deutsch
- **Italien (it)** - Italiano
- **Portugais (pt)** - Português
- **Russe (ru)** - Русский
- **Coréen (ko)** - 한국어
- **Chinois (zh)** - 中文

- **Hindi (hi)** - हिन्दी

## Fonctionnalités

### 1. Détection automatique de la langue

Le système détecte la langue de l'utilisateur selon cette priorité :

1. **Langue du contexte utilisateur** (`context.preferredLanguage`)
2. **Langue stockée** dans AsyncStorage (`userLanguage`, `@language_preference`, `app_language`)
3. **Langue système** via `Localization.locale`
4. **Langue du device** via `getDeviceLanguage()`
5. **Fallback** vers le français

```typescript
import { detectSystemLanguage } from "@/utils/contextual-messages";

const language = await detectSystemLanguage();
console.log(language); // "fr", "en", "es", etc.
```

### 2. Salutations contextuelles selon l'heure

Les salutations s'adaptent à l'heure ET à la langue :

```typescript
import { getTimeGreeting } from "@/utils/contextual-messages";

// Salutation automatique selon l'heure actuelle
const greeting = await getTimeGreeting(undefined, "fr");
// Résultat : "Bonjour" (5h-12h), "Bon après-midi" (12h-18h),
//           "Bonsoir" (18h-22h), "Bonne nuit" (22h-5h)

// Salutation selon timeOfDay spécifique
const eveningGreeting = await getTimeGreeting("evening", "en");
// Résultat : "Good evening"
```

### 3. Messages d'urgence multilingues

En cas d'erreur, le système affiche un message d'urgence dans la langue de l'utilisateur :

```typescript
import { getEmergencyMessage } from "@/utils/contextual-messages";

const message = await getEmergencyMessage(context);
// Français : "Bienvenue ! Je suis votre assistant IA."
// Anglais : "Welcome! I'm your AI assistant."
// Espagnol : "¡Bienvenido! Soy tu asistente de IA."
```

### 4. Utilitaires de localisation

```typescript
import {
  getUserPreferredLanguage,
  getLocalizedText,
  isSupportedLanguage,
} from "@/utils/contextual-messages";

// Obtenir la langue préférée de l'utilisateur
const language = await getUserPreferredLanguage(context);

// Vérifier si une langue est supportée
if (isSupportedLanguage("ja")) {
  console.log("Japonais supporté !");
}

// Localiser un texte
const localizedText = getLocalizedText(
  {
    fr: "Bonjour le monde",
    en: "Hello world",
    es: "Hola mundo",
  },
  language,
  "Hello"
); // Fallback si langue non trouvée
```

## Intégration avec le système existant

Le système multilingue réutilise la logique existante de `useWelcomeBubble.ts` et l'étend pour être utilisable dans toute l'architecture modulaire.

### Exemples d'utilisation

#### Dans un composant React

```typescript
import { useEffect, useState } from "react";
import { getLocalizedGreeting } from "@/utils/contextual-messages";

const MyComponent = ({ context }) => {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const loadGreeting = async () => {
      const localizedGreeting = await getLocalizedGreeting(context);
      setGreeting(localizedGreeting);
    };
    loadGreeting();
  }, [context]);

  return <Text>{greeting}</Text>;
};
```

#### Dans le système de messages

```typescript
import { contextualMessageSystem } from "@/utils/contextual-messages";

// Le système détecte automatiquement la langue et génère
// des messages appropriés
const message = await contextualMessageSystem.generateOptimalMessage(
  user,
  scripts,
  recordings,
  {
    preferAI: true,
    useCache: true,
    messageType: "welcome",
  }
);

// Le message sera automatiquement dans la langue de l'utilisateur
console.log(message.message);
```

## Horaires des salutations

| Heure   | Français       | Anglais        | Espagnol      | Japonais           |
| ------- | -------------- | -------------- | ------------- | ------------------ |
| 5h-12h  | Bonjour        | Good morning   | Buenos días   | おはようございます |
| 12h-18h | Bon après-midi | Good afternoon | Buenas tardes | こんにちは         |
| 18h-22h | Bonsoir        | Good evening   | Buenas tardes | こんばんは         |
| 22h-5h  | Bonne nuit     | Good night     | Buenas noches | おやすみなさい     |

## Extension du système

Pour ajouter une nouvelle langue :

1. **Ajouter la langue** dans `SUPPORTED_LANGUAGES`
2. **Définir les salutations** dans `getTimeGreeting`
3. **Ajouter le message d'urgence** dans `EMERGENCY_MESSAGES`
4. **Mettre à jour les titres** dans `MessageProcessor.getEmergencyFallbackMessage`

```typescript
// Exemple pour le néerlandais (nl)
export const SUPPORTED_LANGUAGES = [
  "fr", "en", "es", "ja", "de", "it", "pt", "ru", "ko", "zh", "hi", "nl"
] as const;

// Dans getTimeGreeting
nl: {
  morning: "Goedemorgen",
  afternoon: "Goedemiddag",
  evening: "Goedenavond",
  night: "Goedenacht",
}

// Dans EMERGENCY_MESSAGES
nl: "Welkom! Ik ben je AI-assistent."
```

## Avantages

✅ **Détection automatique** - Pas besoin de configuration manuelle  
✅ **Fallback intelligent** - Toujours un message approprié  
✅ **Réutilisation** - Intègre le système existant  
✅ **Performance** - Mise en cache des détections de langue  
✅ **Extensibilité** - Facile d'ajouter de nouvelles langues  
✅ **Cohérence** - Même logique dans toute l'application
