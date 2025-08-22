# 🚀 Guide GitHub Flavored Markdown (GFM)

## Vue d'ensemble

Notre système supporte maintenant **GitHub Flavored Markdown (GFM)**, une extension du Markdown standard qui ajoute de nombreuses fonctionnalités spécialement conçues pour les développeurs et les plateformes de collaboration.

## 🆕 Nouvelles Fonctionnalités GFM

### 📊 Tableaux

Créez des tableaux avec une syntaxe simple :

```markdown
| Nom | Age | Ville |
|-----|-----|-------|
| Alice | 25 | Paris |
| Bob | 30 | Lyon |
```

**Rendu :**
| Nom | Age | Ville |
|-----|-----|-------|
| Alice | 25 | Paris |
| Bob | 30 | Lyon |

**Utilisation :**
```typescript
import { GFMFormatter } from './textFormatter';

const tableText = `| Nom | Age |
|-----|-----|
| Alice | 25 |`;

// Formatage simple (supprime les marqueurs)
const formatted = GFMFormatter.applyGFMFormatting(tableText);
// Résultat: "Nom | Age\nAlice | 25"

// Conversion HTML
const html = GFMFormatter.convertGFMToHtml(tableText);
// Résultat: "<table>...</table>"

// Extraction des données
const tables = GFMFormatter.extractTableData(tableText);
// Résultat: [{ headers: ['Nom', 'Age'], rows: [['Alice', '25']] }]
```

### ✅ Listes de tâches

Créez des listes interactives avec cases à cocher :

```markdown
- [x] Tâche terminée
- [ ] Tâche en cours
- [x] Autre tâche terminée
- [ ] Tâche à faire
```

**Utilisation :**
```typescript
const taskList = `- [x] Terminé
- [ ] À faire`;

const formatted = GFMFormatter.applyGFMFormatting(taskList);
// Résultat: "✅ Terminé\n☐ À faire"

const html = GFMFormatter.convertGFMToHtml(taskList);
// Résultat: '<input type="checkbox" checked disabled> Terminé<br>...'
```

### 😄 Emojis

Utilisez des emojis avec la syntaxe `:nom:` :

```markdown
Hello :smile: :heart: :rocket: world!
```

**Emojis supportés :**
- **Visages :** `:smile:` 😄, `:heart_eyes:` 😍, `:wink:` 😉, `:joy:` 😂
- **Cœurs :** `:heart:` ❤️, `:yellow_heart:` 💛, `:green_heart:` 💚
- **Symboles :** `:fire:` 🔥, `:rocket:` 🚀, `:star:` ⭐, `:sparkles:` ✨
- **Tech :** `:computer:` 💻, `:phone:` 📱, `:gear:` ⚙️, `:wrench:` 🔧
- **Actions :** `:thumbsup:` 👍, `:clap:` 👏, `:muscle:` 💪, `:pray:` 🙏
- **Status :** `:heavy_check_mark:` ✅, `:x:` ❌, `:warning:` ⚠️

**Plus de 200 emojis supportés !**

### 👤 Mentions

Mentionnez des utilisateurs avec `@username` :

```markdown
Hello @john_doe, can you review this?
CC @alice @bob
```

**Utilisation :**
```typescript
const text = 'Hello @developer';

// Formatage simple
const formatted = GFMFormatter.applyGFMFormatting(text);
// Résultat: "Hello developer"

// Avec URL de base
const formatted2 = GFMFormatter.applyGFMFormatting(text, {
  mentionBaseUrl: 'https://github.com'
});
// Résultat: "Hello https://github.com/developer"

// HTML avec liens
const html = GFMFormatter.convertGFMToHtml(text, {
  mentionBaseUrl: 'https://github.com'
});
// Résultat: 'Hello <a href="https://github.com/developer">@developer</a>'
```

### 🔗 Références d'issues

Référencez des issues avec `#123` :

```markdown
Fix #123 and close #456
Related to #789
```

**Utilisation :**
```typescript
const text = 'Fix #123';

// Avec URL de base
const html = GFMFormatter.convertGFMToHtml(text, {
  issueBaseUrl: 'https://github.com/user/repo'
});
// Résultat: 'Fix <a href="https://github.com/user/repo/issues/123">#123</a>'
```

### 🌐 Liens automatiques

Les URLs et emails sont automatiquement détectés :

```markdown
Voir https://example.com
Contact: user@example.com
```

**Utilisation :**
```typescript
const text = 'Site: https://example.com Email: test@example.com';

const html = GFMFormatter.convertGFMToHtml(text);
// Résultat: 'Site: <a href="https://example.com">https://example.com</a> Email: <a href="mailto:test@example.com">test@example.com</a>'
```

### 🔤 Échappements avancés

Échappez les caractères spéciaux avec `\` :

```markdown
Texte avec \* \# \@ \:emoji\: échappés
```

## 📱 Rendu React Native

Le `GFMReactFormatter` rend les éléments GFM en composants React Native :

```tsx
import React from 'react';
import { ScrollView } from 'react-native';
import { GFMReactFormatter } from './textFormatter';

const GFMDocument = ({ content }) => {
  return (
    <ScrollView>
      {GFMReactFormatter.processGFMText(content, {
        baseStyle: { fontSize: 16, color: '#333' },
        onMentionPress: (username) => console.log('Mention:', username),
        onIssuePress: (issue) => console.log('Issue:', issue),
        onLinkPress: (url) => console.log('Link:', url),
        onTaskToggle: (index, completed) => console.log('Task:', index, completed)
      })}
    </ScrollView>
  );
};

// Exemple d'utilisation
const content = `
# Mon Projet :rocket:

## Tâches
- [x] Setup initial ✅
- [ ] Tests unitaires
- [ ] Documentation

## Équipe
- @alice : Lead dev
- @bob : Designer

## Issues
Voir #123 et #456

## Contact
Email: team@example.com
Site: https://example.com

| Feature | Status | Assigné |
|---------|--------|---------|
| Auth | ✅ Done | @alice |
| UI | 🔄 Progress | @bob |
`;

<GFMDocument content={content} />
```

## 🔧 API Complète

### GFMFormatter

```typescript
// Formatage principal
GFMFormatter.applyGFMFormatting(text, options?)
GFMFormatter.convertGFMToHtml(text, options?)
GFMFormatter.stripAllGFM(text)

// Analyse
GFMFormatter.getGFMStats(text)
GFMFormatter.hasGFMFeatures(text)
GFMFormatter.extractTableData(text)
```

### Options GFM

```typescript
interface GFMOptions extends MarkdownOptions {
  // Fonctionnalités GFM
  convertTables?: boolean;
  convertTaskLists?: boolean;
  convertAutolinks?: boolean;
  convertMentions?: boolean;
  convertIssueReferences?: boolean;
  convertEmojis?: boolean;
  convertEscapes?: boolean;
  
  // URLs de base
  baseUrl?: string;
  mentionBaseUrl?: string;
  issueBaseUrl?: string;
  
  // Hérite des options Markdown standard
  convertBold?: boolean;
  convertItalic?: boolean;
  convertStrikethrough?: boolean;
  convertCode?: boolean;
  convertCodeBlocks?: boolean;
  convertHeaders?: boolean;
  convertQuotes?: boolean;
  convertLists?: boolean;
  convertNumberedLists?: boolean;
  convertHighlight?: boolean;
}
```

### GFMReactFormatter

```typescript
// Rendu React
GFMReactFormatter.processGFMText(text, options?)
GFMReactFormatter.processGFMParagraph(paragraph, options?)

// Options React
interface GFMReactOptions extends GFMOptions {
  baseStyle?: StyleProp<TextStyle>;
  tableStyle?: StyleProp<any>;
  taskListStyle?: StyleProp<TextStyle>;
  mentionStyle?: StyleProp<TextStyle>;
  issueStyle?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
  emojiStyle?: StyleProp<TextStyle>;
  
  // Callbacks
  onMentionPress?: (username: string) => void;
  onIssuePress?: (issueNumber: string) => void;
  onLinkPress?: (url: string) => void;
  onTaskToggle?: (taskIndex: number, completed: boolean) => void;
}
```

## 📊 Statistiques GFM

```typescript
const stats = GFMFormatter.getGFMStats(text);

// Résultat:
{
  tables: number,
  taskLists: {
    completed: number,
    uncompleted: number,
    total: number
  },
  mentions: number,
  issueReferences: number,
  autolinks: {
    urls: number,
    emails: number
  },
  emojis: number,
  escapes: number
}
```

## 🎯 Cas d'Usage

### 1. Documentation technique

```typescript
const doc = `
# API Documentation :books:

## Authentication
Contact @auth-team for access.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/users | List users |
| POST | /api/users | Create user |

## Issues
- [x] Fix #123: Auth bug
- [ ] Implement #456: New feature

## Links
- API: https://api.example.com
- Support: support@example.com
`;

const formatted = GFMFormatter.applyGFMFormatting(doc);
```

### 2. Notes de projet

```typescript
const notes = `
# Sprint Review :rocket:

## Completed :heavy_check_mark:
- [x] User authentication @alice
- [x] Database setup @bob
- [x] UI components @charlie

## In Progress :construction:
- [ ] API integration #789
- [ ] Testing suite #790

## Blockers :warning:
See issues #791 and #792

Contact @project-manager for details.
`;

const html = GFMFormatter.convertGFMToHtml(notes, {
  mentionBaseUrl: 'https://github.com',
  issueBaseUrl: 'https://github.com/company/project'
});
```

### 3. README interactif

```tsx
const ReadmeViewer = ({ content }) => (
  <ScrollView style={styles.container}>
    {GFMReactFormatter.processGFMText(content, {
      baseStyle: styles.text,
      onMentionPress: (user) => navigateToProfile(user),
      onIssuePress: (issue) => navigateToIssue(issue),
      onLinkPress: (url) => Linking.openURL(url),
      onTaskToggle: (index, completed) => updateTask(index, completed)
    })}
  </ScrollView>
);
```

## 🚀 Performance

- **Optimisé** pour de gros documents (testés jusqu'à 50+ sections)
- **Regex efficaces** pour chaque fonctionnalité
- **Ordre de traitement** optimisé pour éviter les conflits
- **Support des emails** sans confusion avec les mentions
- **Échappements robustes** pour tous les caractères spéciaux

## 🔄 Migration

### Depuis Markdown standard

```typescript
// Avant
const result = MarkdownFormatter.autoFormatText(text);

// Maintenant (rétrocompatible)
const result = GFMFormatter.applyGFMFormatting(text);

// Ou via l'API unifiée
const result = TextFormatter.applyGFMFormatting(text);
```

### Nouvelles fonctionnalités

```typescript
// Détection GFM
if (GFMFormatter.hasGFMFeatures(text)) {
  // Traiter avec GFM
  const formatted = GFMFormatter.applyGFMFormatting(text);
} else {
  // Traiter avec Markdown standard
  const formatted = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(text);
}
```

## 📚 Exemples Complets

### Document technique complet

```markdown
# Nyth Project :rocket:

## Overview
Nyth is a **React Native** application for :microphone: teleprompter functionality.

## Team
- @alice-dev: Lead Developer
- @bob-design: UI/UX Designer  
- @charlie-qa: Quality Assurance

## Current Sprint :calendar:

### Completed :heavy_check_mark:
- [x] Setup project structure #001
- [x] Implement core audio features #002
- [x] Design main UI components #003

### In Progress :construction:
- [ ] Add text formatting #004
- [ ] Implement user settings #005
- [ ] Write documentation #006

### Blocked :warning:
- [ ] iOS build issues #007 (waiting for @alice-dev)
- [ ] Performance optimization #008 (needs @charlie-qa review)

## Architecture

| Component | Technology | Status | Owner |
|-----------|------------|--------|-------|
| Frontend | React Native | ✅ Ready | @alice-dev |
| Backend | Node.js | 🔄 Progress | @alice-dev |
| Database | SQLite | ✅ Ready | @bob-design |
| Testing | Jest | 🔄 Progress | @charlie-qa |

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the app: `npm start`

## Links
- Repository: https://github.com/company/nyth
- Documentation: https://docs.nyth.app
- Support: support@nyth.app

## Code Example

```javascript
// Example teleprompter function
function startTeleprompter(text, speed = 1) {
  console.log("Starting teleprompter...");
  return new TeleprompterEngine(text, speed);
}
```

## Issues & Support

For bugs and feature requests, please create an issue:
- Bug reports: Use template #BUG
- Feature requests: Use template #FEATURE

Contact @alice-dev for urgent issues.

---

**Note:** This project uses :heart: and is maintained by an awesome team! :clap:
```

Ce document utilise toutes les fonctionnalités GFM et sera parfaitement rendu par notre système !

## 🎉 Conclusion

Avec GitHub Flavored Markdown, vous pouvez maintenant créer des documents riches et interactifs qui incluent :

- 📊 **Tableaux structurés**
- ✅ **Listes de tâches interactives**  
- 😄 **Plus de 200 emojis**
- 👤 **Mentions d'utilisateurs**
- 🔗 **Références d'issues**
- 🌐 **Liens automatiques**
- 🔤 **Échappements avancés**

Tout cela avec une **API cohérente**, des **performances optimisées**, et un **support React Native complet** !
