# 📝 Exemples d'utilisation des formatters Markdown étendus

## ExtendedMarkdownFormatter

Le `ExtendedMarkdownFormatter` supporte tous les éléments Markdown standards :

### Formatage de base

```typescript
import { ExtendedMarkdownFormatter } from './textFormatter';

// Titres
const titre = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('# Mon Titre');
// Résultat: "Mon Titre"

// Gras et italique
const texte = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('**gras** et *italique*');
// Résultat: "gras et italique"

// Texte barré
const barre = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('~~barré~~');
// Résultat: "barré"

// Code inline et blocs
const code = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('`code inline`');
// Résultat: "code inline"

const blocCode = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(`
\`\`\`javascript
function hello() {
  console.log("Hello");
}
\`\`\`
`);
// Résultat: "javascript\nfunction hello() {\n  console.log(\"Hello\");\n}"
```

### Citations et listes

```typescript
// Citations
const citation = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('> Ceci est une citation');
// Résultat: "Ceci est une citation"

// Listes à puces
const liste = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(`
- Premier élément
- Deuxième élément
* Troisième élément
+ Quatrième élément
`);
// Résultat: "• Premier élément\n• Deuxième élément\n• Troisième élément\n• Quatrième élément"

// Listes numérotées
const listeNum = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(`
1. Premier
2. Deuxième
10. Dixième
`);
// Résultat: "• Premier\n• Deuxième\n• Dixième"
```

### Formatage avec options

```typescript
// Désactiver certains formatages
const textePartiel = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(
  '**gras** *italique* `code`',
  { 
    convertBold: false,  // Garder les ** 
    convertCode: false   // Garder les `
  }
);
// Résultat: "*gras italique* `code`"
```

### Détection automatique

```typescript
// Détection et formatage automatique
const texteAuto = ExtendedMarkdownFormatter.autoFormatExtendedText('**Important:** Voir `README.md`');
// Résultat: "Important: Voir README.md"

// Vérification de la présence de Markdown
const hasMarkdown = ExtendedMarkdownFormatter.hasExtendedMarkdown('**gras**');
// Résultat: true
```

### Conversion HTML

```typescript
// Convertir en HTML
const html = ExtendedMarkdownFormatter.convertToHtml('**gras** *italique* `code`');
// Résultat: "<strong>gras</strong> <em>italique</em> <code>code</code>"
```

### Statistiques

```typescript
// Obtenir des statistiques détaillées
const stats = ExtendedMarkdownFormatter.getMarkdownStats(`
# Titre
**gras** *italique* ~~barré~~ \`code\`
> citation
- liste
1. numérotée
`);

console.log(stats);
// Résultat: {
//   headings: { h1: 1, h2: 0, h3: 0 },
//   bold: 1,
//   italic: 1,
//   strikethrough: 1,
//   inlineCode: 1,
//   quotes: 1,
//   bulletLists: 1,
//   numberedLists: 1,
//   total: 8
// }
```

### Nettoyage de texte

```typescript
// Supprimer tout le formatage
const texteClean = ExtendedMarkdownFormatter.stripAllMarkdown('# Titre **gras** *italique*');
// Résultat: "Titre gras italique"
```

## ExtendedReactFormatter

Le `ExtendedReactFormatter` rend les éléments Markdown en composants React Native :

### Utilisation de base

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { ExtendedReactFormatter } from './textFormatter';

const MonComposant = () => {
  const texteMarkdown = "# Titre\n**Gras** et *italique* avec `code`";
  
  return (
    <View>
      {ExtendedReactFormatter.processExtendedText(texteMarkdown, {
        baseStyle: { fontSize: 16, color: '#333' }
      })}
    </View>
  );
};
```

### Styles personnalisés

```tsx
const texteAvecStyles = ExtendedReactFormatter.processExtendedText(
  "# Mon Titre\n**Important:** Voir `README.md`",
  {
    baseStyle: { fontSize: 16, color: '#333' },
    headingStyles: {
      h1: { fontSize: 24, fontWeight: 'bold', color: '#000' },
      h2: { fontSize: 20, fontWeight: 'bold', color: '#333' }
    },
    codeStyle: { 
      fontFamily: 'Courier', 
      backgroundColor: '#f0f0f0' 
    },
    quoteStyle: { 
      fontStyle: 'italic', 
      color: '#666' 
    }
  }
);
```

### Rendu par paragraphe

```tsx
const paragraphe = ExtendedReactFormatter.processExtendedParagraph(
  "> Ceci est une citation importante",
  {
    baseStyle: { fontSize: 16 },
    quoteStyle: { backgroundColor: '#f9f9f9', padding: 10 }
  }
);
```

## Intégration avec l'API unifiée

```typescript
import { TextFormatter } from './textFormatter';

// Toutes les nouvelles fonctions sont disponibles via TextFormatter
const texte = TextFormatter.applyExtendedMarkdownFormatting('**gras**');
const stats = TextFormatter.getMarkdownStats('# Titre');
const html = TextFormatter.convertToHtml('*italique*');

// Compatibilité avec l'ancienne API
const texteAncien = TextFormatter.autoFormatText('**gras**'); // Utilise MarkdownFormatter
const texteNouveau = TextFormatter.autoFormatExtendedText('**gras**'); // Utilise ExtendedMarkdownFormatter
```

## Cas d'usage courants

### Pour un éditeur de notes

```typescript
// Affichage propre pour l'utilisateur
const affichage = ExtendedMarkdownFormatter.stripAllMarkdown(noteUtilisateur);

// Vérification du formatage
const aFormatage = ExtendedMarkdownFormatter.hasExtendedMarkdown(noteUtilisateur);

// Statistiques pour l'utilisateur
const statsNote = ExtendedMarkdownFormatter.getMarkdownStats(noteUtilisateur);
console.log(`${statsNote.words} mots, ${statsNote.total} éléments formatés`);
```

### Pour un téléprompter

```typescript
// Nettoyage pour lecture
const texteLecture = ExtendedMarkdownFormatter.autoFormatExtendedText(script);

// Conversion en HTML pour web
const scriptWeb = ExtendedMarkdownFormatter.convertToHtml(script);
```

### Pour une application React Native

```tsx
const NoteViewer = ({ note }) => {
  return (
    <ScrollView style={styles.container}>
      {ExtendedReactFormatter.processExtendedText(note, {
        baseStyle: styles.baseText,
        headingStyles: {
          h1: styles.h1,
          h2: styles.h2,
          h3: styles.h3
        }
      })}
    </ScrollView>
  );
};
```

## Éléments supportés

✅ **Titres** : `# H1`, `## H2`, `### H3`  
✅ **Gras** : `**texte**` ou `__texte__`  
✅ **Italique** : `*texte*` ou `_texte_`  
✅ **Barré** : `~~texte~~`  
✅ **Code inline** : `` `code` ``  
✅ **Blocs de code** : ````code````  
✅ **Citations** : `> citation`  
✅ **Listes à puces** : `- item`, `* item`, `+ item`  
✅ **Listes numérotées** : `1. item`, `2. item`  
✅ **Surlignage** : `^texte^` (extension personnalisée)

## Performance

- ⚡ Traitement optimisé avec regex efficaces
- 🔄 Support des gros textes (testés jusqu'à 10k+ caractères)
- 🎯 Ordre de traitement optimisé pour éviter les conflits
- 📊 Statistiques calculées en une seule passe
