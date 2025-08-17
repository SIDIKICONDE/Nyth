# 🤖 Système de Messages de Bienvenue AI Configurables

## 📋 Vue d'ensemble

Ce système permet aux utilisateurs de configurer la fréquence d'apparition des messages de bienvenue personnalisés générés par l'IA dans l'application WritelyAI.

## 🏗️ Architecture

### Composants Principaux

1. **`useWelcomeBubblePreferences`** - Hook de gestion des préférences
2. **`WelcomeBubbleSettings`** - Modal de configuration complète
3. **`WelcomeBubbleSection`** - Section dans les paramètres
4. **`useWelcomeBubble`** - Hook principal modifié pour utiliser les préférences

### Structure des Fichiers

```
src/
├── hooks/
│   └── useWelcomeBubblePreferences.ts          # Gestion des préférences
├── components/
│   ├── settings/
│   │   ├── WelcomeBubbleSettings.tsx           # Modal de configuration
│   │   ├── WelcomeBubbleSection.tsx            # Section paramètres
│   │   └── README_WelcomeBubble.md             # Cette documentation
│   ├── home/UnifiedHomeFAB/hooks/
│   │   └── useWelcomeBubble.ts                 # Hook modifié

└── locales/fr/
    └── translation.json                        # Traductions
```

## ⚙️ Types de Fréquence

| Type          | Description        | Comportement                           |
| ------------- | ------------------ | -------------------------------------- |
| `never`       | Jamais             | Aucun message ne s'affiche             |
| `once`        | Une seule fois     | Message unique, jamais répété          |
| `daily`       | Une fois par jour  | Maximum un message par jour            |
| `twice_daily` | Deux fois par jour | Matin (6h-12h) et après-midi (14h-20h) |
| `session`     | À chaque ouverture | À chaque lancement de l'app            |
| `connection`  | À chaque connexion | À chaque connexion utilisateur         |
| `hourly`      | Toutes les heures  | Nouveau message chaque heure           |

## 🔧 Utilisation

### Hook Principal

```typescript
import { useWelcomeBubblePreferences } from "@/hooks/useWelcomeBubblePreferences";

const {
  settings, // Paramètres actuels
  isLoaded, // État de chargement
  updateFrequency, // Changer la fréquence
  shouldShowWelcome, // Vérifier si afficher
  markAsShown, // Marquer comme affiché
  resetSettings, // Réinitialiser
  getFrequencyLabel, // Libellé de la fréquence
  getFrequencyDescription, // Description de la fréquence
} = useWelcomeBubblePreferences();
```

### Composant de Paramètres

```typescript
import { WelcomeBubbleSection } from "@/components/settings/WelcomeBubbleSection";

// Dans votre écran de paramètres
<WelcomeBubbleSection />;
```

### Modal de Configuration

```typescript
import { WelcomeBubbleSettings } from "@/components/settings/WelcomeBubbleSettings";

const [showModal, setShowModal] = useState(false);

<WelcomeBubbleSettings
  visible={showModal}
  onClose={() => setShowModal(false)}
/>;
```

## 💾 Stockage des Données

### Clé de Stockage

- **Clé**: `@welcome_bubble_preferences`
- **Format**: JSON avec interface `WelcomeBubbleSettings`

### Structure des Données

```typescript
interface WelcomeBubbleSettings {
  frequency: WelcomeBubbleFrequency;
  lastShown: string | null; // ISO string
  showCount: number; // Compteur total
}
```

## 🔄 Logique de Déclenchement

### Algorithme de Décision

```typescript
const shouldShow = await shouldShowWelcome();
```

La fonction `shouldShowWelcome()` vérifie :

1. **Never**: Toujours `false`
2. **Once**: `true` si `showCount === 0`
3. **Daily**: `true` si dernière date ≠ aujourd'hui
4. **Twice Daily**:
   - Matin si dernière fois l'après-midi
   - Après-midi si dernière fois le matin
   - Nouveau jour
5. **Session**: Toujours `true`
6. **Connection**: Toujours `true`
7. **Hourly**: `true` si > 1 heure depuis la dernière fois

### Intégration avec useWelcomeBubble

```typescript
// Ancien système (supprimé)
// if (lastWelcomeDate !== today) { ... }

// Nouveau système
const shouldShow = await shouldShowWelcome();
if (!shouldShow) return;

// Affichage du message
await markAsShown(); // Mise à jour automatique
```

## 🎨 Interface Utilisateur

### Section dans les Paramètres

- **Icône**: Robot (MaterialCommunityIcons)
- **Titre**: "Messages de Bienvenue AI"
- **Informations**: Fréquence actuelle + nombre de messages
- **Action**: Ouvre le modal de configuration

### Modal de Configuration

- **En-tête**: Titre + boutons fermer/reset
- **Description**: Explication du système
- **Options**: Liste des fréquences avec descriptions
- **Statistiques**: Compteur et dernière date
- **Note**: Information sur l'IA/fallback

## 🌐 Internationalisation

### Traductions Françaises

```json
{
  "welcomeBubble": {
    "settings": {
      "title": "Messages de Bienvenue AI",
      "frequency": {
        "never": "Jamais",
        "once": "Une seule fois"
        // ... autres fréquences
      },
      "descriptions": {
        "never": "Le message de bienvenue ne s'affichera jamais"
        // ... autres descriptions
      }
    }
  }
}
```

## 🔄 Migration

### Ancien Système → Nouveau Système

L'ancien système utilisait :

- `@last_welcome_${user.uid}` pour les utilisateurs connectés
- `@guest_welcome_shown` pour les invités

Le nouveau système :

- **Unifie** la gestion avec une seule clé
- **Conserve** la compatibilité (pas de migration forcée)
- **Améliore** la flexibilité avec plus d'options

## 📈 Avantages

### Pour les Utilisateurs

- ✅ **Contrôle total** sur la fréquence des messages
- ✅ **Options variées** adaptées à tous les usages
- ✅ **Interface intuitive** avec descriptions claires
- ✅ **Statistiques** pour suivre l'utilisation

### Pour les Développeurs

- ✅ **Code modulaire** et réutilisable
- ✅ **TypeScript complet** avec types stricts
- ✅ **Tests intégrés** pour validation
- ✅ **Documentation complète**

## 🚀 Utilisation en Production

1. **Activation**: Le système est automatiquement actif
2. **Défaut**: Fréquence "daily" (une fois par jour)
3. **Compatibilité**: Fonctionne avec l'ancien système
4. **Performance**: Stockage local, pas de réseau requis

## 🔧 Maintenance

### Points d'Attention

- **AsyncStorage**: Gestion des erreurs de lecture/écriture
- **Dates**: Gestion des fuseaux horaires
- **Performance**: Éviter les appels répétés à `shouldShowWelcome()`
- **Mémoire**: Nettoyage des listeners et timers

### Débogage

```typescript
// Logs disponibles dans useWelcomeBubblePreferences
console.log("Paramètres chargés:", settings);
console.log("Doit afficher:", await shouldShowWelcome());
```

---

**📝 Note**: Ce système remplace l'ancienne logique de déclenchement tout en maintenant la compatibilité avec l'existant. Les utilisateurs peuvent maintenant personnaliser complètement leur expérience de messages de bienvenue AI.
