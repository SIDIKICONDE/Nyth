# 📚 Documentation du Système d'Effets Audio

## Vue d'ensemble

Le système d'effets audio de Nyth fournit une architecture modulaire et performante pour le traitement audio en temps réel dans les applications React Native. Il est conçu pour offrir une intégration transparente avec JavaScript via JSI (JavaScript Interface) tout en maintenant des performances natives optimales.

## 🚀 Fonctionnalités principales

- **Traitement audio en temps réel** avec faible latence
- **Architecture modulaire** avec composants interchangeables
- **Intégration React Native** via TurboModule et JSI
- **Support multiplateforme** (iOS, Android)
- **Gestion automatique des ressources** et mémoire
- **Métriques de performance** en temps réel
- **Configuration flexible** par effet

## 📁 Structure du projet

```
effects/
├── components/           # Composants d'effets de base
│   ├── Compressor.hpp   # Effet compresseur
│   ├── Delay.hpp       # Effet delay/echo
│   ├── EffectBase.hpp  # Classe de base pour tous les effets
│   ├── EffectChain.hpp # Chaînage d'effets
│   └── constant/       # Constantes partagées
├── config/             # Configuration système
│   ├── EffectsConfig.h/cpp  # Configuration principale
│   └── EffectsLimits.h      # Limites et contraintes
├── jsi/               # Interface JavaScript
│   └── EffectsJSIConverter.h/cpp  # Conversion JSI
├── managers/          # Gestionnaires d'effets
│   ├── EffectManager.h/cpp    # Gestionnaire principal
│   ├── CompressorManager.h/cpp # Gestion spécialisé compresseur
│   └── DelayManager.h/cpp     # Gestion spécialisé delay
├── Docs/             # Documentation
└── NativeAudioEffectsModule.h/cpp  # Module TurboModule
```

## 🎛️ Effets disponibles

### 1. Compresseur (Compressor)

- **Contrôle dynamique** du niveau audio
- **Paramètres ajustables** : seuil, ratio, attack, release, makeup gain
- **Métriques temps réel** : réduction de gain, niveaux I/O
- **Optimisé** avec unrolling de boucle et prefetching

### 2. Delay/Echo

- **Effet d'écho** configurable
- **Paramètres** : délai, feedback, mix wet/dry
- **Support stéréo** avec gestion indépendante des canaux

## 📚 Documentation

### 📖 Guides principaux

- **[README.md](README.md)** - Vue d'ensemble et guide de démarrage
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture détaillée du système
- **[API_REFERENCE.md](API_REFERENCE.md)** - Référence complète de l'API
- **[EXAMPLES.md](EXAMPLES.md)** - Exemples d'utilisation pratiques
- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - Guide complet de développement

### 🏗️ Architecture et conception

- **Architecture en couches** : Séparation claire des responsabilités
- **Gestion automatique des ressources** : RAII et pools de mémoire
- **Interface JSI** : Communication optimisée React Native
- **Optimisations natives** : SIMD, unrolling, prefetching

### 🔧 Développement

- **Configuration** : Prérequis et installation
- **Compilation** : Builds CMake et scripts automatisés
- **Tests** : Tests unitaires, d'intégration et de performance
- **Debugging** : Outils et techniques de débogage
- **Performance** : Optimisations CPU et mémoire

## 🎯 Démarrage rapide

### Installation de base

```javascript
import { NativeAudioEffectsModule } from 'native-modules';

// Initialisation
const effectsModule = new NativeAudioEffectsModule();
await effectsModule.initialize();
```

### Premier effet

```javascript
// Création d'un compresseur
const compressorId = await effectsModule.createEffect({
  type: 'compressor',
  parameters: {
    thresholdDb: -10.0,
    ratio: 4.0,
    attackMs: 10.0,
    releaseMs: 100.0,
  },
});

// Traitement audio
const inputBuffer = [0.1, 0.2, 0.3, 0.4];
const processedBuffer = await effectsModule.processAudio(inputBuffer, 1);
```

## 🔄 Évolution et contribution

Le système est conçu pour être **extensible** et **maintenable** :

- **Nouveaux effets** : Implémenter `IAudioEffect`
- **Nouvelles plateformes** : Support via compilation conditionnelle
- **Optimisations** : Améliorations continues des performances
- **Tests** : Coverage complet et validation continue

## 📊 Performance

### Métriques cibles

- **Latence** : < 2ms pour une chaîne d'effets
- **CPU** : < 5% sur appareils mobiles modernes
- **Mémoire** : < 10MB pour 10 effets actifs

### Optimisations implémentées

- Unrolling de boucle pour réduire les overheads
- Prefetching des données audio
- Gestion mémoire optimisée avec pools
- Calculs vectorisés où possible

## 🤝 Support

### Ressources

- [Exemples complets](EXAMPLES.md) - Cas d'utilisation courants
- [Guide de développement](DEVELOPMENT_GUIDE.md) - Contribution et debugging
- [Référence API](API_REFERENCE.md) - Documentation technique complète

### Problèmes courants

- [Guide de dépannage](DEVELOPMENT_GUIDE.md#🐛-debugging-et-troubleshooting)
- [FAQ et bonnes pratiques](DEVELOPMENT_GUIDE.md#🔒-sécurité-et-bonnes-pratiques)

---

**Version** : 1.0.0
**Dernière mise à jour** : 2024
**License** : MIT
