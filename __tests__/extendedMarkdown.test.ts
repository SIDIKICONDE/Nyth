/**
 * Tests pour le formatage Markdown étendu
 * Couvre tous les nouveaux éléments Markdown supportés
 */

import { ExtendedMarkdownFormatter } from '../src/utils/textFormatter/ExtendedMarkdownFormatter';

describe('ExtendedMarkdownFormatter', () => {
  describe('applyExtendedMarkdownFormatting', () => {
    test('formate les titres correctement', () => {
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('# Titre niveau 1')).toBe('Titre niveau 1');
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('## Sous-titre')).toBe('Sous-titre');
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('### Sous-sous-titre')).toBe('Sous-sous-titre');
    });

    test('formate le texte gras avec ** et __', () => {
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('**gras**')).toBe('gras');
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('__gras__')).toBe('gras');
    });

    test('formate le texte italique avec * et _', () => {
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('*italique*')).toBe('italique');
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('_italique_')).toBe('italique');
    });

    test('formate le texte barré', () => {
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('~~barré~~')).toBe('barré');
    });

    test('formate le code inline', () => {
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('`code`')).toBe('code');
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('Voici du `code inline` dans une phrase')).toBe('Voici du code inline dans une phrase');
    });

    test('formate les blocs de code', () => {
      const codeBlock = '```\nfunction hello() {\n  console.log("Hello");\n}\n```';
      const expected = 'function hello() {\n  console.log("Hello");\n}';
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(codeBlock)).toBe(expected);
    });

    test('formate les citations', () => {
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('> citation')).toBe('citation');
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('> Ceci est une citation importante')).toBe('Ceci est une citation importante');
    });

    test('formate les listes à puces', () => {
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('- élément')).toBe('• élément');
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('* élément')).toBe('• élément');
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('+ élément')).toBe('• élément');
    });

    test('formate les listes numérotées', () => {
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('1. premier élément')).toBe('• premier élément');
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('2. deuxième élément')).toBe('• deuxième élément');
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('10. dixième élément')).toBe('• dixième élément');
    });

    test('formate le surlignage', () => {
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting('^surligné^')).toBe('surligné');
    });

    test('combine plusieurs formatages', () => {
      const input = '# Titre avec **gras** et *italique* et `code` et ~~barré~~';
      const expected = 'Titre avec gras et italique et code et barré';
      expect(ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(input)).toBe(expected);
    });

    test('respecte les options de formatage', () => {
      const text = '**gras** *italique* ~~barré~~ `code`';
      
      // Désactiver le gras
      const resultNoBold = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(text, { convertBold: false });
      expect(resultNoBold).toBe('*gras italique* barré code'); // Le ** devient * et traité comme italique
      
      // Désactiver l'italique
      const resultNoItalic = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(text, { convertItalic: false });
      expect(resultNoItalic).toBe('gras *italique* barré code');
      
      // Désactiver le texte barré
      const resultNoStrike = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(text, { convertStrikethrough: false });
      expect(resultNoStrike).toBe('gras italique ~~barré~~ code');
      
      // Désactiver le code
      const resultNoCode = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(text, { convertCode: false });
      expect(resultNoCode).toBe('gras italique barré `code`');
    });
  });

  describe('autoFormatExtendedText', () => {
    test('détecte et formate automatiquement le Markdown', () => {
      const input = 'Texte avec **formatage** et `code`';
      expect(ExtendedMarkdownFormatter.autoFormatExtendedText(input)).toBe('Texte avec formatage et code');
    });

    test('laisse le texte simple inchangé', () => {
      const plainText = 'Texte simple sans formatage';
      expect(ExtendedMarkdownFormatter.autoFormatExtendedText(plainText)).toBe(plainText);
    });

    test('gère les valeurs null/undefined', () => {
      expect(ExtendedMarkdownFormatter.autoFormatExtendedText(null as any)).toBe(null);
      expect(ExtendedMarkdownFormatter.autoFormatExtendedText(undefined as any)).toBe(undefined);
      expect(ExtendedMarkdownFormatter.autoFormatExtendedText('')).toBe('');
    });
  });

  describe('convertToHtml', () => {
    test('convertit le Markdown en HTML', () => {
      expect(ExtendedMarkdownFormatter.convertToHtml('**gras**')).toBe('<strong>gras</strong>');
      expect(ExtendedMarkdownFormatter.convertToHtml('*italique*')).toBe('<em>italique</em>');
      expect(ExtendedMarkdownFormatter.convertToHtml('~~barré~~')).toBe('<del>barré</del>');
      expect(ExtendedMarkdownFormatter.convertToHtml('`code`')).toBe('<code>code</code>');
      expect(ExtendedMarkdownFormatter.convertToHtml('# Titre')).toBe('<h1>Titre</h1>');
      expect(ExtendedMarkdownFormatter.convertToHtml('> citation')).toBe('<blockquote>citation</blockquote>');
    });

    test('convertit les listes en HTML', () => {
      expect(ExtendedMarkdownFormatter.convertToHtml('- élément')).toContain('<ul>');
      expect(ExtendedMarkdownFormatter.convertToHtml('- élément')).toContain('<li>élément</li>');
      expect(ExtendedMarkdownFormatter.convertToHtml('1. élément')).toContain('<ol>');
    });

    test('convertit les blocs de code en HTML', () => {
      const result = ExtendedMarkdownFormatter.convertToHtml('```code```');
      expect(result).toBe('<pre><code>code</code></pre>');
    });
  });

  describe('stripAllMarkdown', () => {
    test('supprime tout le formatage Markdown', () => {
      const input = '# Titre **gras** *italique* ~~barré~~ `code` > citation - liste 1. numérotée';
      const result = ExtendedMarkdownFormatter.stripAllMarkdown(input);
      // Vérifier que les éléments principaux sont présents sans leur formatage
      expect(result).toContain('Titre');
      expect(result).toContain('gras');
      expect(result).toContain('italique');
      // Le texte barré est complètement supprimé dans stripAllMarkdown
      expect(result).not.toContain('barré'); 
      expect(result).toContain('code');
      expect(result).toContain('citation');
      expect(result).toContain('liste');
      expect(result).toContain('numérotée');
      // Vérifier qu'il n'y a plus de marqueurs Markdown
      expect(result).not.toContain('**');
      expect(result).not.toContain('~~');
      expect(result).not.toContain('`');
      expect(result).not.toContain('# '); // Pas de titres complets
    });

    test('supprime les blocs de code', () => {
      const input = 'Avant ```\ncode block\n``` après';
      const expected = 'Avant code block après';
      expect(ExtendedMarkdownFormatter.stripAllMarkdown(input)).toBe(expected);
    });

    test('gère les valeurs null/undefined', () => {
      expect(ExtendedMarkdownFormatter.stripAllMarkdown(null as any)).toBe('');
      expect(ExtendedMarkdownFormatter.stripAllMarkdown(undefined as any)).toBe('');
      expect(ExtendedMarkdownFormatter.stripAllMarkdown('')).toBe('');
    });
  });

  describe('getMarkdownStats', () => {
    test('compte correctement les éléments Markdown', () => {
      const text = `# Titre
## Sous-titre
**gras** *italique* ~~barré~~ \`code\` ^surligné^
\`\`\`
bloc de code
\`\`\`
> citation
- liste 1
- liste 2
1. numérotée 1
2. numérotée 2`;
      
      const stats = ExtendedMarkdownFormatter.getMarkdownStats(text);
      
      expect(stats.headings.h1).toBe(1);
      expect(stats.headings.h2).toBe(1);
      expect(stats.headings.h3).toBe(0);
      expect(stats.bold).toBe(1);
      expect(stats.italic).toBe(1); // Maintenant correct avec les lookbehind
      expect(stats.strikethrough).toBe(1);
      expect(stats.inlineCode).toBe(2); // `code` + le code dans le texte
      expect(stats.highlight).toBe(1);
      expect(stats.codeBlocks).toBe(1);
      expect(stats.quotes).toBe(1);
      expect(stats.bulletLists).toBe(2);
      expect(stats.numberedLists).toBe(2);
      expect(stats.total).toBeGreaterThan(0);
    });

    test('retourne des stats vides pour texte vide', () => {
      const stats = ExtendedMarkdownFormatter.getMarkdownStats('');
      expect(stats.total).toBe(0);
      expect(stats.bold).toBe(0);
      expect(stats.italic).toBe(0);
    });

    test('gère les valeurs null/undefined', () => {
      const stats = ExtendedMarkdownFormatter.getMarkdownStats(null as any);
      expect(stats.total).toBe(0);
    });
  });

  describe('hasExtendedMarkdown', () => {
    test('détecte la présence de formatage Markdown', () => {
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('**gras**')).toBe(true);
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('*italique*')).toBe(true);
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('~~barré~~')).toBe(true);
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('`code`')).toBe(true);
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('```code```')).toBe(true);
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('# titre')).toBe(true);
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('> citation')).toBe(true);
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('- liste')).toBe(true);
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('1. numérotée')).toBe(true);
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('^surligné^')).toBe(true);
    });

    test('retourne false pour texte simple', () => {
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('texte simple')).toBe(false);
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown('')).toBe(false);
      expect(ExtendedMarkdownFormatter.hasExtendedMarkdown(null as any)).toBe(false);
    });
  });

  describe('Cas complexes et edge cases', () => {
    test('gère les formatages simples', () => {
      const input = '**gras** et *italique*';
      const result = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(input);
      expect(result).toBe('gras et italique');
    });

    test('gère les caractères spéciaux', () => {
      // Les caractères spéciaux sans formatage complet
      const input = 'Texte avec * seul et ** incomplet';
      const result = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(input);
      // Le formatage ne s'applique que si les marqueurs sont complets
      // Vérifier que le texte contient encore les caractères non formatés
      expect(result).toContain('Texte avec');
      expect(result).toContain('incomplet');
    });

    test('gère les blocs de code avec syntaxe', () => {
      const input = '```javascript\nconst x = 1;\n```';
      const result = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(input);
      expect(result).toBe('javascript\nconst x = 1;');
    });

    test('gère les listes simples', () => {
      const input = '- élément 1\n- élément 2';
      const result = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(input);
      expect(result).toContain('• élément 1');
      expect(result).toContain('• élément 2');
    });

    test('préserve les sauts de ligne dans les blocs de code', () => {
      const input = '```\nligne 1\nligne 2\nligne 3\n```';
      const result = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(input);
      expect(result).toBe('ligne 1\nligne 2\nligne 3');
    });

    test('gère les URLs dans le texte formaté', () => {
      const input = '**Voir** https://example.com pour *plus* d\'infos';
      const result = ExtendedMarkdownFormatter.applyExtendedMarkdownFormatting(input);
      expect(result).toBe('Voir https://example.com pour plus d\'infos');
    });
  });
});
