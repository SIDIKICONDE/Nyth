/**
 * 📝 Formateur spécialisé pour les notes
 * Plus simple et dédié que le système général
 */

export interface NoteFormatOptions {
  preserveNewlines?: boolean;
  enableLinks?: boolean;
  enableMarkdown?: boolean;
}

export class NoteFormatter {
  /**
   * ✨ Nettoie le texte pour l'affichage (enlève les marqueurs Markdown)
   */
  static cleanForDisplay(text: string): string {
    if (!text) return "";

    return (text
      // Supprimer les marqueurs de formatage Markdown
      .replace(/\*\*(.*?)\*\*/g, "$1") // gras: **texte** → texte
      .replace(/\*(.*?)\*/g, "$1") // italique: *texte* → texte
      .replace(/\^(.*?)\^/g, "$1") // surlignage: ^texte^ → texte
      .replace(/__(.*?)__/g, "$1") // gras alt: __texte__ → texte
      .replace(/_(.*?)_/g, "$1") // italique alt: _texte_ → texte
      // Nettoyer les titres: # Titre → Titre
      .replace(/^#{1,6}\s+/gm, "")
      // Nettoyer les listes: - item → item
      .replace(/^[-*+]\s+/gm, "")
      // Nettoyer les liens: [texte](url) → texte
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Supprimer les balises HTML restantes
      .replace(/<[^>]*>/g, ""));
  }

  /**
   * 🎨 Applique le formatage Markdown (pour l'aperçu)
   */
  static applyFormatting(
    text: string,
    options: NoteFormatOptions = {}
  ): string {
    if (!text) return "";

    let result = text;

    if (options.enableMarkdown !== false) {
      // Formatage de base
      result = result
        // Gras: **texte** → <strong>texte</strong>
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Italique: *texte* → <em>texte</em>
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // Surlignage: ^texte^ → <mark>texte</mark>
        .replace(/\^(.*?)\^/g, "<mark>$1</mark>")
        // Titres: # Titre → <h1>Titre</h1>
        .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
        .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
        .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
        // Listes: - item → <li>item</li>
        .replace(/^[-*+]\s+(.*?)$/gm, "<li>$1</li>");

      // Entourer les listes dans <ul>
      result = result.replace(/((<li>.*?<\/li>\s*)+)/g, "<ul>$1</ul>");
    }

    if (options.enableLinks !== false) {
      // Liens: [texte](url) → <a href="url">texte</a>
      result = result.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2">$1</a>'
      );

      // URLs simples: http://... → <a href="...">...</a>
      result = result.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
    }

    if (options.preserveNewlines !== false) {
      // Conserver les sauts de ligne
      result = result.replace(/\n/g, "<br>");
    }

    return result;
  }

  /**
   * 📊 Compte les éléments formatés dans le texte
   */
  static getFormatStats(text: string) {
    if (!text)
      return {
        bold: 0,
        italic: 0,
        highlight: 0,
        headings: 0,
        lists: 0,
        links: 0,
      };

    return {
      bold: (text.match(/\*\*(.*?)\*\*/g) || []).length,
      italic: (text.match(/\*(.*?)\*/g) || []).length,
      highlight: (text.match(/\^(.*?)\^/g) || []).length,
      headings: (text.match(/^#{1,6}\s+/gm) || []).length,
      lists: (text.match(/^[-*+]\s+/gm) || []).length,
      links: (text.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length,
    };
  }

  /**
   * 🔍 Vérifie si le texte contient du formatage
   */
  static hasFormatting(text: string): boolean {
    if (!text) return false;

    const patterns = [
      /\*\*(.*?)\*\*/, // gras
      /\*(.*?)\*/, // italique
      /\^(.*?)\^/, // surlignage
      /^#{1,6}\s+/m, // titres
      /^[-*+]\s+/m, // listes
      /\[([^\]]+)\]\([^)]+\)/, // liens
    ];

    return patterns.some((pattern) => pattern.test(text));
  }

  /**
   * ✂️ Insère du formatage à une position donnée
   */
  static insertFormatting(
    text: string,
    selectionStart: number,
    selectionEnd: number,
    formatType: "bold" | "italic" | "highlight" | "heading" | "list" | "link",
    linkUrl?: string
  ): { newText: string; newCursorPosition: number } {
    const beforeText = text.substring(0, selectionStart);
    const selectedText = text.substring(selectionStart, selectionEnd);
    const afterText = text.substring(selectionEnd);

    let newText: string;
    let newCursorPosition: number;

    switch (formatType) {
      case "bold":
        if (selectedText) {
          newText = beforeText + "**" + selectedText + "**" + afterText;
          newCursorPosition = selectionEnd + 4; // **texte**
        } else {
          newText = beforeText + "****" + afterText;
          newCursorPosition = selectionStart + 2; // position entre les **
        }
        break;

      case "italic":
        if (selectedText) {
          newText = beforeText + "*" + selectedText + "*" + afterText;
          newCursorPosition = selectionEnd + 2; // *texte*
        } else {
          newText = beforeText + "*" + "*" + afterText;
          newCursorPosition = selectionStart + 1; // position entre les *
        }
        break;

      case "highlight":
        if (selectedText) {
          newText = beforeText + `^${selectedText}^` + afterText;
          newCursorPosition = selectionEnd + 2; // ^texte^
        } else {
          newText = beforeText + `^^` + afterText;
          newCursorPosition = selectionStart + 1; // position entre les ^
        }
        break;

      case "heading":
        const isNewLine = beforeText === "" || beforeText.endsWith("\n");
        const prefix = isNewLine ? "# " : "\n# ";
        newText = beforeText + prefix + afterText;
        newCursorPosition = selectionStart + prefix.length;
        break;

      case "list":
        const isNewLineList = beforeText === "" || beforeText.endsWith("\n");
        const listPrefix = isNewLineList ? "- " : "\n- ";
        newText = beforeText + listPrefix + afterText;
        newCursorPosition = selectionStart + listPrefix.length;
        break;

      case "link":
        const linkText = selectedText || "Lien";
        const url = linkUrl || "https://";
        const linkMarkdown = `[${linkText}](${url})`;
        newText = beforeText + linkMarkdown + afterText;
        newCursorPosition = selectionStart + linkMarkdown.length;
        break;

      default:
        newText = text;
        newCursorPosition = selectionStart;
    }

    return { newText, newCursorPosition };
  }

  /**
   * 🧹 Nettoie complètement le texte (supprime tout formatage)
   */
  static stripAllFormatting(text: string): string {
    if (!text) return "";

    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/\^(.*?)\^/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/<[^>]*>/g, "")
      .trim();
  }

  /**
   * 📏 Calcule des statistiques pour les notes
   */
  static getStats(text: string) {
    const cleanText = this.stripAllFormatting(text);
    const words = cleanText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const characters = cleanText.length;
    const lines = text.split("\n").length;
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0).length;

    return {
      words: cleanText.trim() ? words : 0,
      characters,
      lines,
      paragraphs,
      formatting: this.getFormatStats(text),
      hasFormatting: this.hasFormatting(text),
    };
  }
}
