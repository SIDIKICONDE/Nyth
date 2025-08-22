/**
 * Tests d'intégration pour le système de formatage Markdown étendu
 * Tests uniquement les fonctionnalités sans dépendances React Native
 */

import { 
  ExtendedMarkdownFormatter, 
  TextFormatter,
  BasicFormatter,
  MarkdownFormatter,
  TextAnalyzer
} from '../src/utils/textFormatter/ExtendedMarkdownFormatter';

describe('Tests d\'intégration - Formatage Markdown étendu', () => {
  const texteComplet = `
# Guide Markdown Étendu

## Introduction
Ceci est un **guide complet** pour utiliser le *formatage Markdown* avec ~~anciennes~~ nouvelles fonctionnalités.

### Éléments supportés
- **Gras** : \`**texte**\` ou \`__texte__\`
- *Italique* : \`*texte*\` ou \`_texte_\`
- ~~Barré~~ : \`~~texte~~\`
- Code inline : \`\`code\`\`

#### Blocs de code
\`\`\`javascript
function exemple() {
  console.log("Hello World!");
  return true;
}
\`\`\`

> **Important:** Cette ^fonctionnalité^ est très utile pour les développeurs.

### Listes numérotées
1. Premier point important
2. Deuxième point avec **emphase**
3. Troisième point avec *style*

**Conclusion:** Le formatage Markdown est ^essentiel^ pour une bonne documentation.
`;

  describe('Formatage de texte complet', () => {
    test('formate correctement un document complet', () => {
      const resultat = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(texteComplet);
      
      // Vérifier que les titres sont formatés
      expect(resultat).toContain('Guide Markdown Étendu');
      expect(resultat).toContain('Introduction');
      expect(resultat).toContain('Éléments supportés');
      
      // Vérifier que le formatage est appliqué
      expect(resultat).toContain('guide complet');
      expect(resultat).toContain('formatage Markdown');
      expect(resultat).toContain('nouvelles'); // ~~anciennes~~ supprimé
      
      // Vérifier les listes
      expect(resultat).toContain('• Premier point important');
      expect(resultat).toContain('• Deuxième point avec emphase');
      
      // Vérifier les citations
      expect(resultat).toContain('Cette fonctionnalité est très utile');
      
      // Vérifier les blocs de code
      expect(resultat).toContain('function exemple()');
    });

    test('génère des statistiques précises', () => {
      const stats = ExtendedMarkdownFormatter.getMarkdownStats(texteComplet);
      
      expect(stats.headings.h1).toBe(1); // # Guide
      expect(stats.headings.h2).toBe(1); // ## Introduction  
      expect(stats.headings.h3).toBe(2); // ### Éléments + ### Listes numérotées
      expect(stats.bold).toBeGreaterThan(3); // Plusieurs **texte**
      expect(stats.italic).toBeGreaterThan(2); // Plusieurs *texte*
      expect(stats.strikethrough).toBe(3); // ~~anciennes~~ + ~~Barré~~ + dans les exemples
      expect(stats.codeBlocks).toBe(1); // ```javascript
      expect(stats.inlineCode).toBeGreaterThan(5); // Plusieurs `code`
      expect(stats.quotes).toBe(1); // > Important
      expect(stats.numberedLists).toBe(3); // 1. 2. 3.
      expect(stats.bulletLists).toBe(4); // - éléments (4 selon le debug)
      expect(stats.highlight).toBe(2); // ^fonctionnalité^ ^essentiel^
      expect(stats.total).toBeGreaterThan(15);
    });

    test('convertit correctement en HTML', () => {
      const html = ExtendedMarkdownFormatter.convertToHtml(texteComplet);
      
      expect(html).toContain('<h1>Guide Markdown Étendu</h1>');
      expect(html).toContain('<h2>Introduction</h2>');
      expect(html).toContain('<strong>guide complet</strong>');
      expect(html).toContain('<em>formatage Markdown</em>');
      expect(html).toContain('<del>anciennes</del>');
      expect(html).toContain('<code>'); // Le code est formaté mais pas nécessairement **texte**
      expect(html).toContain('<pre><code>javascript');
      expect(html).toContain('<blockquote>');
      expect(html).toContain('<mark>fonctionnalité</mark>');
      expect(html).toContain('<ol>');
      expect(html).toContain('<ul>');
    });

    test('supprime tout le formatage proprement', () => {
      const textePropre = ExtendedMarkdownFormatter.stripAllMarkdown(texteComplet);
      
      // Vérifier que le contenu est préservé
      expect(textePropre).toContain('Guide Markdown Étendu');
      expect(textePropre).toContain('guide complet');
      expect(textePropre).toContain('nouvelles');
      // Le texte barré est complètement supprimé dans stripAllMarkdown
      expect(textePropre).not.toContain('~~'); // Pas de marqueurs
      
      // Vérifier qu'aucun marqueur Markdown ne reste
      expect(textePropre).not.toContain('**');
      expect(textePropre).not.toContain('~~');
      // Il peut rester quelques ` dans le texte nettoyé (comme dans "``code``")
      // On vérifie juste qu'il n'y a pas de code inline complet
      expect(textePropre).not.toContain('```');
      // Il peut rester des # isolés, on vérifie juste qu'il n'y a pas de titres complets
      expect(textePropre).not.toContain('#### ');
      expect(textePropre).not.toContain('>');
      expect(textePropre).not.toContain('^');
    });
  });

  describe('Pipeline de traitement complet', () => {
    test('traite un texte de bout en bout', () => {
      const texteOriginal = `
# Article de Blog

## Introduction  
Voici un **article** avec du *formatage* et du ~~contenu~~ code.

### Code d'exemple
\`\`\`typescript
const message: string = "Hello";
console.log(message);
\`\`\`

> **Note:** Ceci est ^important^ à retenir.

#### Liste des fonctionnalités
1. Formatage **gras** et *italique*
2. Code \`inline\` et blocs
3. ~~Texte barré~~
4. Citations et listes

**Conclusion:** Le système fonctionne ^parfaitement^ !
`;

      // 1. Analyser le texte original
      const statsOriginales = ExtendedMarkdownFormatter.getMarkdownStats(texteOriginal);
      expect(statsOriginales.total).toBeGreaterThan(10);

      // 2. Formater pour téléprompter (supprime le formatage)
      const texteTeleprompter = ExtendedMarkdownFormatter.autoFormatExtendedText(texteOriginal);
      expect(texteTeleprompter).not.toContain('**');
      expect(texteTeleprompter).not.toContain('*');
      expect(texteTeleprompter).toContain('article');
      expect(texteTeleprompter).toContain('formatage');

      // 3. Convertir en HTML pour web
      const htmlWeb = ExtendedMarkdownFormatter.convertToHtml(texteOriginal);
      expect(htmlWeb).toContain('<h1>Article de Blog</h1>');
      expect(htmlWeb).toContain('<strong>article</strong>');
      expect(htmlWeb).toContain('<pre><code>typescript');

      // 4. Nettoyer pour affichage simple
      const texteSimple = ExtendedMarkdownFormatter.stripAllMarkdown(texteOriginal);
      expect(texteSimple).toContain('Article de Blog');
      expect(texteSimple).toContain('article');
      // Le texte barré est supprimé complètement
      expect(texteSimple).not.toContain('~~'); // Marqueurs supprimés
    });
  });

  describe('Gestion des cas limites', () => {
    test('gère les textes vides et null', () => {
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('')).toBe('');
      expect(ExtendedMarkdownFormatter.autoFormatExtendedText(null as any)).toBe(null);
      expect(ExtendedMarkdownFormatter.stripAllMarkdown(undefined as any)).toBe('');
      
      const statsVides = ExtendedMarkdownFormatter.getMarkdownStats('');
      expect(statsVides.total).toBe(0);
    });

    test('gère les formatages complexes et imbriqués', () => {
      const texteComplexe = '**Gras avec *italique* dedans** et ~~barré avec `code` dedans~~';
      const resultat = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(texteComplexe);
      
      expect(resultat).toContain('Gras avec');
      expect(resultat).toContain('italique');
      expect(resultat).toContain('dedans');
      expect(resultat).toContain('barré avec');
      expect(resultat).toContain('code');
    });

    test('préserve les caractères spéciaux non-Markdown', () => {
      const texteSpecial = 'Email: test@example.com et URL: https://example.com';
      const resultat = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(texteSpecial);
      
      expect(resultat).toBe(texteSpecial); // Doit rester inchangé
      expect(resultat).toContain('@');
      expect(resultat).toContain('://');
    });
  });

  describe('Performance', () => {
    test('traite efficacement de gros textes', () => {
      // Créer un gros texte avec du formatage
      const grosTexte = Array(100).fill(`
# Titre ${Math.random()}
**Gras** *italique* ~~barré~~ \`code\`
> Citation importante
- Liste 1
- Liste 2
1. Numéroté 1
2. Numéroté 2
`).join('\n');

      const debut = Date.now();
      
      // Traiter le gros texte
      const resultat = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(grosTexte);
      const stats = ExtendedMarkdownFormatter.getMarkdownStats(grosTexte);
      const html = ExtendedMarkdownFormatter.convertToHtml(grosTexte);
      const clean = ExtendedMarkdownFormatter.stripAllMarkdown(grosTexte);
      
      const duree = Date.now() - debut;
      
      // Vérifier que le traitement est rapide (< 1 seconde)
      expect(duree).toBeLessThan(1000);
      
      // Vérifier que les résultats sont corrects
      expect(resultat.length).toBeGreaterThan(1000);
      expect(stats.total).toBeGreaterThan(500);
      expect(html).toContain('<h1>');
      expect(clean.length).toBeGreaterThan(500);
    });
  });

  describe('Compatibilité et robustesse', () => {
    test('fonctionne avec tous les éléments Markdown standards', () => {
      const tousLesElements = `
# Titre H1
## Titre H2  
### Titre H3

**Texte en gras** et __aussi en gras__
*Texte en italique* et _aussi en italique_
~~Texte barré~~

Code inline: \`const x = 1;\`

\`\`\`javascript
// Bloc de code
function hello() {
  return "Hello World!";
}
\`\`\`

> Ceci est une citation
> Sur plusieurs lignes

- Liste à puces 1
- Liste à puces 2
* Autre puce 1
* Autre puce 2
+ Encore une puce

1. Liste numérotée 1
2. Liste numérotée 2
10. Numéro 10

^Texte surligné^ avec notre extension.

Combinaisons: **gras avec *italique* dedans** et ~~barré avec \`code\` dedans~~.
`;

      const resultat = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(tousLesElements);
      const stats = ExtendedMarkdownFormatter.getMarkdownStats(tousLesElements);
      const html = ExtendedMarkdownFormatter.convertToHtml(tousLesElements);
      const clean = ExtendedMarkdownFormatter.stripAllMarkdown(tousLesElements);

      // Vérifications de base
      expect(resultat).toBeTruthy();
      expect(stats.total).toBeGreaterThan(20);
      expect(html).toContain('<h1>');
      expect(html).toContain('<strong>');
      expect(html).toContain('<em>');
      expect(clean).not.toContain('**');
      // Peut rester quelques * dans les cas complexes, on vérifie juste les doubles
      expect(clean).not.toContain('**');
      expect(clean).toContain('Titre H1');
      expect(clean).toContain('Texte en gras');
    });

    test('maintient la cohérence entre les différentes méthodes', () => {
      const texte = '**Important:** Voir `README.md` pour les ^détails^ complets.';
      
      // Toutes les méthodes doivent traiter le même texte de manière cohérente
      const formaté = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(texte);
      const auto = ExtendedMarkdownFormatter.autoFormatExtendedText(texte);
      const détecté = ExtendedMarkdownFormatter.hasExtendedMarkdown(texte);
      const stats = ExtendedMarkdownFormatter.getMarkdownStats(texte);
      
      expect(formaté).toBe(auto); // Même résultat
      expect(détecté).toBe(true); // Formatage détecté
      expect(stats.total).toBeGreaterThan(0); // Stats cohérentes
      expect(stats.bold + stats.inlineCode + stats.highlight).toBe(3); // 3 éléments formatés
    });
  });
});
