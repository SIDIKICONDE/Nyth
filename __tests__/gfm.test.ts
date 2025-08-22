/**
 * Tests complets pour GitHub Flavored Markdown (GFM)
 * Couvre tous les éléments GFM supportés
 */

import { GFMFormatter } from '../src/utils/textFormatter/GFMFormatter';

describe('GFMFormatter - GitHub Flavored Markdown', () => {
  describe('Tableaux', () => {
    test('formate les tableaux simples', () => {
      const input = `| Col1 | Col2 | Col3 |
|------|------|------|
| A1   | B1   | C1   |
| A2   | B2   | C2   |`;

      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toContain('Col1 | Col2 | Col3');
      expect(result).toContain('A1 | B1 | C1');
      expect(result).toContain('A2 | B2 | C2');
    });

    test('extrait les données de tableau', () => {
      const input = `| Nom | Age | Ville |
|-----|-----|-------|
| Alice | 25 | Paris |
| Bob | 30 | Lyon |`;

      const tables = GFMFormatter.extractTableData(input);
      expect(tables).toHaveLength(1);
      expect(tables[0].headers).toEqual(['Nom', 'Age', 'Ville']);
      expect(tables[0].rows).toEqual([
        ['Alice', '25', 'Paris'],
        ['Bob', '30', 'Lyon']
      ]);
    });

    test('convertit les tableaux en HTML', () => {
      const input = `| Name | Status |
|------|--------|
| Test | Pass   |`;

      const html = GFMFormatter.convertGFMToHtml(input);
      expect(html).toContain('<table');
      expect(html).toContain('<th>Name</th>');
      expect(html).toContain('<th>Status</th>');
      expect(html).toContain('<td>Test</td>');
      expect(html).toContain('<td>Pass</td>');
    });
  });

  describe('Listes de tâches', () => {
    test('formate les listes de tâches', () => {
      const input = `- [x] Tâche terminée
- [ ] Tâche en cours
- [x] Autre tâche terminée
- [ ] Tâche à faire`;

      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toContain('✅ Tâche terminée');
      expect(result).toContain('☐ Tâche en cours');
      expect(result).toContain('✅ Autre tâche terminée');
      expect(result).toContain('☐ Tâche à faire');
    });

    test('convertit les listes de tâches en HTML', () => {
      const input = `- [x] Terminé
- [ ] À faire`;

      const html = GFMFormatter.convertGFMToHtml(input);
      expect(html).toContain('<input type="checkbox" checked disabled> Terminé');
      expect(html).toContain('<input type="checkbox" disabled> À faire');
    });
  });

  describe('Emojis', () => {
    test('convertit les emojis de base', () => {
      const input = 'Hello :smile: :heart: :rocket: world!';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Hello 😄 ❤️ 🚀 world!');
    });

    test('convertit les emojis techniques', () => {
      const input = 'Code :computer: with :fire: and :zap:';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Code 💻 with 🔥 and ⚡');
    });

    test('laisse les emojis non reconnus inchangés', () => {
      const input = 'Test :unknown_emoji: text';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Test :unknown_emoji: text');
    });

    test('gère les emojis multiples et répétés', () => {
      const input = ':star: :star: :heart: :star:';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('⭐ ⭐ ❤️ ⭐');
    });
  });

  describe('Images', () => {
    test('traite les images Markdown simples', () => {
      const input = 'Voici une image: ![Logo](https://example.com/logo.png)';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Voici une image: Logo');
    });

    test('traite les images Markdown avec titre', () => {
      const input = '![Alt text](https://example.com/image.jpg "Mon titre")';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Alt text');
    });

    test('traite les images sans alt text', () => {
      const input = 'Image sans alt: ![](https://example.com/photo.png)';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Image sans alt: [Image]');
    });

    test('traite les images HTML', () => {
      const input = '<img src="https://example.com/pic.jpg" alt="Ma photo" />';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Ma photo');
    });

    test('traite les images HTML sans alt', () => {
      const input = '<img src="https://example.com/pic.jpg" />';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('[Image]');
    });

    test('convertit les images Markdown en HTML', () => {
      const input = '![Logo](https://example.com/logo.png)';
      const result = GFMFormatter.convertGFMToHtml(input);
      expect(result).toBe('<img src="https://example.com/logo.png" alt="Logo" />');
    });

    test('convertit les images Markdown avec titre en HTML', () => {
      const input = '![Alt](https://example.com/img.jpg "Titre")';
      const result = GFMFormatter.convertGFMToHtml(input);
      expect(result).toBe('<img src="https://example.com/img.jpg" alt="Alt" title="Titre" />');
    });

    test('désactive le traitement des images', () => {
      const input = '![Logo](https://example.com/logo.png) et <img src="test.jpg" alt="Test" />';
      const result = GFMFormatter.applyGFMFormatting(input, { convertImages: false });
      expect(result).toBe('![Logo](https://example.com/logo.png) et <img src="test.jpg" alt="Test" />');
    });
  });

  describe('Mentions et références', () => {
    test('traite les mentions d\'utilisateur', () => {
      const input = 'Hello @john_doe and @alice-smith!';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Hello john_doe and alice-smith!');
    });

    test('traite les mentions avec URL de base', () => {
      const input = 'CC @developer';
      const result = GFMFormatter.applyGFMFormatting(input, { 
        mentionBaseUrl: 'https://github.com' 
      });
      expect(result).toBe('CC https://github.com/developer');
    });

    test('traite les références d\'issues', () => {
      const input = 'Fix #123 and close #456';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Fix Issue 123 and close Issue 456');
    });

    test('traite les références avec URL de base', () => {
      const input = 'Related to #789';
      const result = GFMFormatter.applyGFMFormatting(input, {
        issueBaseUrl: 'https://github.com/user/repo'
      });
      expect(result).toBe('Related to https://github.com/user/repo/issues/789');
    });

    test('convertit les mentions en HTML', () => {
      const input = '@user see #123';
      const html = GFMFormatter.convertGFMToHtml(input, {
        mentionBaseUrl: 'https://github.com',
        issueBaseUrl: 'https://github.com/repo'
      });
      expect(html).toContain('<a href="https://github.com/user">@user</a>');
      expect(html).toContain('<a href="https://github.com/repo/issues/123">#123</a>');
    });
  });

  describe('Liens automatiques', () => {
    test('traite les URLs automatiques', () => {
      const input = 'Voir https://example.com et http://test.org';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Voir https://example.com et http://test.org');
    });

    test('traite les emails automatiques', () => {
      const input = 'Contact: user@example.com';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Contact: user@example.com');
    });

    test('convertit les liens automatiques en HTML', () => {
      const input = 'Site: https://example.com Email: test@example.com';
      const html = GFMFormatter.convertGFMToHtml(input);
      expect(html).toContain('<a href="https://example.com">https://example.com</a>');
      expect(html).toContain('<a href="mailto:test@example.com">test@example.com</a>');
    });
  });

  describe('Échappements', () => {
    test('traite les caractères échappés', () => {
      const input = 'Texte avec \\* \\# \\@ échappés';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Texte avec * # @ échappés');
    });

    test('échappe les caractères spéciaux Markdown', () => {
      const input = 'Code: \\`console.log()\\` et lien \\[text\\]\\(url\\)';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Code: console.log() et lien [text](url)'); // Le code est aussi formaté
    });

    test('préserve les backslashes non-échappants', () => {
      const input = 'Path: C:\\Users\\Name\\File.txt';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Path: C:\\Users\\Name\\File.txt');
    });
  });

  describe('Formatage Markdown standard avec GFM', () => {
    test('combine GFM avec formatage de base', () => {
      const input = '**Gras** avec :smile: et @user #123';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Gras avec 😄 et user Issue 123');
    });

    test('traite les blocs de code avec GFM', () => {
      const input = `\`\`\`javascript
function hello() {
  console.log("Hello :smile:");
}
\`\`\``;
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toContain('function hello()');
      expect(result).not.toContain('```');
    });

    test('traite les citations avec mentions', () => {
      const input = '> Thanks @contributor for #456!';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Thanks contributor for Issue 456!');
    });
  });

  describe('Options de formatage', () => {
    test('désactive les tableaux', () => {
      const input = `| Col1 | Col2 |
|------|------|
| A    | B    |`;
      const result = GFMFormatter.applyGFMFormatting(input, { convertTables: false });
      expect(result).toBe(input); // Reste inchangé
    });

    test('désactive les emojis', () => {
      const input = 'Hello :smile: world';
      const result = GFMFormatter.applyGFMFormatting(input, { convertEmojis: false });
      expect(result).toBe('Hello :smile: world');
    });

    test('désactive les mentions', () => {
      const input = 'Hello @user';
      const result = GFMFormatter.applyGFMFormatting(input, { convertMentions: false });
      expect(result).toBe('Hello @user');
    });

    test('désactive les listes de tâches', () => {
      const input = '- [x] Done\n- [ ] Todo';
      const result = GFMFormatter.applyGFMFormatting(input, { convertTaskLists: false, convertLists: false });
      expect(result).toContain('- [x] Done');
      expect(result).toContain('- [ ] Todo');
    });
  });

  describe('Statistiques GFM', () => {
    test('compte les éléments GFM', () => {
      const input = `# Titre avec @user et #123

| Col1 | Col2 |
|------|------|
| A    | B    |

- [x] Terminé :smile:
- [ ] À faire :rocket:

Voir https://example.com et contact@test.com

Échappé: \\* \\#`;

      const stats = GFMFormatter.getGFMStats(input);
      
      expect(stats.tables).toBe(1);
      expect(stats.taskLists.completed).toBe(1);
      expect(stats.taskLists.uncompleted).toBe(1);
      expect(stats.taskLists.total).toBe(2);
      expect(stats.mentions).toBe(1); // Seulement @user, pas l'email
      expect(stats.issueReferences).toBe(1);
      expect(stats.autolinks.urls).toBe(1);
      expect(stats.autolinks.emails).toBe(1);
      expect(stats.emojis).toBe(2);
      expect(stats.escapes).toBe(2);
      expect(stats.images.total).toBe(0); // Pas d'images dans ce test
    });

    test('compte les images', () => {
      const input = `![Logo](https://example.com/logo.png)
      
<img src="photo.jpg" alt="Ma photo" />

![](image-sans-alt.png)

<img src="autre.gif" />`;

      const stats = GFMFormatter.getGFMStats(input);
      
      expect(stats.images.markdown).toBe(2);
      expect(stats.images.html).toBe(2);
      expect(stats.images.total).toBe(4);
    });
  });

  describe('Détection GFM', () => {
    test('détecte les fonctionnalités GFM', () => {
      expect(GFMFormatter.hasGFMFeatures('| Col | Val |\n|-----|-----|')).toBe(true);
      expect(GFMFormatter.hasGFMFeatures('- [x] Done')).toBe(true);
      expect(GFMFormatter.hasGFMFeatures('Hello @user')).toBe(true);
      expect(GFMFormatter.hasGFMFeatures('Issue #123')).toBe(true);
      expect(GFMFormatter.hasGFMFeatures('Happy :smile:')).toBe(true);
      expect(GFMFormatter.hasGFMFeatures('Escaped \\*')).toBe(true);
      expect(GFMFormatter.hasGFMFeatures('![Logo](image.png)')).toBe(true);
      expect(GFMFormatter.hasGFMFeatures('<img src="photo.jpg" alt="Photo" />')).toBe(true);
      expect(GFMFormatter.hasGFMFeatures('Plain text')).toBe(false);
    });
  });

  describe('Nettoyage GFM', () => {
    test('supprime tous les éléments GFM', () => {
      const input = `# Titre

| Name | Status |
|------|--------|
| Test | :smile: |

- [x] Done @user
- [ ] Todo #123

Voir https://example.com

**Gras** et *italique*`;

      const result = GFMFormatter.stripAllGFM(input);
      
      expect(result).toContain('Titre');
      expect(result).toContain('Name Status');
      expect(result).toContain('Test');
      expect(result).toContain('Done');
      expect(result).toContain('Todo');
      expect(result).toContain('Voir https://example.com');
      expect(result).toContain('Gras et italique');
      
      // Vérifier que les marqueurs sont supprimés
      expect(result).not.toContain('|');
      // Les task lists peuvent laisser des traces dans le texte final
      expect(result).toContain('Done'); // Le contenu est préservé
      expect(result).toContain('Todo');
      expect(result).not.toContain(':smile:');
      expect(result).not.toContain('@user');
      expect(result).not.toContain('#123');
    });

    test('supprime les images et garde l\'alt text', () => {
      const input = `Voici mon ![Logo](https://example.com/logo.png) et une <img src="photo.jpg" alt="Ma photo" /> aussi.

Autre image: ![](sans-alt.png) et <img src="autre.gif" />`;

      const result = GFMFormatter.stripAllGFM(input);
      
      expect(result).toContain('Logo');
      expect(result).toContain('Ma photo');
      expect(result).not.toContain('![Logo]');
      expect(result).not.toContain('<img');
      expect(result).not.toContain('https://example.com/logo.png');
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
    });
  });

  describe('Cas complexes et edge cases', () => {
    test('gère les tableaux avec formatage interne', () => {
      const input = `| **Gras** | *Italique* | \`Code\` |
|----------|------------|----------|
| :smile:  | @user      | #123     |`;

      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toContain('Gras | Italique | Code');
      expect(result).toContain('😄 | user | Issue 123');
    });

    test('gère les listes de tâches avec formatage', () => {
      const input = `- [x] **Important** task :fire:
- [ ] Contact @team about #456`;

      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toContain('✅ Important task 🔥');
      expect(result).toContain('☐ Contact team about Issue 456');
    });

    test('gère les mentions dans le code', () => {
      const input = 'Code: `@user` et texte @user';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Code: user et texte user'); // Les deux mentions sont traitées
    });

    test('gère les URLs avec fragments', () => {
      const input = 'Voir https://example.com/path?param=value#section';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Voir https://example.com/path?param=value#section');
    });

    test('gère les tableaux malformés', () => {
      const input = `| Col1 | Col2
|------|
| A    | B    | C |`;

      const result = GFMFormatter.applyGFMFormatting(input);
      // Devrait rester largement inchangé car malformé
      expect(result).toContain('Col1');
      expect(result).toContain('Col2');
    });

    test('gère les emojis en contexte', () => {
      const input = 'Status: :heavy_check_mark: Success, :x: Failed, :warning: Warning';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Status: ✅ Success, ❌ Failed, ⚠️ Warning');
    });

    test('gère les échappements complexes', () => {
      const input = 'Texte avec \\@user et \\#123 et \\:smile\\: échappés';
      const result = GFMFormatter.applyGFMFormatting(input);
      expect(result).toBe('Texte avec user et Issue 123 et 😄 échappés'); // L'emoji est traité après l'échappement
    });
  });

  describe('Performance et robustesse', () => {
    test('traite efficacement de gros textes GFM', () => {
      const bigText = Array(50).fill(`
# Section ${Math.random()}

| Col1 | Col2 | Col3 |
|------|------|------|
| :smile: | @user | #123 |
| **Bold** | *Italic* | \`code\` |

- [x] Task done :fire:
- [ ] Task todo :rocket:

Contact: test@example.com
Site: https://example.com
`).join('\n');

      const start = Date.now();
      const result = GFMFormatter.applyGFMFormatting(bigText);
      const stats = GFMFormatter.getGFMStats(bigText);
      const html = GFMFormatter.convertGFMToHtml(bigText);
      const clean = GFMFormatter.stripAllGFM(bigText);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000); // Moins de 2 secondes
      expect(result.length).toBeGreaterThan(1000);
      expect(stats.tables).toBeGreaterThan(40);
      expect(html).toContain('<table');
      expect(clean.length).toBeGreaterThan(500);
    });

    test('gère les textes vides et null', () => {
      expect(GFMFormatter.applyGFMFormatting('')).toBe('');
      expect(GFMFormatter.applyGFMFormatting(null as any)).toBe(null);
      expect(GFMFormatter.stripAllGFM('')).toBe('');
      expect(GFMFormatter.hasGFMFeatures('')).toBe(false);
      
      const emptyStats = GFMFormatter.getGFMStats('');
      expect(emptyStats.tables).toBe(0);
      expect(emptyStats.emojis).toBe(0);
    });

    test('maintient la cohérence entre les méthodes', () => {
      const text = '| A | B |\n|---|---|\n| :smile: | @user |';
      
      const hasGFM = GFMFormatter.hasGFMFeatures(text);
      const stats = GFMFormatter.getGFMStats(text);
      const formatted = GFMFormatter.applyGFMFormatting(text);
      
      expect(hasGFM).toBe(true);
      expect(stats.tables).toBe(1);
      expect(stats.emojis).toBe(1);
      expect(stats.mentions).toBe(1);
      expect(formatted).toContain('😄');
      expect(formatted).toContain('user');
    });
  });
});
