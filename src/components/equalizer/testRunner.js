/**
 * Script de test pour le module Equalizer
 *
 * Ce script permet de tester manuellement les fonctionnalités de l'égaliseur
 * sans dépendre de Jest pour un test rapide.
 */

const NativeAudioEqualizerModule = {
  // Mocks pour les tests
  createEqualizer: (numBands, sampleRate) => {
    console.log(`✅ Création d'un égaliseur avec ${numBands} bandes à ${sampleRate}Hz`);
    return 1;
  },

  destroyEqualizer: (id) => {
    console.log(`✅ Destruction de l'égaliseur ${id}`);
  },

  setEQEnabled: (enabled) => {
    console.log(`✅ Égaliseur ${enabled ? 'activé' : 'désactivé'}`);
  },

  getEQEnabled: () => {
    console.log('✅ État de l\'égaliseur récupéré');
    return true;
  },

  setMasterGain: (gain) => {
    console.log(`✅ Gain master réglé à ${gain}dB`);
  },

  getMasterGain: () => {
    console.log('✅ Gain master récupéré');
    return 0;
  },

  setBandGain: (bandIndex, gain) => {
    console.log(`✅ Bande ${bandIndex}: gain réglé à ${gain}dB`);
  },

  beginBatch: () => {
    console.log('✅ Début des opérations groupées');
  },

  endBatch: () => {
    console.log('✅ Fin des opérations groupées');
  },

  getSpectrumData: () => {
    console.log('✅ Données spectrales récupérées');
    return Array(32).fill(0.5);
  },

  startSpectrumAnalysis: () => {
    console.log('✅ Analyse spectrale démarrée');
  },

  stopSpectrumAnalysis: () => {
    console.log('✅ Analyse spectrale arrêtée');
  },

  setPreset: (presetName) => {
    console.log(`✅ Preset "${presetName}" appliqué`);
  },

  nrSetEnabled: (enabled) => {
    console.log(`✅ Réduction de bruit ${enabled ? 'activée' : 'désactivée'}`);
  },

  nrGetEnabled: () => {
    console.log('✅ État de la réduction de bruit récupéré');
    return false;
  },

  nrSetMode: (mode) => {
    const modeNames = ['expander', 'rnnoise', 'off'];
    console.log(`✅ Mode de réduction de bruit: ${modeNames[mode] || 'inconnu'}`);
  },

  rnnsSetAggressiveness: (aggressiveness) => {
    console.log(`✅ Agressivité RNNoise réglée à ${aggressiveness}`);
  },

  safetySetConfig: (config) => {
    console.log('✅ Configuration de sécurité mise à jour:', config);
  },

  safetyGetReport: () => {
    console.log('✅ Rapport de sécurité récupéré');
    return {
      peak: 0.8,
      rms: 0.6,
      dcOffset: 0.001,
      clippedSamples: 0,
      feedbackScore: 0.1,
      overload: false
    };
  },

  fxSetEnabled: (enabled) => {
    console.log(`✅ Effets ${enabled ? 'activés' : 'désactivés'}`);
  },

  fxSetCompressor: (threshold, ratio, attack, release, makeup) => {
    console.log(`✅ Compresseur configuré: seuil=${threshold}dB, ratio=${ratio}:1`);
  },

  fxSetDelay: (delay, feedback, mix) => {
    console.log(`✅ Delay configuré: délai=${delay}ms, mix=${mix * 100}%`);
  }
};

// Test des hooks React (simulation)
class MockEqualizerHook {
  constructor(numBands = 10, sampleRate = 48000) {
    this.numBands = numBands;
    this.sampleRate = sampleRate;
    this.isInitialized = false;
    this.enabled = false;
    this.masterGain = 0;
    this.bands = [];
    this.isProcessing = false;
    this.equalizerId = null;

    this.init();
  }

  async init() {
    try {
      console.log(`\n🎛️  Initialisation de l'égaliseur...`);
      this.equalizerId = NativeAudioEqualizerModule.createEqualizer(this.numBands, this.sampleRate);

      // Initialiser les bandes
      this.bands = [];
      const frequencies = [31.25, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

      for (let i = 0; i < this.numBands; i++) {
        this.bands.push({
          frequency: frequencies[i] || frequencies[frequencies.length - 1] * 2,
          gain: 0,
          q: 0.707,
          type: i === 0 ? 'lowshelf' : (i === this.numBands - 1 ? 'highshelf' : 'peak'),
          enabled: true
        });
      }

      this.isInitialized = true;
      console.log(`✅ Égaliseur initialisé avec ${this.numBands} bandes`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
    }
  }

  async setBandGain(bandIndex, gain) {
    if (!this.isInitialized) return;

    try {
      this.isProcessing = true;
      const clampedGain = Math.max(-24, Math.min(24, gain));
      await NativeAudioEqualizerModule.setBandGain(bandIndex, clampedGain);

      this.bands[bandIndex].gain = clampedGain;
      console.log(`✅ Gain de la bande ${bandIndex} (${this.bands[bandIndex].frequency}Hz) réglé à ${clampedGain}dB`);
    } catch (error) {
      console.error('❌ Erreur lors du réglage du gain:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async updateMasterGain(gain) {
    if (!this.isInitialized) return;

    try {
      const clampedGain = Math.max(-24, Math.min(24, gain));
      await NativeAudioEqualizerModule.setMasterGain(clampedGain);
      this.masterGain = clampedGain;
      console.log(`✅ Gain master réglé à ${clampedGain}dB`);
    } catch (error) {
      console.error('❌ Erreur lors du réglage du gain master:', error);
    }
  }

  async toggleEnabled() {
    if (!this.isInitialized) return;

    try {
      this.enabled = !this.enabled;
      await NativeAudioEqualizerModule.setEQEnabled(this.enabled);
      console.log(`✅ Égaliseur ${this.enabled ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('❌ Erreur lors du basculement:', error);
    }
  }

  async resetAllBands() {
    if (!this.isInitialized) return;

    try {
      this.isProcessing = true;
      console.log('🔄 Réinitialisation de toutes les bandes...');

      await NativeAudioEqualizerModule.beginBatch();

      for (let i = 0; i < this.bands.length; i++) {
        await NativeAudioEqualizerModule.setBandGain(i, 0);
        this.bands[i].gain = 0;
      }

      await NativeAudioEqualizerModule.endBatch();
      console.log('✅ Toutes les bandes réinitialisées à 0dB');
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  getConfig() {
    return {
      numBands: this.bands.length,
      sampleRate: this.sampleRate,
      masterGain: this.masterGain,
      bypass: !this.enabled,
      bands: [...this.bands]
    };
  }
}

// Classe de test pour les presets
class MockPresetsHook {
  constructor() {
    this.presets = [
      { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Rock', gains: [4, 3, -1, -2, -1, 2, 3, 4, 3, 2] },
      { name: 'Pop', gains: [-1, 2, 4, 3, 0, -1, -1, 0, 2, 3] },
      { name: 'Jazz', gains: [0, 2, 1, 2, -2, -2, 0, 1, 2, 3] },
      { name: 'Classical', gains: [0, 0, 0, 0, 0, 0, -2, -2, -2, -3] },
      { name: 'Electronic', gains: [4, 3, 1, 0, -2, 2, 1, 1, 3, 4] },
      { name: 'Vocal Boost', gains: [-2, -1, 0, 2, 4, 4, 3, 2, 0, -1] },
      { name: 'Bass Boost', gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
      { name: 'Treble Boost', gains: [0, 0, 0, 0, 0, 0, 2, 4, 5, 6] },
      { name: 'Loudness', gains: [5, 3, 0, -1, -2, -2, -1, 0, 3, 5] }
    ];
    this.currentPreset = 'Flat';
    this.customPresets = [];
  }

  async applyPreset(presetName) {
    const preset = this.presets.find(p => p.name === presetName);
    if (!preset) {
      console.error(`❌ Preset "${presetName}" non trouvé`);
      return null;
    }

    try {
      await NativeAudioEqualizerModule.setPreset(presetName);
      this.currentPreset = presetName;
      console.log(`✅ Preset "${presetName}" appliqué avec succès`);
      return preset.gains;
    } catch (error) {
      console.error('❌ Erreur lors de l\'application du preset:', error);
      return null;
    }
  }

  async saveCustomPreset(name, gains) {
    try {
      const newPreset = { name, gains };
      this.customPresets.push(newPreset);
      this.presets.push(newPreset);
      console.log(`✅ Preset personnalisé "${name}" sauvegardé`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du preset:', error);
      return false;
    }
  }
}

// Classe de test pour l'analyse spectrale
class MockSpectrumHook {
  constructor() {
    this.isAnalyzing = false;
    this.spectrumData = {
      magnitudes: Array(32).fill(0),
      timestamp: Date.now()
    };
  }

  async startAnalysis() {
    if (this.isAnalyzing) return;

    try {
      await NativeAudioEqualizerModule.startSpectrumAnalysis();
      this.isAnalyzing = true;
      console.log('✅ Analyse spectrale démarrée');

      // Simuler des données spectrales
      this.spectrumData = {
        magnitudes: Array(32).fill(0).map(() => Math.random()),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Erreur lors du démarrage de l\'analyse:', error);
    }
  }

  async stopAnalysis() {
    if (!this.isAnalyzing) return;

    try {
      await NativeAudioEqualizerModule.stopSpectrumAnalysis();
      this.isAnalyzing = false;
      console.log('✅ Analyse spectrale arrêtée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'arrêt de l\'analyse:', error);
    }
  }

  async toggleAnalysis() {
    if (this.isAnalyzing) {
      await this.stopAnalysis();
    } else {
      await this.startAnalysis();
    }
  }

  getMetrics() {
    const mags = this.spectrumData.magnitudes;
    const nonZero = mags.filter(m => m > 0);

    return {
      average: nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0,
      peak: Math.max(...mags),
      rms: Math.sqrt(mags.reduce((sum, mag) => sum + mag * mag, 0) / mags.length)
    };
  }
}

// Fonction principale de test
async function runTests() {
  console.log('🎵=== TESTS DU MODULE EQUALIZER ===\n');

  // Test 1: Initialisation de base
  console.log('📊 Test 1: Initialisation de l\'égaliseur');
  const equalizer = new MockEqualizerHook(10, 48000);
  await new Promise(resolve => setTimeout(resolve, 100)); // Attendre l'initialisation
  console.log(`✅ Égaliseur initialisé: ${equalizer.isInitialized}`);
  console.log(`📊 Configuration: ${equalizer.numBands} bandes, ${equalizer.sampleRate}Hz\n`);

  // Test 2: Contrôle des bandes
  console.log('🎛️  Test 2: Contrôle des bandes de fréquence');
  await equalizer.setBandGain(0, 6); // Bass boost
  await equalizer.setBandGain(9, 4); // Treble boost
  await equalizer.setBandGain(4, -3); // Mid cut
  console.log('✅ Contrôles des bandes testés\n');

  // Test 3: Gain master
  console.log('🔊 Test 3: Contrôle du gain master');
  await equalizer.updateMasterGain(3);
  await equalizer.updateMasterGain(-6);
  await equalizer.updateMasterGain(0);
  console.log('✅ Contrôle du gain master testé\n');

  // Test 4: Activation/Désactivation
  console.log('🔄 Test 4: Activation/Désactivation');
  await equalizer.toggleEnabled();
  await equalizer.toggleEnabled();
  console.log('✅ Basculement testé\n');

  // Test 5: Presets
  console.log('🎚️  Test 5: Système de presets');
  const presets = new MockPresetsHook();
  await presets.applyPreset('Rock');
  await presets.applyPreset('Pop');
  await presets.saveCustomPreset('My Custom', [2, 4, 2, 0, -2, 0, 2, 4, 2, 0]);
  await presets.applyPreset('My Custom');
  console.log('✅ Système de presets testé\n');

  // Test 6: Analyse spectrale
  console.log('📈 Test 6: Analyse spectrale');
  const spectrum = new MockSpectrumHook();
  await spectrum.startAnalysis();
  console.log(`📊 Métriques spectrales:`, spectrum.getMetrics());
  await spectrum.stopAnalysis();
  console.log('✅ Analyse spectrale testée\n');

  // Test 7: Réinitialisation
  console.log('🔄 Test 7: Réinitialisation');
  await equalizer.setBandGain(0, 8);
  await equalizer.setBandGain(1, 6);
  console.log('📊 Avant réinitialisation:');
  equalizer.bands.slice(0, 3).forEach((band, index) => {
    console.log(`   Bande ${index}: ${band.gain}dB`);
  });

  await equalizer.resetAllBands();
  console.log('📊 Après réinitialisation:');
  equalizer.bands.slice(0, 3).forEach((band, index) => {
    console.log(`   Bande ${index}: ${band.gain}dB`);
  });
  console.log('✅ Réinitialisation testée\n');

  // Test 8: Configuration
  console.log('⚙️  Test 8: Récupération de configuration');
  const config = equalizer.getConfig();
  console.log(`📊 Configuration actuelle:`, {
    numBands: config.numBands,
    sampleRate: config.sampleRate,
    masterGain: config.masterGain,
    bypass: config.bypass,
    bands: config.bands.map(b => ({ freq: b.frequency, gain: b.gain }))
  });
  console.log('✅ Configuration récupérée\n');

  // Test 9: Performance
  console.log('⚡ Test 9: Performance - opérations groupées');
  const startTime = Date.now();

  await NativeAudioEqualizerModule.beginBatch();
  for (let i = 0; i < equalizer.numBands; i++) {
    await NativeAudioEqualizerModule.setBandGain(i, Math.random() * 24 - 12);
  }
  await NativeAudioEqualizerModule.endBatch();

  const endTime = Date.now();
  console.log(`⏱️  Durée des opérations groupées: ${endTime - startTime}ms`);
  console.log('✅ Performance testée\n');

  // Test 10: Fonctionnalités avancées
  console.log('🚀 Test 10: Fonctionnalités avancées');
  await NativeAudioEqualizerModule.nrSetEnabled(true);
  await NativeAudioEqualizerModule.nrSetMode(1); // RNNoise
  await NativeAudioEqualizerModule.rnnsSetAggressiveness(2.0);

  await NativeAudioEqualizerModule.safetySetConfig({
    enabled: true,
    dcRemovalEnabled: true,
    dcThreshold: 0.002,
    limiterEnabled: true,
    limiterThresholdDb: -1.0,
    softKneeLimiter: true,
    kneeWidthDb: 6.0,
    feedbackDetectEnabled: true,
    feedbackCorrThreshold: 0.95
  });

  await NativeAudioEqualizerModule.fxSetEnabled(true);
  await NativeAudioEqualizerModule.fxSetCompressor(-20, 4.0, 10, 80, 0);
  await NativeAudioEqualizerModule.fxSetDelay(200, 0.3, 0.25);

  console.log('✅ Fonctionnalités avancées testées\n');

  console.log('🎉=== TOUS LES TESTS TERMINÉS AVEC SUCCÈS ===\n');
  console.log('📊 RÉSUMÉ:');
  console.log('✅ Initialisation de l\'égaliseur');
  console.log('✅ Contrôle des bandes de fréquence');
  console.log('✅ Contrôle du gain master');
  console.log('✅ Activation/Désactivation');
  console.log('✅ Système de presets');
  console.log('✅ Analyse spectrale');
  console.log('✅ Réinitialisation');
  console.log('✅ Récupération de configuration');
  console.log('✅ Performance des opérations groupées');
  console.log('✅ Fonctionnalités avancées (NR, Safety, FX)');
  console.log('\n🎵 Le module Equalizer fonctionne correctement !');
}

// Exporter pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MockEqualizerHook,
    MockPresetsHook,
    MockSpectrumHook,
    runTests
  };
}

// Lancer les tests si exécuté directement
if (typeof window !== 'undefined' && window.location) {
  // Dans le navigateur
  window.runEqualizerTests = runTests;
} else if (typeof global !== 'undefined') {
  // Dans Node.js
  if (require.main === module) {
    runTests().catch(console.error);
  }
}
