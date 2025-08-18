#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Patterns à détecter qui indiquent des problèmes de responsive
const problematicPatterns = [
  {
    pattern: /Dimensions\.get\(['"]window['"]\)/g,
    message: 'Utilise Dimensions.get() - Remplacer par useResponsive hook',
    severity: 'error'
  },
  {
    pattern: /width:\s*\d+[,\s}]/g,
    message: 'Largeur fixe détectée - Utiliser moderateScale() ou wp()',
    severity: 'warning'
  },
  {
    pattern: /height:\s*\d+[,\s}]/g,
    message: 'Hauteur fixe détectée - Utiliser moderateScale() ou hp()',
    severity: 'warning'
  },
  {
    pattern: /fontSize:\s*\d+[,\s}]/g,
    message: 'Taille de police fixe - Utiliser responsiveFontSize()',
    severity: 'warning'
  },
  {
    pattern: /padding:\s*\d+[,\s}]/g,
    message: 'Padding fixe - Utiliser dimensions.padding',
    severity: 'info'
  },
  {
    pattern: /margin:\s*\d+[,\s}]/g,
    message: 'Margin fixe - Utiliser dimensions.margin',
    severity: 'info'
  },
  {
    pattern: /:\s*any[\s,;)]/g,
    message: 'Type "any" détecté - Utiliser des types spécifiques',
    severity: 'error'
  },
  {
    pattern: /style=\{\{[^}]*position:\s*['"]absolute['"]/g,
    message: 'Position absolute - Vérifier le responsive',
    severity: 'info'
  }
];

// Extensions de fichiers à analyser
const fileExtensions = ['.tsx', '.ts', '.jsx', '.js'];

// Dossiers à ignorer
const ignoreDirs = ['node_modules', '.git', 'build', 'dist', 'coverage', '__tests__'];

// Fichiers générés à ignorer
const ignoreFiles = ['responsive.ts', 'responsiveTailwind.ts', 'useResponsive.ts'];

function isIgnored(filePath) {
  const fileName = path.basename(filePath);
  if (ignoreFiles.includes(fileName)) return true;
  
  const parts = filePath.split(path.sep);
  return parts.some(part => ignoreDirs.includes(part));
}

function analyzeFile(filePath) {
  if (isIgnored(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  const lines = content.split('\n');
  
  problematicPatterns.forEach(({ pattern, message, severity }) => {
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: index + 1,
          message,
          severity,
          code: line.trim()
        });
      }
    });
  });
  
  return issues;
}

function scanDirectory(dir) {
  let allIssues = [];
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !isIgnored(filePath)) {
      allIssues = allIssues.concat(scanDirectory(filePath));
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (fileExtensions.includes(ext)) {
        const issues = analyzeFile(filePath);
        allIssues = allIssues.concat(issues);
      }
    }
  });
  
  return allIssues;
}

function formatIssue(issue) {
  const severityColors = {
    error: '\x1b[31m',    // Rouge
    warning: '\x1b[33m',  // Jaune
    info: '\x1b[36m'      // Cyan
  };
  
  const color = severityColors[issue.severity];
  const reset = '\x1b[0m';
  
  return `${color}[${issue.severity.toUpperCase()}]${reset} ${issue.file}:${issue.line}
  ${issue.message}
  > ${issue.code}
`;
}

function generateReport(issues) {
  const byFile = {};
  const bySeverity = { error: 0, warning: 0, info: 0 };
  
  issues.forEach(issue => {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
    bySeverity[issue.severity]++;
  });
  
  console.log('\n========================================');
  console.log('RAPPORT D\'ANALYSE RESPONSIVE');
  console.log('========================================\n');
  
  console.log(`Total des problèmes trouvés: ${issues.length}`);
  console.log(`  - Erreurs: ${bySeverity.error}`);
  console.log(`  - Avertissements: ${bySeverity.warning}`);
  console.log(`  - Informations: ${bySeverity.info}\n`);
  
  Object.keys(byFile).forEach(file => {
    console.log(`\nFichier: ${file}`);
    console.log('-'.repeat(50));
    byFile[file].forEach(issue => {
      console.log(formatIssue(issue));
    });
  });
  
  // Générer un fichier de rapport
  const report = {
    timestamp: new Date().toISOString(),
    summary: bySeverity,
    totalIssues: issues.length,
    issues: issues
  };
  
  fs.writeFileSync('responsive-report.json', JSON.stringify(report, null, 2));
  console.log('\nRapport détaillé sauvegardé dans: responsive-report.json\n');
}

// Exécution principale
const srcDir = path.join(__dirname, '../../');
console.log(`Analyse du répertoire: ${srcDir}`);

const issues = scanDirectory(srcDir);
generateReport(issues);

// Code de sortie basé sur les erreurs
process.exit(issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0);