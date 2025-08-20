/**
 * Configuration globale Jest - Setup avancé
 * Exécuté avant tous les tests
 */

const fs = require('fs');
const path = require('path');

module.exports = async function globalSetup() {
  console.log('🚀 Configuration globale Jest avancée - Setup...');

  // Configuration de l'environnement de test
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';

  // Variables d'environnement de test
  process.env.__TEST__ = 'true';
  process.env.__DEV__ = 'true';
  process.env.BABEL_ENV = 'test';

  // Configuration des chemins
  const rootDir = path.resolve(__dirname, '..', '..');
  process.env.PROJECT_ROOT = rootDir;

  // Création des dossiers de sortie si nécessaire
  const coverageDir = path.join(rootDir, 'coverage');
  const reportsDir = path.join(rootDir, 'reports');

  if (!fs.existsSync(coverageDir)) {
    fs.mkdirSync(coverageDir, { recursive: true });
  }

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Configuration des variables globales Node.js pour les tests
  global.testConfig = {
    rootDir,
    coverageDir,
    reportsDir,
    timestamp: Date.now(),
  };

  console.log('✅ Configuration globale avancée terminée');
  console.log(`📁 Dossier racine: ${rootDir}`);
  console.log(`📊 Couverture: ${coverageDir}`);
  console.log(`📋 Rapports: ${reportsDir}`);
};
