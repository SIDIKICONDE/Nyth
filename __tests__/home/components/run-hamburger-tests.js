#!/usr/bin/env node

/**
 * Script d'exécution des tests HamburgerMenu
 * Permet de lancer les tests avec différentes configurations
 */

const { execSync } = require('child_process');
const path = require('path');

const TEST_DIR = path.join(__dirname);

const commands = {
  unit: 'npm test -- --testPathPattern="HamburgerMenu.test.tsx" --verbose',
  integration: 'npm test -- --testPathPattern="HamburgerMenu.integration.test.tsx" --verbose',
  all: 'npm test -- --testPathPattern="HamburgerMenu" --verbose',
  coverage: 'npm test -- --testPathPattern="HamburgerMenu" --coverage --verbose',
  watch: 'npm test -- --testPathPattern="HamburgerMenu" --watch --verbose'
};

function runTests(type = 'all') {
  console.log(`🚀 Lancement des tests HamburgerMenu (${type})`);
  console.log('=' .repeat(50));

  try {
    const command = commands[type];
    if (!command) {
      throw new Error(`Type de test inconnu: ${type}`);
    }

    console.log(`📝 Commande: ${command}`);
    console.log('⏳ Exécution en cours...');

    const result = execSync(command, {
      cwd: path.join(__dirname, '../../..'),
      stdio: 'inherit',
      encoding: 'utf-8'
    });

    console.log('✅ Tests terminés avec succès');

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests:', error.message);
    process.exit(1);
  }
}

// Si le script est appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  console.log('🎯 Script de test HamburgerMenu');
  console.log('📋 Types disponibles: unit, integration, all, coverage, watch');
  console.log(`🎯 Type sélectionné: ${testType}`);
  console.log('');

  runTests(testType);
}

module.exports = { runTests };
