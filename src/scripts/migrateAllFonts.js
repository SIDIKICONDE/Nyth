/**
 * Script de migration automatique des polices pour tous les composants
 *
 * Ce script remplace automatiquement les composants Text avec classes Tailwind
 * par les composants Typography centralisés appropriés.
 */

const fs = require("fs");
const path = require("path");

// Répertoires à traiter
const TARGET_DIRS = [
  "components/achievements",
  "components/ai",
  "components/editor",
  "components/settings",
  "components/home",
  "components/common",
];

// Patterns de remplacement pour les composants Text avec Tailwind
const TEXT_REPLACEMENTS = [
  // Titres
  {
    pattern:
      /<Text\s+style={tw`[^`]*text-(?:lg|xl|2xl)[^`]*font-(?:bold|semibold)[^`]*`}>/g,
    replacement: "<H4 style={[tw`",
    needsImport: "H4",
  },
  {
    pattern:
      /<Text\s+style={tw`[^`]*text-(?:sm|base)[^`]*font-(?:bold|semibold)[^`]*`}>/g,
    replacement: "<H5 style={[tw`",
    needsImport: "H5",
  },

  // Texte UI (boutons, labels)
  {
    pattern: /<Text\s+style={tw`[^`]*font-(?:medium|semibold)[^`]*`}>/g,
    replacement: '<UIText weight="600" style={[tw`',
    needsImport: "UIText",
  },

  // Texte de contenu
  {
    pattern: /<Text\s+style={tw`[^`]*text-(?:sm|base)[^`]*`}>/g,
    replacement: "<ContentText style={[tw`",
    needsImport: "ContentText",
  },

  // Petits textes (captions)
  {
    pattern: /<Text\s+style={tw`[^`]*text-xs[^`]*`}>/g,
    replacement: "<Caption style={[tw`",
    needsImport: "Caption",
  },
];

// Nettoyage des classes Tailwind de police
const TAILWIND_CLEANUPS = [
  /text-(?:xs|sm|base|lg|xl|2xl|3xl)/g,
  /font-(?:thin|light|normal|medium|semibold|bold|black)/g,
];

/**
 * Nettoie les classes Tailwind de police d'une chaîne
 */
function cleanTailwindClasses(content) {
  let cleaned = content;
  TAILWIND_CLEANUPS.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, "");
  });
  // Nettoyer les espaces multiples et les espaces en début/fin
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

/**
 * Extrait les imports Typography existants d'un fichier
 */
function extractExistingImports(content) {
  const importMatch = content.match(
    /import\s+{([^}]+)}\s+from\s+['"][^'"]*Typography['"];?/
  );
  if (importMatch) {
    return importMatch[1]
      .split(",")
      .map((imp) => imp.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Migre un fichier vers les composants Typography
 */
function migrateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    let migratedContent = content;
    const neededImports = new Set();
    let hasChanges = false;

    // Appliquer les remplacements de composants Text
    TEXT_REPLACEMENTS.forEach(({ pattern, replacement, needsImport }) => {
      if (pattern.test(migratedContent)) {
        // Remplacer les composants Text
        migratedContent = migratedContent.replace(pattern, (match) => {
          hasChanges = true;
          neededImports.add(needsImport);

          // Extraire et nettoyer les classes Tailwind
          const twMatch = match.match(/tw`([^`]*)`/);
          if (twMatch) {
            const cleanedClasses = cleanTailwindClasses(twMatch[1]);
            return (
              replacement +
              cleanedClasses +
              "`, { color: currentTheme.colors.text }]}>"
            );
          }
          return replacement + "{ color: currentTheme.colors.text }]}>";
        });
      }
    });

    // Remplacer les balises fermantes </Text> par les bonnes balises
    if (hasChanges) {
      // Ceci est une approximation - pour un vrai script, il faudrait parser l'AST
      migratedContent = migratedContent.replace(
        /<\/Text>/g,
        (match, offset) => {
          // Trouver le composant d'ouverture correspondant
          const beforeMatch = migratedContent.substring(0, offset);
          if (beforeMatch.includes("<H4")) return "</H4>";
          if (beforeMatch.includes("<H5")) return "</H5>";
          if (beforeMatch.includes("<UIText")) return "</UIText>";
          if (beforeMatch.includes("<ContentText")) return "</ContentText>";
          if (beforeMatch.includes("<Caption")) return "</Caption>";
          return match;
        }
      );
    }

    // Ajouter les imports nécessaires
    if (neededImports.size > 0) {
      const existingImports = extractExistingImports(migratedContent);
      const allImports = [...new Set([...existingImports, ...neededImports])];

      const importStatement = `import { ${allImports.join(
        ", "
      )} } from '../ui/Typography';`;

      // Remplacer l'import existant ou l'ajouter
      if (existingImports.length > 0) {
        migratedContent = migratedContent.replace(
          /import\s+{[^}]+}\s+from\s+['"][^'"]*Typography['"];?/,
          importStatement
        );
      } else {
        // Ajouter après les autres imports
        const lastImportIndex = migratedContent.lastIndexOf("import ");
        if (lastImportIndex !== -1) {
          const nextLineIndex = migratedContent.indexOf("\n", lastImportIndex);
          migratedContent =
            migratedContent.substring(0, nextLineIndex + 1) +
            importStatement +
            "\n" +
            migratedContent.substring(nextLineIndex + 1);
        }
      }
    }

    // Supprimer l'import Text si plus utilisé
    if (
      hasChanges &&
      !migratedContent.includes("<Text") &&
      !migratedContent.includes("Text,")
    ) {
      migratedContent = migratedContent.replace(/,?\s*Text/g, "");
      migratedContent = migratedContent.replace(/Text,?\s*/g, "");
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, migratedContent, "utf8");
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Scanne récursivement un répertoire
 */
function scanDirectory(dirPath) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  let processedCount = 0;

  items.forEach((item) => {
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      processedCount += scanDirectory(fullPath);
    } else if (item.isFile() && item.name.endsWith(".tsx")) {
      if (migrateFile(fullPath)) {
        processedCount++;
      }
    }
  });

  return processedCount;
}

/**
 * Fonction principale
 */
function main() {
  let totalProcessed = 0;

  TARGET_DIRS.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);

    if (fs.existsSync(fullPath)) {
      const processed = scanDirectory(fullPath);
      totalProcessed += processed;
    } else {}
  });

  if (totalProcessed === 0) {} else {}
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { migrateFile, scanDirectory };
