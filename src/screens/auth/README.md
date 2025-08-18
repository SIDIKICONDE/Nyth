# Écrans d'Authentification

## Structure

Ce dossier contient les écrans d'authentification de l'application avec deux versions :

### Version Standard (avec Tailwind)
- `LoginScreen.tsx` - Écran de connexion standard
- `RegisterScreen.tsx` - Écran d'inscription standard

### Version Responsive ✨
- `ResponsiveLoginScreen.tsx` - Écran de connexion complètement responsive
- `ResponsiveRegisterScreen.tsx` - Écran d'inscription complètement responsive

## Utilisation recommandée

**Utilisez les versions Responsive** pour une meilleure expérience utilisateur sur tous les appareils.

## Fonctionnalités

### Connexion (Login)
- Connexion par email/mot de passe
- Connexion sociale (Google, Apple)
- Validation en temps réel
- Gestion des erreurs
- Lien "Mot de passe oublié"

### Inscription (Register)
- Formulaire complet (nom, prénom, email, mot de passe)
- Indicateur de force du mot de passe
- Validation des champs
- Acceptation des conditions d'utilisation
- Connexion sociale alternative

## Composants utilisés

### Version Standard
- `AuthContainer` - Container de base
- `AuthInput` - Champs de formulaire
- `AuthButton` - Boutons d'action
- `SocialAuthButtons` - Boutons sociaux

### Version Responsive
- `ResponsiveAuthContainer` - Container adaptatif
- `ResponsiveAuthInput` - Champs responsive
- `ResponsiveAuthButton` - Boutons adaptatifs
- `ResponsiveSocialAuthButtons` - Boutons sociaux responsive

## Migration

Pour migrer vers la version responsive, consultez le fichier `MIGRATION-GUIDE.md`.

## Exemples d'utilisation

### Import
```typescript
// Version responsive (recommandée)
import { ResponsiveLoginScreen, ResponsiveRegisterScreen } from '@/screens/auth/index.responsive';

// Version standard
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
```

### Navigation
```typescript
<Stack.Navigator>
  <Stack.Screen name="Login" component={ResponsiveLoginScreen} />
  <Stack.Screen name="Register" component={ResponsiveRegisterScreen} />
</Stack.Navigator>
```

## Captures d'écran

### Téléphone (Portrait)
- Layout vertical compact
- Boutons pleine largeur
- Espacement optimisé

### Tablette (Portrait/Paysage)
- Container centré avec largeur maximale
- Typographie plus grande
- Espacement généreux

## Personnalisation

Les écrans utilisent le thème de l'application et s'adaptent automatiquement au mode sombre/clair.

### Couleurs
- Primary : Couleur principale de l'app
- Background : Adaptatif selon le thème
- Text : Contraste optimal
- Error : Rouge pour les validations

### Dimensions
Toutes les dimensions sont gérées par le système responsive :
- `moderateScale()` pour les tailles
- `wp()/hp()` pour les pourcentages
- `dimensions` pour les espacements constants