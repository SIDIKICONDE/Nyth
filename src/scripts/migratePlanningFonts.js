/**
 * Script de migration des polices pour les composants de planning
 *
 * Ce script supprime automatiquement les styles de police en dur
 * dans les fichiers de styles des composants de planning.
 */

const fs = require("fs");
const path = require("path");

// Répertoires à traiter
const PLANNING_DIRS = ["components/planning", "screens/PlanningScreen"];

// Patterns à supprimer
const FONT_PATTERNS = [
  /fontSize:\s*\d+,?\s*$/gm,
  /fontWeight:\s*["']?\w+["']?,?\s*$/gm,
  /fontFamily:\s*["'][^"']*["'],?\s*$/gm,
  /fontStyle:\s*["']?\w+["']?,?\s*$/gm,
];

// Commentaires de remplacement
const REPLACEMENT_COMMENTS = {
  fontSize: "    // Taille de police gérée par Typography",
  fontWeight: "    // Poids de police géré par Typography",
  fontFamily: "    // Police gérée par Typography",
  fontStyle: "    // Style de police géré par Typography",
};

/**
 * Nettoie les styles de police d'un fichier
 */
function cleanFontStyles(content) {
  let cleanedContent = content;

  // Supprimer les propriétés de police en dur
  FONT_PATTERNS.forEach((pattern) => {
    cleanedContent = cleanedContent.replace(pattern, (match) => {
      // Détecter le type de propriété
      if (match.includes("fontSize")) {
        return REPLACEMENT_COMMENTS.fontSize;
      } else if (match.includes("fontWeight")) {
        return REPLACEMENT_COMMENTS.fontWeight;
      } else if (match.includes("fontFamily")) {
        return REPLACEMENT_COMMENTS.fontFamily;
      } else if (match.includes("fontStyle")) {
        return REPLACEMENT_COMMENTS.fontStyle;
      }
      return "";
    });
  });

  return cleanedContent;
}

/**
 * Traite un fichier de styles
 */
function processStyleFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const cleanedContent = cleanFontStyles(content);

    // Vérifier s'il y a des changements
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent, "utf8");
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
    } else if (
      item.isFile() &&
      (item.name.endsWith(".ts") || item.name.endsWith(".tsx"))
    ) {
      // Traiter seulement les fichiers de styles ou contenant des styles
      if (
        item.name.includes("style") ||
        item.name.includes("Style") ||
        item.name.endsWith("styles.ts") ||
        item.name.endsWith("styles.tsx")
      ) {
        if (processStyleFile(fullPath)) {
          processedCount++;
        }
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

  PLANNING_DIRS.forEach((dir) => {
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

module.exports = { cleanFontStyles, processStyleFile, scanDirectory };
