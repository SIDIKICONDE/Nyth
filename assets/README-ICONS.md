# 🎨 Guide des Icônes CamPrompt AI

## 📱 Icône Splash Moderne - Style iOS

Cette documentation explique comment utiliser la nouvelle icône splash moderne créée pour CamPrompt AI.

## 🎯 Design

L'icône splash utilise le thème **Aurora Dark** de votre application avec :

- **Gradient principal** : Aurora (#8b5cf6 → #a855f7 → #f472b6)
- **Fond sombre** : Dégradé radial (#1a1a2e → #0f0f23)
- **Style iOS** : Coins arrondis (180px de rayon)
- **Éléments** :
  - Caméra stylisée avec objectif détaillé
  - Réseau neural IA avec connexions animées
  - Particules flottantes animées
  - Typographie SF Pro Display
  - Effets de lumière et d'ombre

## 📁 Fichiers Générés

### Fichier Source

- `splash-icon.svg` - Icône vectorielle source (1024x1024)

### Icônes Principales

- `icon.png` - Icône principale de l'app (1024x1024)
- `splash.png` - Écran de démarrage (1024x1024)
- `adaptive-icon.png` - Icône adaptative Android (1024x1024)
- `favicon.png` - Favicon web (32x32)

### Icônes iOS (dans `/ios-icons/`)

- `icon-20.png` à `icon-1024.png` - Toutes les tailles iOS requises

### Icônes Android (dans `/android-icons/`)

- `icon-36.png` à `icon-512.png` - Toutes les tailles Android requises

### Icônes Spéciales

- `splash-white-bg.png` - Version avec fond blanc pour le splash
- `adaptive-icon-transparent.png` - Version transparente pour Android

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install sharp
```

### 2. Générer les icônes

```bash
node scripts/generate-app-icons.js
```

### 3. Configuration React Native (optionnel)

Les icônes générées sont automatiquement utilisées par React Native. Vous pouvez également les configurer dans les fichiers natifs iOS/Android si nécessaire.

## 🎨 Personnalisation

### Modifier les Couleurs

Éditez le fichier `splash-icon.svg` et modifiez les gradients :

```svg
<!-- Gradient principal -->
<linearGradient id="auroraGradient">
  <stop offset="0%" style="stop-color:#VOTRE_COULEUR_1"/>
  <stop offset="50%" style="stop-color:#VOTRE_COULEUR_2"/>
  <stop offset="100%" style="stop-color:#VOTRE_COULEUR_3"/>
</linearGradient>

<!-- Gradient de fond -->
<radialGradient id="backgroundGradient">
  <stop offset="0%" style="stop-color:#VOTRE_FOND_1"/>
  <stop offset="100%" style="stop-color:#VOTRE_FOND_2"/>
</radialGradient>
```

### Modifier le Texte

Changez le texte dans la section correspondante :

```svg
<text>Votre Texte</text>
```

### Regénérer après Modifications

```bash
node scripts/generate-app-icons.js
```

## 📱 Aperçu des Tailles

| Plateforme    | Tailles Générées                             |
| ------------- | -------------------------------------------- |
| **iOS**       | 20, 29, 40, 58, 60, 80, 87, 120, 180, 1024px |
| **Android**   | 36, 48, 72, 96, 144, 192, 512px              |
| **Web**       | 32px (favicon)                               |
| **App Store** | 1024px                                       |

## 🎯 Caractéristiques Techniques

- **Format** : PNG haute qualité (100%, compression 0)
- **Transparence** : Supportée pour les versions appropriées
- **Animations** : Incluses dans le SVG (particules flottantes)
- **Compatibilité** : iOS 13+, Android 5.0+, Web moderne

## ✨ Fonctionnalités Avancées

### Animations SVG

- Particules flottantes avec opacité animée
- Durées variables (2s à 3.5s)
- Répétition infinie

### Effets Visuels

- Ombres portées avec blur
- Effets de brillance (glow)
- Dégradés radiaux et linéaires
- Reflets réalistes sur l'objectif

### Responsive Design

- Adaptable à toutes les tailles
- Maintient les proportions
- Lisibilité optimale sur petites tailles

## 🔧 Dépannage

### Erreur "sharp not found"

```bash
npm install sharp --save-dev
```

### Qualité d'image faible

Vérifiez que les paramètres PNG sont :

```javascript
.png({ quality: 100, compressionLevel: 0 })
```

### Icônes floues sur iOS

Assurez-vous d'utiliser les tailles exactes requises par Apple.

## 📞 Support

Pour toute question ou personnalisation, consultez :

- Guidelines iOS : https://developer.apple.com/design/human-interface-guidelines/app-icons
- Guidelines Android : https://developer.android.com/guide/practices/ui_guidelines/icon_design

---

_Créé avec ❤️ pour CamPrompt AI - L'avenir de la création vidéo intelligente_
