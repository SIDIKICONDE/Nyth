import { MarkdownOptions } from './types';

/**
 * GitHub Flavored Markdown (GFM) Formatter
 * Supporte toutes les extensions GFM en plus du Markdown standard :
 * 
 * - Tableaux (| Col1 | Col2 |)
 * - Cases à cocher (- [ ] et - [x])
 * - Liens automatiques (https://example.com)
 * - Mentions (@username)
 * - Références d'issues (#123)
 * - Emojis (:emoji:)
 * - Échappements améliorés
 */

export interface GFMOptions extends MarkdownOptions {
  convertTables?: boolean;
  convertTaskLists?: boolean;
  convertAutolinks?: boolean;
  convertMentions?: boolean;
  convertIssueReferences?: boolean;
  convertEmojis?: boolean;
  convertEscapes?: boolean;
  convertImages?: boolean;
  // Options pour les liens et mentions
  baseUrl?: string;
  mentionBaseUrl?: string;
  issueBaseUrl?: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  alignments?: ('left' | 'center' | 'right')[];
}

export class GFMFormatter {
  /**
   * Applique le formatage GitHub Flavored Markdown complet
   * @param text Texte à formater avec la syntaxe GFM
   * @param options Options de formatage GFM
   */
  static applyGFMFormatting(text: string, options: GFMOptions = {}): string {
    if (!text || typeof text !== 'string') {
      return text;
    }
    
    let result = text;
    
    // Options par défaut
    const {
      convertTables = true,
      convertTaskLists = true,
      convertAutolinks = true,
      convertMentions = true,
      convertIssueReferences = true,
      convertEmojis = true,
      convertEscapes = true,
      convertImages = true,
      // Hérite des options Markdown de base
      convertBold = true,
      convertItalic = true,
      convertStrikethrough = true,
      convertCode = true,
      convertCodeBlocks = true,
      convertHeaders = true,
      convertQuotes = true,
      convertLists = true,
      convertNumberedLists = true,
      convertHighlight = true
    } = options;

    // 1. Traiter les échappements en premier
    if (convertEscapes) {
      result = this.processEscapes(result);
    }

    // 2. Traiter les blocs de code pour éviter les conflits
    if (convertCodeBlocks) {
      result = result.replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/```/g, '').trim();
      });
    }

    // 3. Traiter les tableaux avant les autres éléments
    if (convertTables) {
      result = this.processTables(result);
    }

    // 4. Traiter les listes de tâches avant les listes normales
    if (convertTaskLists) {
      result = this.processTaskLists(result);
    }

    // 5. Traiter les emojis
    if (convertEmojis) {
      result = this.processEmojis(result);
    }

    // 6. Traiter les images automatiquement
    if (convertImages) {
      result = this.processImages(result);
    }

    // 7. Traiter les liens automatiques AVANT les mentions pour éviter les conflits
    if (convertAutolinks) {
      result = this.processAutolinks(result);
    }

    // 8. Traiter les mentions et références
    if (convertMentions) {
      result = this.processMentions(result, options.mentionBaseUrl);
    }

    if (convertIssueReferences) {
      result = this.processIssueReferences(result, options.issueBaseUrl);
    }

    // 9. Appliquer le formatage Markdown de base
    if (convertCode) {
      result = result.replace(/`([^`]+)`/g, '$1');
    }

    if (convertStrikethrough) {
      result = result.replace(/~~([^~]+)~~/g, '$1');
    }

    if (convertBold && convertItalic) {
      result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
      result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
      result = result.replace(/__([^_]+)__/g, '$1');
      result = result.replace(/\*([^*]+)\*/g, '$1');
      result = result.replace(/_([^_]+)_/g, '$1');
    } else if (convertBold) {
      result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
      result = result.replace(/__([^_]+)__/g, '$1');
    } else if (convertItalic) {
      result = result.replace(/\*([^*]+)\*/g, '$1');
      result = result.replace(/_([^_]+)_/g, '$1');
    }

    if (convertHighlight) {
      result = result.replace(/\^([^^]+)\^/g, '$1');
    }

    if (convertHeaders) {
      result = result.replace(/^#{1,6} (.+)$/gm, '$1');
    }

    if (convertQuotes) {
      result = result.replace(/^> (.+)$/gm, '$1');
    }

    if (convertNumberedLists) {
      result = result.replace(/^\d+\. (.+)$/gm, '• $1');
    }

    if (convertLists && !convertTaskLists) {
      // Seulement si les task lists ne sont pas activées
      result = result.replace(/^[-*+] (.+)$/gm, '• $1');
    } else if (convertLists) {
      // Traiter seulement les listes qui ne sont pas des task lists
      result = result.replace(/^[-*+] (?!\[[x ]\])(.+)$/gm, '• $1');
    }

    return result;
  }

  /**
   * Traite les tableaux Markdown
   * | Col1 | Col2 | Col3 |
   * |------|------|------|
   * | Data | Data | Data |
   */
  private static processTables(text: string): string {
    const tableRegex = /^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm;
    
    return text.replace(tableRegex, (match, headerRow, bodyRows) => {
      // Extraire les en-têtes
      const headers = headerRow.split('|')
        .map((h: string) => h.trim())
        .filter((h: string) => h.length > 0);

      // Extraire les lignes de données
      const rows = bodyRows.trim().split('\n')
        .map((row: string) => 
          row.split('|')
            .map((cell: string) => cell.trim())
            .filter((cell: string) => cell.length > 0)
        )
        .filter((row: string[]) => row.length > 0);

      // Créer une représentation textuelle simple du tableau
      let result = headers.join(' | ') + '\n';
      result += headers.map(() => '---').join(' | ') + '\n';
      
      rows.forEach(row => {
        result += row.join(' | ') + '\n';
      });

      return result;
    });
  }

  /**
   * Traite les listes de tâches (task lists)
   * - [ ] Tâche non terminée
   * - [x] Tâche terminée
   */
  private static processTaskLists(text: string): string {
    return text
      .replace(/^- \[x\] (.+)$/gm, '✅ $1')
      .replace(/^- \[ \] (.+)$/gm, '☐ $1');
  }

  /**
   * Traite les emojis :emoji:
   */
  private static processEmojis(text: string): string {
    const emojiMap: { [key: string]: string } = {
      // Visages essentiels
      ':smile:': '😄',
      ':joy:': '😂',
      ':wink:': '😉',
      ':heart_eyes:': '😍',
      ':thinking:': '🤔',
      ':cry:': '😢',
      ':angry:': '😠',
      ':confused:': '😕',
      ':sunglasses:': '😎',

      // Cœurs
      ':heart:': '❤️',
      ':broken_heart:': '💔',

      // Actions
      ':thumbsup:': '👍',
      ':thumbsdown:': '👎',
      ':clap:': '👏',
      ':wave:': '👋',
      ':pray:': '🙏',
      ':muscle:': '💪',

      // Symboles utiles
      ':fire:': '🔥',
      ':star:': '⭐',
      ':sparkles:': '✨',
      ':rocket:': '🚀',
      ':zap:': '⚡',
      ':boom:': '💥',

      // Tech
      ':computer:': '💻',
      ':phone:': '📱',
      ':gear:': '⚙️',
      ':wrench:': '🔧',
      ':bulb:': '💡',

      // Status
      ':heavy_check_mark:': '✅',
      ':x:': '❌',
      ':warning:': '⚠️',
      ':question:': '❓',
      ':exclamation:': '❗',

      // Flèches
      ':arrow_right:': '➡️',
      ':arrow_left:': '⬅️',
      ':arrow_up:': '⬆️',
      ':arrow_down:': '⬇️'
    };

    return text.replace(/:([a-z_]+):/g, (match, emojiName) => {
      return emojiMap[`:${emojiName}:`] || match;
    });
  }

  /**
   * Traite les images automatiquement (Markdown et HTML)
   */
  private static processImages(text: string): string {
    let result = text;
    
    // Images Markdown: ![alt](url) ou ![alt](url "title")
    result = result.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (match, alt, url, title) => {
      // Pour applyGFMFormatting, on retourne juste le texte alt ou un indicateur
      return alt || '[Image]';
    });
    
    // Images HTML: <img src="url" alt="alt" />
    result = result.replace(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, (match, url, alt) => {
      return alt || '[Image]';
    });
    
    // Images HTML simples: <img src="url" />
    result = result.replace(/<img[^>]+src=["']([^"']+)["'][^>]*\/?>/gi, '[Image]');
    
    return result;
  }

  /**
   * Traite les mentions @username (en évitant les emails)
   */
  private static processMentions(text: string, baseUrl?: string): string {
    // Éviter les emails avec lookbehind et lookahead négatifs
    const mentionRegex = /(?<![a-zA-Z0-9._%+-])@([a-zA-Z0-9_-]+)(?![a-zA-Z0-9.-]*\.[a-zA-Z]{2,})/g;
    
    if (baseUrl) {
      return text.replace(mentionRegex, `${baseUrl}/$1`);
    }
    
    // Si pas d'URL de base, on garde juste le nom d'utilisateur
    return text.replace(mentionRegex, '$1');
  }

  /**
   * Traite les références d'issues #123
   */
  private static processIssueReferences(text: string, baseUrl?: string): string {
    const issueRegex = /#(\d+)/g;
    
    if (baseUrl) {
      return text.replace(issueRegex, `${baseUrl}/issues/$1`);
    }
    
    // Si pas d'URL de base, on garde juste le numéro
    return text.replace(issueRegex, 'Issue $1');
  }

  /**
   * Traite les liens automatiques
   */
  private static processAutolinks(text: string): string {
    // Pour le formatage simple, on garde les URLs et emails tels quels
    // La conversion en liens cliquables se fait dans convertGFMToHtml
    return text;
  }

  /**
   * Traite les échappements de caractères
   */
  private static processEscapes(text: string): string {
    // Traiter les caractères échappés avec backslash
    return text.replace(/\\([\\`*_{}[\]()#+\-.!|~^@:])/g, '$1');
  }

  /**
   * Convertit le texte GFM en HTML
   */
  static convertGFMToHtml(text: string, options: GFMOptions = {}): string {
    let result = text;

    // Traiter les tableaux en premier
    if (options.convertTables !== false) {
      result = this.convertTablesToHtml(result);
    }

    // Traiter les listes de tâches
    if (options.convertTaskLists !== false) {
      result = result
        .replace(/^- \[x\] (.+)$/gm, '<input type="checkbox" checked disabled> $1<br>')
        .replace(/^- \[ \] (.+)$/gm, '<input type="checkbox" disabled> $1<br>');
    }

    // Traiter les emojis
    if (options.convertEmojis !== false) {
      result = this.processEmojis(result);
    }

    // Traiter les images AVANT les liens automatiques
    if (options.convertImages !== false) {
      result = this.convertImagesToHtml(result);
    }

    // Traiter les liens automatiques APRÈS les images, en évitant les URLs dans les balises img
    if (options.convertAutolinks !== false) {
      // Ne pas transformer les URLs qui sont déjà dans des balises img src
      result = result
        .replace(/(https?:\/\/[^\s<>"]+)(?![^<]*>)/g, '<a href="$1">$1</a>')
        .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?![^<]*>)/g, 
          '<a href="mailto:$1">$1</a>');
    }

    // Traiter les mentions APRÈS les liens pour éviter les conflits
    if (options.convertMentions !== false && options.mentionBaseUrl) {
      result = result.replace(/@([a-zA-Z0-9_-]+)/g, 
        `<a href="${options.mentionBaseUrl}/$1">@$1</a>`);
    }

    // Traiter les références d'issues APRÈS les liens pour éviter les conflits
    if (options.convertIssueReferences !== false && options.issueBaseUrl) {
      result = result.replace(/#(\d+)/g, 
        `<a href="${options.issueBaseUrl}/issues/$1">#$1</a>`);
    }

    // Appliquer le formatage Markdown de base
    result = result
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/\^([^^]+)\^/g, '<mark>$1</mark>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/^[-*+] (.+)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');

    return result;
  }

  /**
   * Convertit les tableaux en HTML
   */
  private static convertTablesToHtml(text: string): string {
    const tableRegex = /^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm;
    
    return text.replace(tableRegex, (match, headerRow, bodyRows) => {
      const headers = headerRow.split('|')
        .map((h: string) => h.trim())
        .filter((h: string) => h.length > 0);

      const rows = bodyRows.trim().split('\n')
        .map((row: string) => 
          row.split('|')
            .map((cell: string) => cell.trim())
            .filter((cell: string) => cell.length > 0)
        )
        .filter((row: string[]) => row.length > 0);

      let html = '<table border="1" cellpadding="5" cellspacing="0">\n';
      
      // En-têtes
      html += '<thead><tr>';
      headers.forEach(header => {
        html += `<th>${header}</th>`;
      });
      html += '</tr></thead>\n';
      
      // Corps du tableau
      html += '<tbody>';
      rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
          html += `<td>${cell}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table>\n';

      return html;
    });
  }

  /**
   * Convertit les images en HTML
   */
  private static convertImagesToHtml(text: string): string {
    let result = text;
    
    // Images Markdown: ![alt](url) ou ![alt](url "title")
    result = result.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (match, alt, url, title) => {
      const titleAttr = title ? ` title="${title}"` : '';
      const altAttr = alt ? ` alt="${alt}"` : ' alt=""';
      return `<img src="${url}"${altAttr}${titleAttr} />`;
    });
    
    // Laisser les balises img HTML telles quelles (elles sont déjà en HTML)
    
    return result;
  }

  /**
   * Extrait les données d'un tableau pour traitement
   */
  static extractTableData(text: string): TableData[] {
    const tables: TableData[] = [];
    const tableRegex = /^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm;
    
    let match;
    while ((match = tableRegex.exec(text)) !== null) {
      const [, headerRow, bodyRows] = match;
      
      const headers = headerRow.split('|')
        .map((h: string) => h.trim())
        .filter((h: string) => h.length > 0);

      const rows = bodyRows.trim().split('\n')
        .map((row: string) => 
          row.split('|')
            .map((cell: string) => cell.trim())
            .filter((cell: string) => cell.length > 0)
        )
        .filter((row: string[]) => row.length > 0);

      tables.push({ headers, rows });
    }

    return tables;
  }

  /**
   * Obtient les statistiques GFM
   */
  static getGFMStats(text: string) {
    return {
      tables: (text.match(/^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n/gm) || []).length,
      taskLists: {
        completed: (text.match(/^- \[x\] /gm) || []).length,
        uncompleted: (text.match(/^- \[ \] /gm) || []).length,
        total: (text.match(/^- \[[x ]\] /gm) || []).length
      },
      mentions: (text.match(/(?<![a-zA-Z0-9._%+-])@[a-zA-Z0-9_-]+(?![a-zA-Z0-9.-]*\.[a-zA-Z]{2,})/g) || []).length,
      issueReferences: (text.match(/#\d+/g) || []).length,
      autolinks: {
        urls: (text.match(/https?:\/\/[^\s<>]+/g) || []).length,
        emails: (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).length
      },
      emojis: (text.match(/:[a-z_]+:/g) || []).length,
      escapes: (text.match(/\\[\\`*_{}[\]()#+\-.!|~^@]/g) || []).length,
      images: {
        markdown: (text.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length,
        html: (text.match(/<img[^>]+src=["'][^"']+["'][^>]*\/?>/gi) || []).length,
        total: ((text.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length + 
               ((text.match(/<img[^>]+src=["'][^"']+["'][^>]*\/?>/gi) || []).length))
      }
    };
  }

  /**
   * Vérifie si le texte contient des éléments GFM
   */
  static hasGFMFeatures(text: string): boolean {
    const gfmPatterns = [
      /^\|(.+)\|\s*\n\|[-:\s|]+\|/m,    // Tables
      /^- \[[x ]\] /m,                   // Task lists
      /(?<![a-zA-Z0-9._%+-])@[a-zA-Z0-9_-]+(?![a-zA-Z0-9.-]*\.[a-zA-Z]{2,})/,  // Mentions (pas emails)
      /#\d+/,                            // Issue references
      /:[a-z_]+:/,                       // Emojis
      /\\[\\`*_{}[\]()#+\-.!|~^@]/,      // Escapes
      /!\[[^\]]*\]\([^)]+\)/,            // Images Markdown
      /<img[^>]+src=["'][^"']+["'][^>]*\/?>/i  // Images HTML
    ];

    return gfmPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Supprime tous les éléments GFM et Markdown
   */
  static stripAllGFM(text: string): string {
    return text
      // Supprimer les tableaux
      .replace(/^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (match, headerRow, bodyRows) => {
        const headers = headerRow.split('|')
          .map((h: string) => h.trim())
          .filter((h: string) => h.length > 0);
        const rows = bodyRows.trim().split('\n')
          .map((row: string) => 
            row.split('|')
              .map((cell: string) => cell.trim())
              .filter((cell: string) => cell.length > 0)
              .join(' ')
          );
        return [headers.join(' '), ...rows].join('\n');
      })
      // Supprimer les task lists
      .replace(/^- \[[x ]\] (.+)$/gm, '$1')
      // Supprimer les emojis
      .replace(/:[a-z_]+:/g, '')
      // Supprimer les images Markdown et garder seulement l'alt text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Supprimer les balises img HTML et garder seulement l'alt text
      .replace(/<img[^>]+alt=["']([^"']*)["'][^>]*\/?>/gi, '$1')
      .replace(/<img[^>]+src=["'][^"']+["'][^>]*\/?>/gi, '')
      // Supprimer les mentions et références (pas les emails)
      .replace(/(?<![a-zA-Z0-9._%+-])@[a-zA-Z0-9_-]+(?![a-zA-Z0-9.-]*\.[a-zA-Z]{2,})/g, '')
      .replace(/#\d+/g, '')
      // Traiter les échappements
      .replace(/\\([\\`*_{}[\]()#+\-.!|~^@])/g, '$1')
      // Appliquer le nettoyage Markdown standard
      .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, '').trim())
      .replace(/`([^`]+)`/g, '$1')
      .replace(/~~([^~]+)~~/g, '')  // Supprimer complètement le texte barré
      .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/\^([^^]+)\^/g, '$1')
      .replace(/^#{1,6} (.+)$/gm, '$1')
      .replace(/^> (.+)$/gm, '$1')
      .replace(/^\d+\. (.+)$/gm, '$1')
      .replace(/^[-*+] (.+)$/gm, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
