#!/usr/bin/env node

/**
 * Script de vérification de la couverture de code pour HamburgerMenu
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_FILE = path.join(__dirname, '../../../coverage/coverage-final.json');
const MIN_COVERAGE = {
  statements: 90,
  branches: 85,
  functions: 95,
  lines: 90
};

function checkCoverage() {
  console.log('📊 Vérification de la couverture de code pour HamburgerMenu');
  console.log('=' .repeat(60));

  try {
    // Lire le fichier de couverture
    const coverageData = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));

    // Chercher les fichiers HamburgerMenu
    const hamburgerFiles = Object.keys(coverageData).filter(file =>
      file.includes('HamburgerMenu.tsx') ||
      file.includes('HamburgerMenu.ts')
    );

    if (hamburgerFiles.length === 0) {
      console.log('⚠️  Aucun fichier HamburgerMenu trouvé dans la couverture');
      return;
    }

    let totalCoverage = { statements: 0, branches: 0, functions: 0, lines: 0 };
    let fileCount = 0;

    hamburgerFiles.forEach(file => {
      const fileCoverage = coverageData[file];
      console.log(`\n📁 Fichier: ${path.basename(file)}`);

      Object.keys(MIN_COVERAGE).forEach(metric => {
        const coverage = fileCoverage[metric].pct;
        const status = coverage >= MIN_COVERAGE[metric] ? '✅' : '❌';

        console.log(`  ${metric}: ${coverage}% ${status}`);

        totalCoverage[metric] += coverage;
        fileCount++;
      });
    });

    // Calcul de la couverture moyenne
    console.log('\n📈 Couverture Moyenne:');
    console.log('=' .repeat(30));

    let allPassed = true;
    Object.keys(MIN_COVERAGE).forEach(metric => {
      const average = (totalCoverage[metric] / fileCount).toFixed(2);
      const passed = parseFloat(average) >= MIN_COVERAGE[metric];
      const status = passed ? '✅' : '❌';
      const color = passed ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';

      console.log(`${color}${metric}: ${average}% (min: ${MIN_COVERAGE[metric]}%)${reset} ${status}`);

      if (!passed) allPassed = false;
    });

    console.log('\n🎯 Résultat Final:');
    console.log('=' .repeat(20));

    if (allPassed) {
      console.log('✅ Toutes les métriques de couverture sont respectées !');
      process.exit(0);
    } else {
      console.log('❌ Certaines métriques de couverture ne sont pas respectées.');
      console.log('💡 Suggestions:');
      console.log('   - Ajouter des tests pour les branches non couvertes');
      console.log('   - Tester les cas d\'erreur et edge cases');
      console.log('   - Ajouter des tests d\'accessibilité');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la lecture du fichier de couverture:', error.message);
    console.log('💡 Exécutez d\'abord: npm test -- --testPathPattern="HamburgerMenu" --coverage');
    process.exit(1);
  }
}

// Si le script est appelé directement
if (require.main === module) {
  checkCoverage();
}

module.exports = { checkCoverage };
