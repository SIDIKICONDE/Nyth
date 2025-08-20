# EditProfileScreen

Module pour l'édition du profil utilisateur avec une architecture modulaire et réutilisable.

## Structure

```
EditProfileScreen/
├── components/          # Composants de sections du formulaire
│   ├── PersonalSection.tsx      # Section informations personnelles
│   ├── ProfessionalSection.tsx  # Section informations professionnelles
│   ├── SocialSection.tsx        # Section réseaux sociaux
│   └── index.ts                 # Export des composants
├── hooks/              # Hooks personnalisés
│   └── useEditProfile.ts        # Logique du formulaire et gestion d'état
├── constants.ts        # Constantes (champs sociaux, etc.)
├── types.ts           # Types TypeScript
├── utils.ts           # Fonctions utilitaires
├── EditProfileScreen.tsx # Composant principal
├── index.ts           # Point d'entrée du module
└── README.md          # Documentation
```

## Composants

### EditProfileScreen
Composant principal qui orchestre l'affichage des différentes sections selon la route.

### PersonalSection
Gère les champs d'informations personnelles :
- Nom d'affichage
- Prénom et nom
- Bio
- Numéro de téléphone

### ProfessionalSection
Gère les champs d'informations professionnelles :
- Profession
- Entreprise
- Site web

### SocialSection
Gère les liens vers les réseaux sociaux avec validation et formatage automatique :
- Twitter
- LinkedIn
- GitHub
- YouTube
- Instagram

## Hooks

### useEditProfile
Hook principal qui gère :
- État du formulaire
- Chargement des données du profil
- Sauvegarde des modifications
- Gestion des erreurs
- Conversion des noms d'utilisateur en URLs

## Utilitaires

### extractUsername
Extrait le nom d'utilisateur d'une URL de réseau social.

### buildSocialUrl
Construit une URL complète à partir d'un nom d'utilisateur.

## Utilisation

```tsx
import EditProfileScreen from './screens/EditProfileScreen';

// Dans la navigation
<Stack.Screen 
  name="EditProfile" 
  component={EditProfileScreen}
  initialParams={{ section: 'personal' }} // 'personal' | 'professional' | 'social'
/>
```

## Types

Les types principaux sont définis dans `types.ts` et incluent :
- `EditProfileScreenNavigationProp`
- `EditProfileScreenRouteProp`
- `SocialField`

## Constantes

Les champs de réseaux sociaux sont définis dans `constants.ts` avec leur configuration :
- Nom du champ
- Icône
- Placeholder
- URL de base 