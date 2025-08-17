# 🚀 Générateur d'Icônes NYTH

Ce script génère automatiquement toutes les icônes nécessaires pour votre application mobile NYTH dans les bonnes tailles et formats pour iOS, Android et Web.

## 📋 Prérequis

- **Node.js** (version 14 ou supérieure)
- **npm** (inclus avec Node.js)

### Vérifier l'installation
```bash
node --version  # Doit afficher v14.0.0 ou plus
npm --version   # Doit afficher une version
```

## 🛠️ Installation

### 1. Créer le dossier du projet
```bash
mkdir nyth-icons
cd nyth-icons
```

### 2. Créer les fichiers
Copiez les fichiers `generateIcons.js` et `package.json` dans ce dossier.

### 3. Installer les dépendances
```bash
npm install
```

## ▶️ Utilisation

### Génération simple
```bash
npm run generate
```

### Ou directement avec Node.js
```bash
node generateIcons.js
```

### Commandes disponibles
```bash
# Générer toutes les icônes
npm run generate

# Nettoyer et regénérer
npm run build

# Supprimer les icônes existantes
npm run clean
```

## 📁 Structure générée

Après exécution, vous obtiendrez cette structure :

```
icons/
├── ios/
│   └── AppIcon.appiconset/
│       ├── Icon-App-20x20@1x.png
│       ├── Icon-App-20x20@2x.png
│       ├── Icon-App-20x20@3x.png
│       ├── Icon-App-29x29@1x.png
│       ├── Icon-App-29x29@2x.png
│       ├── Icon-App-29x29@3x.png
│       ├── Icon-App-40x40@1x.png
│       ├── Icon-App-40x40@2x.png
│       ├── Icon-App-40x40@3x.png
│       ├── Icon-App-60x60@2x.png
│       ├── Icon-App-60x60@3x.png
│       ├── Icon-App-76x76@1x.png
│       ├── Icon-App-76x76@2x.png
│       ├── Icon-App-83.5x83.5@2x.png
│       ├── Icon-App-1024x1024@1x.png
│       └── Contents.json
├── android/
│   ├── drawable-mdpi/
│   │   ├── ic_launcher.png (48x48)
│   │   └── ic_launcher_round.png (48x48)
│   ├── drawable-hdpi/
│   │   ├── ic_launcher.png (72x72)
│   │   └── ic_launcher_round.png (72x72)
│   ├── drawable-xhdpi/
│   │   ├── ic_launcher.png (96x96)
│   │   └── ic_launcher_round.png (96x96)
│   ├── drawable-xxhdpi/
│   │   ├── ic_launcher.png (144x144)
│   │   └── ic_launcher_round.png (144x144)
│   ├── drawable-xxxhdpi/
│   │   ├── ic_launcher.png (192x192)
│   │   └── ic_launcher_round.png (192x192)
│   ├── drawable/
│   │   └── ic_launcher.xml
│   └── values/
│       └── colors.xml
├── web/
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon-96x96.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   └── manifest.json
└── README.md
```

## 📱 Intégration dans vos projets

### iOS (Xcode)
1. Ouvrez votre projet Xcode
2. Sélectionnez votre target dans le navigateur
3. Allez dans l'onglet "General"
4. Dans la section "App Icons and Launch Images"
5. Glissez-déposez le dossier `AppIcon.appiconset` complet

### Android (Android Studio)
1. Ouvrez votre projet Android Studio
2. Naviguez vers `app/src/main/res/`
3. Copiez tous les dossiers `drawable-*` dans le dossier `res/`
4. Copiez le fichier `drawable/ic_launcher.xml` dans `res/drawable/`
5. Ajoutez le contenu de `values/colors.xml` dans votre fichier colors existant

### React Native
```bash
# iOS
cp -r icons/ios/AppIcon.appiconset ios/YourApp/Images.xcassets/

# Android
cp -r icons/android/drawable-* android/app/src/main/res/
cp icons/android/drawable/ic_launcher.xml android/app/src/main/res/drawable/
```

### Flutter
```bash
# Remplacer les icônes existantes
cp -r icons/android/drawable-* android/app/src/main/res/
cp icons/ios/AppIcon.appiconset/* ios/Runner/Assets.xcassets/AppIcon.appiconset/
```

## 🎨 Personnalisation

Pour modifier les couleurs ou le design, éditez les constantes SVG dans `generateIcons.js` :

```javascript
// Changer les couleurs du dégradé
<stop offset="0%" style="stop-color:#VotreCouleur1;stop-opacity:1" />
<stop offset="100%" style="stop-color:#VotreCouleur2;stop-opacity:1" />
```

## 🔧 Dépannage

### Erreur "sharp not found"
```bash
npm install sharp --save
```

### Erreur de permissions
```bash
sudo npm install  # Sur macOS/Linux
```

### Node.js trop ancien
Téléchargez la dernière version LTS sur [nodejs.org](https://nodejs.org)

## 📊 Spécifications techniques

- **Format de sortie** : PNG haute qualité
- **Couleurs** : 
  - Primaire : #4A90E2
  - Secondaire : #357ABD
- **Optimisations** : 
  - Compression PNG sans perte
  - Coins arrondis selon les standards iOS
  - Support des icônes adaptatives Android

## 🚀 Automatisation CI/CD

Pour intégrer dans votre pipeline :

```yaml
# GitHub Actions exemple
- name: Generate Icons
  run: |
    npm install
    npm run generate
    cp -r icons/ios/AppIcon.appiconset ios/
    cp -r icons/android/drawable-* android/app/src/main/res/
```

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que Node.js est installé et à jour
2. Vérifiez que les dépendances sont installées (`npm install`)
3. Consultez les logs d'erreur pour plus de détails

---

**Générateur créé pour NYTH** - Version 1.0.0