#!/usr/bin/env node

/**
 * Script de test pour les tests d'enregistrement vidéo
 * Permet d'exécuter les tests avec une configuration spécifique
 */

const { spawn } = require('child_process');
const path = require('path');

const recordingTestsDir = __dirname;
const jestConfig = path.join(recordingTestsDir, 'jest.config.js');

console.log('🚀 Lancement des tests d\'enregistrement vidéo...\n');

// Options de Jest
const jestArgs = [
  '--config',
  jestConfig,
  '--testPathPattern=__tests__/recording',
  '--verbose',
  '--colors',
  '--detectOpenHandles',
  '--forceExit',
];

// Ajouter les arguments de ligne de commande
const userArgs = process.argv.slice(2);
const allArgs = [...jestArgs, ...userArgs];

console.log('📋 Configuration:');
console.log(`   - Config: ${jestConfig}`);
console.log(`   - Tests: ${recordingTestsDir}`);
console.log(`   - Arguments: ${allArgs.join(' ')}\n`);

// Lancer Jest
const jestProcess = spawn('npx', ['jest', ...allArgs], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '../../'),
  env: {
    ...process.env,
    NODE_ENV: 'test',
    JEST_VIDEO_RECORDING: 'true',
  },
});

jestProcess.on('close', (code) => {
  console.log(`\n📊 Tests terminés avec le code: ${code}`);
  process.exit(code);
});

jestProcess.on('error', (error) => {
  console.error('❌ Erreur lors du lancement des tests:', error);
  process.exit(1);
});
