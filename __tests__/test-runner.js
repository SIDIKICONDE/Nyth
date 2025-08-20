#!/usr/bin/env node

/**
 * Test Runner pour l'application Nyth
 * Lance les tests avec différentes configurations
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.testDir = __dirname;
  }

  /**
   * Lance tous les tests
   */
  async runAllTests() {
    console.log('🚀 Lancement de tous les tests avec configuration avancée...\n');

    return new Promise((resolve, reject) => {
      const jest = spawn('npx', [
        'jest',
        '--config', path.join(this.testDir, 'jest.config.js'),
        '--forceExit',
        '--detectOpenHandles',
      ], {
        cwd: this.rootDir,
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          __TEST__: 'true',
          __DEV__: 'true',
        },
      });

      jest.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Tous les tests sont passés avec succès !');
          resolve();
        } else {
          console.log('\n❌ Certains tests ont échoué');
          console.log('💡 Vérifiez la configuration Jest et les mocks');
          reject(new Error(`Tests failed with code ${code}`));
        }
      });

      jest.on('error', (error) => {
        console.error('Erreur lors du lancement des tests:', error);
        reject(error);
      });
    });
  }

  /**
   * Lance les tests d'un module spécifique
   */
  async runModuleTests(module) {
    console.log(`🚀 Lancement des tests pour ${module}...\n`);

    return new Promise((resolve, reject) => {
      const jest = spawn('npx', [
        'jest',
        '--config', path.join(this.testDir, 'jest.config.js'),
        `--testPathPattern=${module}`,
      ], {
        cwd: this.rootDir,
        stdio: 'inherit',
        shell: true,
      });

      jest.on('close', (code) => {
        if (code === 0) {
          console.log(`\n✅ Tests ${module} passés !`);
          resolve();
        } else {
          console.log(`\n❌ Tests ${module} échoués`);
          reject(new Error(`Module tests failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Lance les tests avec couverture
   */
  async runTestsWithCoverage() {
    console.log('🚀 Lancement des tests avec couverture...\n');

    return new Promise((resolve, reject) => {
      const jest = spawn('npx', [
        'jest',
        '--config', path.join(this.testDir, 'jest.config.js'),
        '--coverage',
        '--coverageReporters=text',
      ], {
        cwd: this.rootDir,
        stdio: 'inherit',
        shell: true,
      });

      jest.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Tests avec couverture terminés !');
          resolve();
        } else {
          console.log('\n❌ Tests avec couverture échoués');
          reject(new Error(`Coverage tests failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Lance les tests en mode watch
   */
  async runTestsWatch() {
    console.log('👀 Lancement des tests en mode watch...\n');

    return new Promise((resolve, reject) => {
      const jest = spawn('npx', [
        'jest',
        '--config', path.join(this.testDir, 'jest.config.js'),
        '--watch',
      ], {
        cwd: this.rootDir,
        stdio: 'inherit',
        shell: true,
      });

      // Le mode watch ne se termine pas automatiquement
      jest.on('error', (error) => {
        console.error('Erreur lors du lancement des tests en watch:', error);
        reject(error);
      });
    });
  }

  /**
   * Lance les tests pour l'authentification
   */
  async runAuthTests() {
    return this.runModuleTests('auth');
  }

  /**
   * Lance les tests pour les services
   */
  async runServicesTests() {
    return this.runModuleTests('services');
  }

  /**
   * Lance les tests pour les hooks
   */
  async runHooksTests() {
    return this.runModuleTests('hooks');
  }

  /**
   * Lance les tests pour les contextes
   */
  async runContextsTests() {
    return this.runModuleTests('contexts');
  }

  /**
   * Lance les tests pour la navigation
   */
  async runNavigationTests() {
    return this.runModuleTests('navigation');
  }

  /**
   * Affiche l'aide
   */
  showHelp() {
    console.log(`
📋 Test Runner pour Nyth

Usage:
  node __tests__/test-runner.js [command]

Commands:
  all              Lance tous les tests
  auth             Lance les tests d'authentification
  services         Lance les tests des services
  hooks            Lance les tests des hooks
  contexts         Lance les tests des contextes
  navigation       Lance les tests de navigation
  coverage         Lance les tests avec couverture
  watch            Lance les tests en mode watch

Examples:
  node __tests__/test-runner.js all
  node __tests__/test-runner.js auth
  node __tests__/test-runner.js coverage
  node __tests__/test-runner.js watch

Configuration:
  - Jest config: __tests__/jest.config.js
  - Setup: __tests__/setup/jest.setup.js
  - Tests: __tests__/**/*.test.{ts,tsx,js}
`);
  }

  /**
   * Point d'entrée principal
   */
  async run() {
    const command = process.argv[2];

    try {
      switch (command) {
        case 'all':
          await this.runAllTests();
          break;
        case 'auth':
          await this.runAuthTests();
          break;
        case 'services':
          await this.runServicesTests();
          break;
        case 'hooks':
          await this.runHooksTests();
          break;
        case 'contexts':
          await this.runContextsTests();
          break;
        case 'navigation':
          await this.runNavigationTests();
          break;
        case 'coverage':
          await this.runTestsWithCoverage();
          break;
        case 'watch':
          await this.runTestsWatch();
          break;
        case 'help':
        case '--help':
        case '-h':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution des tests:', error.message);
      process.exit(1);
    }
  }
}

// Lancement du test runner
if (require.main === module) {
  const runner = new TestRunner();
  runner.run();
}

module.exports = TestRunner;
