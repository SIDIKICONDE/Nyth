# 🌐 Système d'Internationalisation (i18n) Refactorisé

Ce dossier contient le système d'internationalisation modulaire et organisé de l'application.

## 📁 Structure des Fichiers

```
src/locales/
├── i18n.ts                    # Point d'entrée principal
├── index.ts                   # Exports centralisés
├── languageDetector.ts        # Détecteur de langue personnalisé
├── translationImports.ts      # Gestionnaire d'imports des traductions
├── resourcesBuilder.ts        # Constructeur de ressources
├── i18nConfig.ts             # Configuration i18next
├── languageConfig.ts         # Configuration des langues
├── README.md                 # Cette documentation
├── [langue]/                 # Dossiers des traductions par langue
│   ├── translation.json      # Fichier principal (langues non divisées)
│   ├── common.json          # Traductions communes (langues divisées)
│   ├── auth.json            # Traductions d'authentification
│   ├── chat.json            # Traductions du chat
│   └── ...                  # Autres sections
└── scripts/                  # Scripts de division des traductions
```

## 🔧 Architecture Modulaire

### 1. **i18n.ts** - Point d'Entrée Principal

- Initialise i18next avec tous les modules
- Exporte l'instance i18next configurée
- Gère l'initialisation asynchrone

### 2. **languageDetector.ts** - Détection de Langue

- Détecte automatiquement la langue de l'appareil
- Gère les préférences utilisateur sauvegardées
- Fallback vers l'anglais en cas d'erreur

### 3. **translationImports.ts** - Gestionnaire d'Imports

- Centralise tous les imports des fichiers JSON
- Organise les traductions par langue
- Gère les langues divisées et non divisées

### 4. **resourcesBuilder.ts** - Constructeur de Ressources

- Fusionne les fichiers divisés en ressources complètes
- Fournit des utilitaires pour analyser les ressources
- Gère les statistiques des traductions

### 5. **i18nConfig.ts** - Configuration i18next

- Configuration principale d'i18next
- Configurations spécifiques par environnement
- Gestion des clés manquantes

### 6. **languageConfig.ts** - Configuration des Langues

- Liste des langues supportées
- Informations sur chaque langue (nom, drapeau, RTL)
- Utilitaires de validation des langues

## 🚀 Utilisation

### Import Simple

```typescript
import i18n from "@/locales/i18n";
// ou
import { i18n } from "@/locales";
```

### Utilisation avec React

```typescript
import { useTranslation } from "react-i18next";

const MyComponent = () => {
  const { t } = useTranslation();

  return <Text>{t("common.welcome")}</Text>;
};
```

### Accès aux Utilitaires

```typescript
import {
  languages,
  getResourcesStats,
  isLanguageDivided,
  getLanguageInfo,
} from "@/locales";

// Obtenir les statistiques
const stats = getResourcesStats();

// Vérifier si une langue est divisée
const isDivided = isLanguageDivided("fr");

// Obtenir les informations d'une langue
const langInfo = getLanguageInfo("fr");
```

## 📊 Langues Supportées

### Langues Divisées (Fichiers Multiples)

- 🇬🇧 **Anglais (en)** - 20 fichiers
- 🇫🇷 **Français (fr)** - 21 fichiers

## 🔄 Workflow de Développement

### 1. Ajouter une Nouvelle Traduction

```typescript
// Dans le fichier JSON approprié
{
  "newKey": "Nouvelle traduction"
}
```

### 2. Ajouter une Nouvelle Langue

1. Créer le dossier `src/locales/[code]/`
2. Ajouter les fichiers JSON modulaires
3. Mettre à jour `languageConfig.ts`
4. Mettre à jour `translationImports.ts`
5. Mettre à jour `resourcesBuilder.ts`

## 🎯 Avantages de cette Architecture

### ✅ **Modularité**

- Chaque module a une responsabilité spécifique
- Facile à maintenir et à tester
- Imports sélectifs possibles

### ✅ **Extensibilité**

- Ajout facile de nouvelles langues
- Support des langues RTL
- Configuration par environnement

### ✅ **Performance**

- Imports optimisés
- Chargement sélectif possible
- Cache efficace

### ✅ **Maintenabilité**

- Code organisé et documenté
- Séparation des préoccupations
- Types TypeScript complets

## 🔧 Configuration Avancée

### Variables d'Environnement

```typescript
// En développement
__DEV__ = true; // Active les logs détaillés

// En production
__DEV__ = false; // Désactive les logs
```

### Personnalisation de la Configuration

```typescript
import { getEnvironmentConfig } from "@/locales/i18nConfig";

const customConfig = {
  ...getEnvironmentConfig(),
  // Vos personnalisations
};
```

## 🐛 Dépannage

### Problèmes Courants

1. **Clés manquantes** : Vérifiez les logs de la console
2. **Langue non détectée** : Vérifiez `languageDetector.ts`
3. **Imports manquants** : Exécutez `node scripts/update-i18n.js`
4. **Erreurs TypeScript** : Vérifiez les types dans `translationImports.ts`

### Logs de Debug

```typescript
// Activer les logs détaillés
const config = {
  ...getEnvironmentConfig(),
  debug: true,
};
```

## 📝 Bonnes Pratiques

1. **Nommage des clés** : Utilisez des noms descriptifs et hiérarchiques
2. **Organisation** : Groupez les traductions par fonctionnalité
3. **Cohérence** : Utilisez le même format pour toutes les langues
4. **Tests** : Testez les traductions dans différentes langues
5. **Documentation** : Documentez les clés complexes

## 🚀 Prochaines Améliorations

- [ ] Chargement lazy des traductions
- [ ] Cache intelligent des ressources
- [ ] Interface d'administration des traductions
- [ ] Validation automatique des clés
- [ ] Support des pluriels complexes
- [ ] Interpolation avancée
