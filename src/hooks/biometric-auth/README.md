# Module d'Authentification Biométrique

Ce module fournit une interface complète pour gérer l'authentification biométrique dans l'application.

## Structure

- **types.ts** : Définit les interfaces et types TypeScript
- **constants.ts** : Contient les constantes et configurations par défaut
- **settings.ts** : Gère le chargement et la sauvegarde des paramètres
- **auth.ts** : Fournit les fonctions d'authentification biométrique
- **useBiometricAuth.ts** : Hook React principal qui combine toutes les fonctionnalités

## Utilisation

```typescript
import { useBiometricAuth } from '@/hooks/biometric-auth';

function MyComponent() {
  const {
    isSupported,
    isEnrolled,
    isEnabled,
    authenticate,
    requireAuthForApiKeys,
    requireAuthForSettings,
    toggleBiometric,
    updateRequirements
  } = useBiometricAuth();

  // Authentifier l'utilisateur
  const handleAuth = async () => {
    const success = await authenticate('Veuillez vous authentifier');
    if (success) {
      // Accès autorisé
    }
  };
}
```

## Fonctionnalités

### État
- `isSupported` : Indique si l'appareil supporte la biométrie
- `isEnrolled` : Indique si l'utilisateur a configuré la biométrie
- `isEnabled` : Indique si la biométrie est activée dans l'app
- `isAuthenticated` : Indique si l'utilisateur est actuellement authentifié
- `settings` : Paramètres complets de biométrie

### Actions
- `authenticate()` : Authentification générale
- `requireAuthForApiKeys()` : Authentification pour accéder aux clés API
- `requireAuthForSettings()` : Authentification pour accéder aux paramètres
- `logout()` : Déconnexion et réinitialisation de l'authentification
- `toggleBiometric()` : Activer/désactiver la biométrie
- `updateRequirements()` : Mettre à jour les exigences d'authentification

## Configuration

Les paramètres par défaut peuvent être modifiés dans `constants.ts` :

```typescript
export const DEFAULT_SETTINGS: BiometricSettings = {
  enabled: true,
  requiredForApiKeys: true,
  requiredForSettings: false,
  requireForAccess: false,
  requireForSave: false,
  authValidityMinutes: 5,
};
``` 