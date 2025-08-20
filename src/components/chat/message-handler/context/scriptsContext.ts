import { getLocalizedTexts } from "./language";
import { ScriptMetadata, ScriptsContextConfig } from "./types";
import { getUserDisplayName } from "./userProfile";

/**
 * Configuration par défaut pour le contexte des scripts
 */
export const DEFAULT_SCRIPTS_CONFIG: ScriptsContextConfig = {
  maxScripts: 10,
  includePreview: true,
  previewLength: 150,
  includeMetadata: true,
  includeWordCount: true,
};

/**
 * Extrait les métadonnées d'un script
 */
export const extractScriptMetadata = (script: any): ScriptMetadata => {
  const wordCount = script.content ? script.content.split(" ").length : 0;
  const preview = script.content
    ? script.content.substring(0, 150) +
      (script.content.length > 150 ? "..." : "")
    : "";

  return {
    id: script.id || "",
    title: script.title || "Sans titre",
    wordCount,
    createdAt: script.createdAt || new Date().toISOString(),
    isFavorite: script.isFavorite || false,
    preview,
  };
};

/**
 * Trie les scripts par pertinence (favoris et récents en premier)
 */
export const sortScriptsByRelevance = (scripts: any[]): any[] => {
  return [...scripts].sort((a, b) => {
    // Favoris en premier
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;

    // Puis par date de création (plus récent en premier)
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
};

/**
 * Filtre les scripts par critères
 */
export const filterScripts = (
  scripts: any[],
  filters: {
    onlyFavorites?: boolean;
    minWordCount?: number;
    maxWordCount?: number;
    searchTerm?: string;
    dateRange?: { start: Date; end: Date };
  }
): any[] => {
  return scripts.filter((script) => {
    const metadata = extractScriptMetadata(script);

    // Filtre favoris
    if (filters.onlyFavorites && !metadata.isFavorite) {
      return false;
    }

    // Filtre nombre de mots
    if (filters.minWordCount && metadata.wordCount < filters.minWordCount) {
      return false;
    }

    if (filters.maxWordCount && metadata.wordCount > filters.maxWordCount) {
      return false;
    }

    // Filtre recherche textuelle
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const titleMatch = metadata.title.toLowerCase().includes(searchLower);
      const contentMatch = script.content?.toLowerCase().includes(searchLower);
      if (!titleMatch && !contentMatch) {
        return false;
      }
    }

    // Filtre plage de dates
    if (filters.dateRange) {
      const scriptDate = new Date(metadata.createdAt);
      if (
        scriptDate < filters.dateRange.start ||
        scriptDate > filters.dateRange.end
      ) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Construit le contexte des scripts
 */
export const buildScriptsContext = (
  user: any,
  scripts: any[],
  language: string,
  config: ScriptsContextConfig = DEFAULT_SCRIPTS_CONFIG
): string => {
  const userName = getUserDisplayName(user);
  const texts = getLocalizedTexts(language);

  if (!scripts || scripts.length === 0) {
    return texts.noScripts(userName) + "\n";
  }

  let context = texts.scriptsHeader(userName) + "\n\n";
  context += `${texts.totalScripts}: ${scripts.length}\n\n`;

  // Trier et limiter les scripts
  const sortedScripts = sortScriptsByRelevance(scripts);
  const limitedScripts = sortedScripts.slice(0, config.maxScripts);

  // Ajouter les détails de chaque script
  limitedScripts.forEach((script, index) => {
    const metadata = extractScriptMetadata(script);

    context += `SCRIPT ${index + 1}:\n`;
    context += `- ${texts.title}: "${metadata.title}"\n`;

    if (config.includeWordCount) {
      context += `- ${texts.words}: ${metadata.wordCount}\n`;
    }

    if (config.includeMetadata) {
      const createdDate = new Date(metadata.createdAt).toLocaleDateString();
      context += `- ${texts.created}: ${createdDate}\n`;
      context += `- ${texts.favorite}: ${
        metadata.isFavorite ? texts.yes : texts.no
      }\n`;
    }

    if (config.includePreview && metadata.preview) {
      const truncatedPreview = metadata.preview.substring(
        0,
        config.previewLength
      );
      const finalPreview =
        truncatedPreview +
        (metadata.preview.length > config.previewLength ? "..." : "");
      context += `- ${texts.preview}: "${finalPreview}"\n`;
    }

    context += "\n";
  });

  // Ajouter info sur scripts supplémentaires
  if (scripts.length > config.maxScripts) {
    const remainingCount = scripts.length - config.maxScripts;
    context += texts.moreScripts(remainingCount) + "\n\n";
  }

  return context;
};

/**
 * Construit un résumé statistique des scripts
 */
export const buildScriptsStatsContext = (
  scripts: any[],
  language: string
): string => {
  if (!scripts || scripts.length === 0) {
    return language === "fr"
      ? "Aucun script disponible pour les statistiques.\n"
      : "No scripts available for statistics.\n";
  }

  const totalScripts = scripts.length;
  const favoriteScripts = scripts.filter((s) => s.isFavorite).length;
  const totalWords = scripts.reduce((sum, script) => {
    return sum + (script.content ? script.content.split(" ").length : 0);
  }, 0);
  const averageWords = Math.round(totalWords / totalScripts);

  // Trouver le script le plus long et le plus court
  const scriptsByLength = scripts
    .map((s) => ({
      ...s,
      wordCount: s.content ? s.content.split(" ").length : 0,
    }))
    .sort((a, b) => b.wordCount - a.wordCount);

  const longestScript = scriptsByLength[0];
  const shortestScript = scriptsByLength[scriptsByLength.length - 1];

  let context =
    language === "fr" ? "STATISTIQUES DES SCRIPTS:\n" : "SCRIPTS STATISTICS:\n";

  context +=
    language === "fr"
      ? `- Total: ${totalScripts} scripts\n`
      : `- Total: ${totalScripts} scripts\n`;

  context +=
    language === "fr"
      ? `- Favoris: ${favoriteScripts} scripts\n`
      : `- Favorites: ${favoriteScripts} scripts\n`;

  context +=
    language === "fr"
      ? `- Mots total: ${totalWords.toLocaleString()}\n`
      : `- Total words: ${totalWords.toLocaleString()}\n`;

  context +=
    language === "fr"
      ? `- Moyenne: ${averageWords} mots par script\n`
      : `- Average: ${averageWords} words per script\n`;

  if (longestScript) {
    context +=
      language === "fr"
        ? `- Plus long: "${longestScript.title}" (${longestScript.wordCount} mots)\n`
        : `- Longest: "${longestScript.title}" (${longestScript.wordCount} words)\n`;
  }

  if (shortestScript && shortestScript.id !== longestScript?.id) {
    context +=
      language === "fr"
        ? `- Plus court: "${shortestScript.title}" (${shortestScript.wordCount} mots)\n`
        : `- Shortest: "${shortestScript.title}" (${shortestScript.wordCount} words)\n`;
  }

  return context + "\n";
};

/**
 * Construit le contexte des scripts favoris uniquement
 */
export const buildFavoritesContext = (
  user: any,
  scripts: any[],
  language: string
): string => {
  const userName = getUserDisplayName(user);
  const favoriteScripts = scripts.filter((s) => s.isFavorite);

  if (favoriteScripts.length === 0) {
    return language === "fr"
      ? `${userName || "L'utilisateur"} n'a aucun script favori.\n`
      : `${userName || "The user"} has no favorite scripts.\n`;
  }

  return buildScriptsContext(user, favoriteScripts, language, {
    ...DEFAULT_SCRIPTS_CONFIG,
    maxScripts: favoriteScripts.length, // Afficher tous les favoris
  });
};

/**
 * Construit le contexte des scripts récents
 */
export const buildRecentScriptsContext = (
  user: any,
  scripts: any[],
  language: string,
  maxRecent: number = 5
): string => {
  const userName = getUserDisplayName(user);
  const sortedByDate = [...scripts].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const recentScripts = sortedByDate.slice(0, maxRecent);

  const context =
    language === "fr"
      ? `SCRIPTS RÉCENTS DE ${userName.toUpperCase() || "L'UTILISATEUR"}:\n\n`
      : `RECENT SCRIPTS BY ${userName.toUpperCase() || "THE USER"}:\n\n`;

  return (
    context +
    buildScriptsContext(user, recentScripts, language, {
      ...DEFAULT_SCRIPTS_CONFIG,
      maxScripts: recentScripts.length,
    })
  );
};

/**
 * Recherche dans les scripts par mots-clés
 */
export const searchInScripts = (
  scripts: any[],
  searchTerm: string,
  options: {
    searchInTitle?: boolean;
    searchInContent?: boolean;
    caseSensitive?: boolean;
    maxResults?: number;
  } = {}
): any[] => {
  const {
    searchInTitle = true,
    searchInContent = true,
    caseSensitive = false,
    maxResults = 10,
  } = options;

  const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  const results = scripts.filter((script) => {
    let titleMatch = false;
    let contentMatch = false;

    if (searchInTitle && script.title) {
      const title = caseSensitive ? script.title : script.title.toLowerCase();
      titleMatch = title.includes(term);
    }

    if (searchInContent && script.content) {
      const content = caseSensitive
        ? script.content
        : script.content.toLowerCase();
      contentMatch = content.includes(term);
    }

    return titleMatch || contentMatch;
  });

  return results.slice(0, maxResults);
};

/**
 * Construit le contexte de recherche dans les scripts
 */
export const buildSearchResultsContext = (
  user: any,
  scripts: any[],
  searchTerm: string,
  language: string
): string => {
  const userName = getUserDisplayName(user);
  const results = searchInScripts(scripts, searchTerm);

  if (results.length === 0) {
    return language === "fr"
      ? `Aucun script trouvé pour "${searchTerm}".\n`
      : `No scripts found for "${searchTerm}".\n`;
  }

  const context =
    language === "fr"
      ? `RÉSULTATS DE RECHERCHE POUR "${searchTerm}" (${results.length} trouvé${
          results.length > 1 ? "s" : ""
        }):\n\n`
      : `SEARCH RESULTS FOR "${searchTerm}" (${results.length} found):\n\n`;

  return (
    context +
    buildScriptsContext(user, results, language, {
      ...DEFAULT_SCRIPTS_CONFIG,
      maxScripts: results.length,
      previewLength: 200, // Aperçu plus long pour les résultats de recherche
    })
  );
};

/**
 * Analyse les tendances dans les scripts
 */
export const analyzeScriptsTrends = (
  scripts: any[]
): {
  totalScripts: number;
  averageLength: number;
  mostCommonWords: string[];
  creationTrend: "increasing" | "decreasing" | "stable";
  favoriteRatio: number;
} => {
  if (!scripts || scripts.length === 0) {
    return {
      totalScripts: 0,
      averageLength: 0,
      mostCommonWords: [],
      creationTrend: "stable",
      favoriteRatio: 0,
    };
  }

  // Calculs de base
  const totalScripts = scripts.length;
  const totalWords = scripts.reduce((sum, script) => {
    return sum + (script.content ? script.content.split(" ").length : 0);
  }, 0);
  const averageLength = Math.round(totalWords / totalScripts);
  const favoriteRatio =
    scripts.filter((s) => s.isFavorite).length / totalScripts;

  // Analyse des mots les plus fréquents (basique)
  const allWords = scripts
    .flatMap((s) => (s.content ? s.content.toLowerCase().split(/\s+/) : []))
    .filter((word) => word.length > 3); // Ignorer les mots courts

  const wordCounts: { [key: string]: number } = {};
  allWords.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  const mostCommonWords = Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  // Tendance de création (basique)
  const sortedByDate = [...scripts].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateA - dateB;
  });

  let creationTrend: "increasing" | "decreasing" | "stable" = "stable";
  if (sortedByDate.length >= 3) {
    const recentHalf = sortedByDate.slice(Math.floor(sortedByDate.length / 2));
    const olderHalf = sortedByDate.slice(
      0,
      Math.floor(sortedByDate.length / 2)
    );

    if (recentHalf.length > olderHalf.length * 1.2) {
      creationTrend = "increasing";
    } else if (recentHalf.length < olderHalf.length * 0.8) {
      creationTrend = "decreasing";
    }
  }

  return {
    totalScripts,
    averageLength,
    mostCommonWords,
    creationTrend,
    favoriteRatio,
  };
};
