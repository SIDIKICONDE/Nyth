/**
 * Configuration globale Jest - Teardown avancé
 * Exécuté après tous les tests
 */

const fs = require('fs');
const path = require('path');

module.exports = async function globalTeardown() {
  console.log('🧹 Nettoyage global Jest avancé - Teardown...');

  // Récupération de la configuration
  const rootDir = path.resolve(__dirname, '..', '..');

  // Nettoyage des fichiers temporaires de test
  const tempTestFiles = [
    path.join(rootDir, '.jest-cache'),
    path.join(rootDir, 'coverage', 'temp'),
  ];

  tempTestFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        if (fs.statSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
        console.log(`🗑️  Fichier temporaire supprimé: ${filePath}`);
      } catch (error) {
        console.warn(`⚠️  Impossible de supprimer ${filePath}:`, error.message);
      }
    }
  });

  // Nettoyage des variables d'environnement de test
  delete process.env.__TEST__;
  delete process.env.BABEL_ENV;

  // Nettoyage des variables globales
  delete global.testConfig;

  console.log('✅ Nettoyage global avancé terminé');

  // Résumé des tests
  if (global.testResults) {
    console.log('\n📊 Résumé des tests:');
    console.log(`   ✅ Tests passés: ${global.testResults.passed || 0}`);
    console.log(`   ❌ Tests échoués: ${global.testResults.failed || 0}`);
    console.log(`   ⏭️  Tests ignorés: ${global.testResults.skipped || 0}`);
    console.log(`   📊 Couverture: ${global.testResults.coverage || 'N/A'}`);
  }
};
