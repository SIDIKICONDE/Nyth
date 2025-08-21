This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

## 🚀 C++20 Configuration

Ce projet utilise **C++20** pour le traitement audio avec les fonctionnalités modernes suivantes :

### ✅ Fonctionnalités C++20 activées
- **Concepts** : Contraintes de type pour la sécurité
- **std::span** : Gestion sécurisée des buffers audio
- **std::format** : Formatage type-safe des messages
- **std::source_location** : Debug amélioré avec informations de source
- **consteval** : Calculs à la compilation pour les constantes audio
- **std::ranges** : Programmation fonctionnelle pour le traitement audio

### 🛠️ Configuration automatique
- **CMakeLists.txt** : Configuration globale C++20
- **cmake/toolchain.cmake** : Toolchain C++20 multi-plateforme
- **ios/CMakeLists.txt** : Configuration iOS spécifique
- **android/CMakeLists.txt** : Configuration Android NDK spécifique

### 🔍 Vérification de la configuration
```bash
# Exécuter le script de vérification
./scripts/verify_cpp20_config.sh

# Ou manuellement avec CMake
cmake -DCMAKE_TOOLCHAIN_FILE=cmake/toolchain.cmake .
```

### 📋 Prérequis
- **CMake 3.18+**
- **Android NDK r23+** (pour C++20 complet)
- **Xcode 14+** (pour iOS/macOS)
- **Visual Studio 2019+** (pour Windows)

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

## 🧹 Cache Cleaning

If you encounter build issues, cache problems, or dependency conflicts, you can clean the project cache:

### Quick Clean (Recommended first step)
```sh
npm run clean:quick
```

### Full Clean (Removes all dependencies and reinstalls)
```sh
npm run clean
```

### Platform-specific cleaning
```sh
# iOS only
npm run clean:ios

# Android only
npm run clean:android

# Metro only
npm run clean:metro
```

For more detailed information about cache cleaning, see [CACHE_CLEANING.md](docs/CACHE_CLEANING.md).

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
