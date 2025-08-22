import { MarkdownOptions } from './types';

/**
 * Formatage Markdown étendu avec support complet des éléments Markdown
 * Supporte tous les éléments demandés :
 * - # Titre → Titre niveau 1
 * - ## Sous-titre → Titre niveau 2  
 * - ### Sous-sous-titre → Titre niveau 3
 * - **gras** ou __gras__ → gras
 * - *italique* ou _italique_ → italique
 * - ~~barré~~ → barré
 * - `code` → code inline
 * - ``` → bloc de code
 * - > citation → citation
 * - - liste ou 1. liste numérotée
 */
export class ExtendedMarkdownFormatter {
  /**
   * Applique le formatage Markdown étendu au texte
   * @param text Texte à formater avec la syntaxe Markdown
   * @param options Options de formatage Markdown
   */
  static applyExtendedMarkdownFormatting(text: string, options: MarkdownOptions = {}): string {
    let result = text;
    
    // Options par défaut - toutes activées
    const {
      convertBold = true,
      convertItalic = true,
      convertHighlight = true,
      convertHeaders = true,
      convertLists = true,
      convertStrikethrough = true,
      convertCode = true,
      convertCodeBlocks = true,
      convertQuotes = true,
      convertNumberedLists = true
    } = options;
    
    // 1. Formatage des blocs de code (``` code ```) - doit être traité en premier pour éviter les conflits
    if (convertCodeBlocks) {
      result = result.replace(/```([\s\S]*?)```/g, (match, content) => {
        // Extraire le contenu du bloc de code en supprimant les espaces en début/fin
        return content.trim();
      });
    }
    
    // 2. Formatage du code inline (`code`)
    if (convertCode) {
      result = result.replace(/`([^`]+)`/g, '$1');
    }
    
    // 3. Formatage barré (~~texte~~)
    if (convertStrikethrough) {
      result = result.replace(/~~([^~]+)~~/g, '$1');
    }
    
    // 4. Formatage gras et italique - traiter ensemble pour éviter les conflits
    if (convertBold && convertItalic) {
      // Traiter d'abord le gras et italique combiné (***texte***)
      result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
      // Puis le gras (**texte**)
      result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
      result = result.replace(/__([^_]+)__/g, '$1');
      // Puis l'italique (*texte*)
      result = result.replace(/\*([^*]+)\*/g, '$1');
      result = result.replace(/_([^_]+)_/g, '$1');
    } else if (convertBold) {
      // Seulement le gras
      result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
      result = result.replace(/__([^_]+)__/g, '$1');
    } else if (convertItalic) {
      // Seulement l'italique
      result = result.replace(/\*([^*]+)\*/g, '$1');
      result = result.replace(/_([^_]+)_/g, '$1');
    }
    
    // 6. Formatage surligné avec accent circonflexe (^texte^)
    if (convertHighlight) {
      result = result.replace(/\^([^^]+)\^/g, '$1');
    }
    
    // 7. Formatage des titres (# Titre, ## Sous-titre, ### Sous-sous-titre)
    if (convertHeaders) {
      result = result.replace(/^### (.+)$/gm, '$1'); // Niveau 3
      result = result.replace(/^## (.+)$/gm, '$1');  // Niveau 2
      result = result.replace(/^# (.+)$/gm, '$1');   // Niveau 1
    }
    
    // 8. Formatage des citations (> citation)
    if (convertQuotes) {
      result = result.replace(/^> (.+)$/gm, '$1');
    }
    
    // 9. Formatage des listes numérotées (1. élément, 2. élément, etc.)
    if (convertNumberedLists) {
      result = result.replace(/^\d+\. (.+)$/gm, '• $1');
    }
    
    // 10. Formatage des listes à puces (- élément, * élément, + élément)
    if (convertLists) {
      result = result.replace(/^[-*+] (.+)$/gm, '• $1');
    }
    
    return result;
  }

  /**
   * Détecte automatiquement et formate le texte Markdown étendu
   * @param text Texte à analyser et formater
   */
  static autoFormatExtendedText(text: string): string {
    if (!text || typeof text !== 'string') {
      return text; // Protection contre les valeurs null ou non-string
    }
    
    let result = text;
    
    // Détecte si le texte contient des symboles Markdown étendus
    const hasExtendedMarkdown = /(\*\*|\*|__|_|\^|~~|`|```|^#{1,3} |^[-*+] |^\d+\. |^> )/m.test(text);
    
    if (hasExtendedMarkdown) {
      try {
        result = this.applyExtendedMarkdownFormatting(result);
      } catch (error) {
        // En cas d'erreur, retourner le texte original
        console.warn('Erreur lors du formatage Markdown étendu:', error);
        return text;
      }
    }
    
    return result;
  }

  /**
   * Convertit le texte Markdown en HTML pour l'affichage web
   * @param text Texte Markdown à convertir
   */
  static convertToHtml(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let result = text;

    // Blocs de code
    result = result.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Code inline
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Texte barré
    result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
    // Gras et italique combiné
    result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    
    // Gras
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Italique
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Surlignage
    result = result.replace(/\^([^^]+)\^/g, '<mark>$1</mark>');
    
    // Titres
    result = result.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    result = result.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    result = result.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Citations
    result = result.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Listes numérotées - traiter en bloc
    result = result.replace(/(^\d+\. .+$(\n^\d+\. .+$)*)/gm, (match) => {
      const items = match.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
      return `<ol>${items}</ol>`;
    });
    
    // Listes à puces - traiter en bloc
    result = result.replace(/(^[-*+] .+$(\n^[-*+] .+$)*)/gm, (match) => {
      const items = match.replace(/^[-*+] (.+)$/gm, '<li>$1</li>');
      return `<ul>${items}</ul>`;
    });
    
    // Sauts de ligne
    result = result.replace(/\n/g, '<br>');

    return result;
  }

  /**
   * Supprime tout le formatage Markdown du texte (version propre)
   * @param text Texte avec formatage Markdown
   */
  static stripAllMarkdown(text: string): string {
    if (!text || typeof text !== 'string') {
      return text || '';
    }

    return text
      // Blocs de code
      .replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/```/g, '').trim();
      })
      // Code inline
      .replace(/`([^`]+)`/g, '$1')
      // Texte barré - supprimer complètement le contenu barré
      .replace(/~~([^~]+)~~/g, '')
      // Gras et italique combiné
      .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
      // Gras
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // Italique
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Surlignage
      .replace(/\^([^^]+)\^/g, '$1')
      // Titres (tous les niveaux)
      .replace(/^#{1,6} (.+)$/gm, '$1')
      // Citations
      .replace(/^> (.+)$/gm, '$1')
      // Listes
      .replace(/^\d+\. (.+)$/gm, '$1')
      .replace(/^[-*+] (.+)$/gm, '$1')
      // Nettoyer les espaces multiples
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Compte les éléments Markdown dans le texte
   * @param text Texte à analyser
   */
  static getMarkdownStats(text: string) {
    if (!text || typeof text !== 'string') {
      return {
        codeBlocks: 0,
        inlineCode: 0,
        strikethrough: 0,
        bold: 0,
        italic: 0,
        highlight: 0,
        headings: { h1: 0, h2: 0, h3: 0 },
        quotes: 0,
        numberedLists: 0,
        bulletLists: 0,
        total: 0
      };
    }

    const stats = {
      codeBlocks: (text.match(/```[\s\S]*?```/g) || []).length,
      inlineCode: (text.match(/`[^`]+`/g) || []).length,
      strikethrough: (text.match(/~~[^~]+~~/g) || []).length,
      bold: (text.match(/\*\*[^*]+\*\*/g) || []).length + (text.match(/__[^_]+__/g) || []).length,
      // Pour l'italique, exclure ce qui est déjà dans le gras
      italic: (text.match(/(?<!\*)\*[^*]+\*(?!\*)/g) || []).length + (text.match(/(?<!_)_[^_]+_(?!_)/g) || []).length,
      highlight: (text.match(/\^[^^]+\^/g) || []).length,
      headings: {
        h1: (text.match(/^# .+$/gm) || []).length,
        h2: (text.match(/^## .+$/gm) || []).length,
        h3: (text.match(/^### .+$/gm) || []).length,
      },
      quotes: (text.match(/^> .+$/gm) || []).length,
      numberedLists: (text.match(/^\d+\. .+$/gm) || []).length,
      bulletLists: (text.match(/^[-*+] .+$/gm) || []).length,
      total: 0
    };

    // Calculer le total
    stats.total = stats.codeBlocks + stats.inlineCode + stats.strikethrough + 
                  stats.bold + stats.italic + stats.highlight + 
                  stats.headings.h1 + stats.headings.h2 + stats.headings.h3 + 
                  stats.quotes + stats.numberedLists + stats.bulletLists;

    return stats;
  }

  /**
   * Vérifie si le texte contient du formatage Markdown étendu
   * @param text Texte à vérifier
   */
  static hasExtendedMarkdown(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const patterns = [
      /```[\s\S]*?```/,        // Blocs de code
      /`[^`]+`/,               // Code inline
      /~~[^~]+~~/,             // Texte barré
      /\*\*[^*]+\*\*/,         // Gras avec **
      /__[^_]+__/,             // Gras avec __
      /(?<!\*)\*[^*]+\*(?!\*)/,// Italique avec * (pas dans **)
      /(?<!_)_[^_]+_(?!_)/,    // Italique avec _ (pas dans __)
      /\^[^^]+\^/,             // Surlignage
      /^#{1,3} .+$/m,          // Titres
      /^> .+$/m,               // Citations
      /^\d+\. .+$/m,           // Listes numérotées
      /^[-*+] .+$/m,           // Listes à puces
    ];

    return patterns.some(pattern => pattern.test(text));
  }
}
