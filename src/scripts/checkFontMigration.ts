/**
 * Script de vérification de la migration des polices
 *
 * Ce script vérifie que tous les composants utilisent le système centralisé de polices
 * et identifie les styles de police en dur qui restent à migrer.
 */

import * as fs from "fs";
import * as path from "path";

interface FontIssue {
  file: string;
  line: number;
  content: string;
  type: "fontSize" | "fontWeight" | "fontFamily" | "tailwindFont";
}

const searchInFile = (filePath: string, content: string): FontIssue[] => {
  const issues: FontIssue[] = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Vérifier les styles fontSize en dur
    if (line.includes("fontSize:") && !line.includes("//")) {
      issues.push({
        file: filePath,
        line: index + 1,
        content: line.trim(),
        type: "fontSize",
      });
    }

    // Vérifier les styles fontWeight en dur
    if (line.includes("fontWeight:") && !line.includes("//")) {
      issues.push({
        file: filePath,
        line: index + 1,
        content: line.trim(),
        type: "fontWeight",
      });
    }

    // Vérifier les styles fontFamily en dur
    if (line.includes("fontFamily:") && !line.includes("//")) {
      issues.push({
        file: filePath,
        line: index + 1,
        content: line.trim(),
        type: "fontFamily",
      });
    }

    // Vérifier les classes Tailwind de police avec Text
    if (
      line.includes("<Text") &&
      line.includes("tw`") &&
      (line.includes("font-") ||
        line.includes("text-xs") ||
        line.includes("text-sm") ||
        line.includes("text-lg") ||
        line.includes("text-xl"))
    ) {
      issues.push({
        file: filePath,
        line: index + 1,
        content: line.trim(),
        type: "tailwindFont",
      });
    }
  });

  return issues;
};

const scanDirectory = (dirPath: string): FontIssue[] => {
  let allIssues: FontIssue[] = [];

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Ignorer certains dossiers
      if (!["node_modules", ".git", "android", "ios", ".expo"].includes(item)) {
        allIssues = allIssues.concat(scanDirectory(fullPath));
      }
    } else if (item.endsWith(".tsx") || item.endsWith(".ts")) {
      // Ignorer certains fichiers
      if (
        !item.includes(".test.") &&
        !item.includes(".spec.") &&
        !item.includes(".d.ts") &&
        !item.includes("checkFontMigration.ts")
      ) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const issues = searchInFile(fullPath, content);
          allIssues = allIssues.concat(issues);
        } catch (error) {}
      }
    }
  }

  return allIssues;
};

const main = () => {
  // Scanner le dossier src
  const srcPath = path.join(__dirname, "..");
  const issues = scanDirectory(srcPath);

  if (issues.length === 0) {
    return;
  }

  // Grouper par type
  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) acc[issue.type] = [];
    acc[issue.type].push(issue);
    return acc;
  }, {} as Record<string, FontIssue[]>);

  // Afficher par type
  Object.entries(groupedIssues).forEach(([type, typeIssues]) => {
    typeIssues.forEach((issue) => {
      const relativePath = path.relative(srcPath, issue.file);
    });
  });
};

if (require.main === module) {
  main();
}

export { main as checkFontMigration };
