# Guide d'intégration du Widget iOS pour Nyth Planning

Ce guide vous explique comment intégrer le widget iOS natif pour le planning dans votre application Nyth.

## Prérequis

- Xcode 12.0 ou supérieur
- iOS 14.0 ou supérieur
- Un compte développeur Apple actif

## Étapes d'intégration

### 1. Ajouter une nouvelle cible Widget Extension dans Xcode

1. Ouvrez Nyth.xcworkspace dans Xcode
2. File > New > Target > Widget Extension
3. Nommez-le 'PlanningWidget'
4. Cochez 'Include Configuration Intent'

### 2. Configurer l'App Group

Pour permettre le partage de données entre l'app et le widget :

- Dans les Capabilities de l'app principale ET du widget
- Ajoutez App Groups
- Créez le groupe : group.com.nyth.planning

### 3. Copier les fichiers du widget

Les fichiers sont déjà créés dans /ios/PlanningWidget/

### 4. Configurer les URL Schemes

Ajoutez dans Info.plist de l'app principale pour supporter les deep links du widget.

### 5. Utilisation dans React Native

Le hook useWidgetSync gère automatiquement la synchronisation et les actions du widget.

## Actions supportées

- Ajout rapide d'événements, tâches et objectifs
- Marquer comme complété
- Incrémenter/décrémenter les objectifs

Le widget s'adapte automatiquement au mode clair/sombre du système.
