# 📝 Exemples d'utilisation - Effets Audio

## Vue d'ensemble

Cette section présente des exemples pratiques d'utilisation du système d'effets audio dans différentes situations courantes.

## 🎵 Exemple 1 : Configuration basique d'un compresseur

### Objectif

Créer et configurer un compresseur simple pour contrôler les niveaux audio.

```javascript
import { NativeAudioEffectsModule } from './native-modules';

class BasicCompressor {
  constructor() {
    this.effectsModule = new NativeAudioEffectsModule();
    this.compressorId = null;
    this.isInitialized = false;
  }

  // Initialisation du système
  async initialize() {
    try {
      const success = await this.effectsModule.initialize();
      if (!success) {
        throw new Error("Échec de l'initialisation du module");
      }

      // Configuration du compresseur
      this.compressorId = await this.effectsModule.createEffect({
        type: 'compressor',
        parameters: {
          thresholdDb: -10.0, // Seuil à -10 dB
          ratio: 4.0, // Ratio 4:1
          attackMs: 10.0, // Attack rapide
          releaseMs: 100.0, // Release moyenne
          makeupDb: 0.0, // Pas de makeup gain
        },
        enabled: true,
      });

      if (this.compressorId === -1) {
        throw new Error('Échec de la création du compresseur');
      }

      this.isInitialized = true;
      console.log('Compresseur initialisé avec succès');
    } catch (error) {
      console.error("Erreur d'initialisation:", error);
      throw error;
    }
  }

  // Traitement audio
  async processAudio(audioBuffer) {
    if (!this.isInitialized) {
      throw new Error('Module non initialisé');
    }

    try {
      const processedBuffer = await this.effectsModule.processAudio(
        audioBuffer,
        1, // Mono
      );

      return processedBuffer;
    } catch (error) {
      console.error('Erreur de traitement:', error);
      return audioBuffer; // Retour buffer original en cas d'erreur
    }
  }

  // Nettoyage
  async dispose() {
    if (this.compressorId !== null) {
      await this.effectsModule.destroyEffect(this.compressorId);
      this.compressorId = null;
    }

    await this.effectsModule.dispose();
    this.isInitialized = false;
  }
}

// Utilisation
const compressor = new BasicCompressor();
await compressor.initialize();

// Traitement d'un buffer audio
const inputBuffer = [0.1, 0.5, 0.8, 0.3, 0.1];
const outputBuffer = await compressor.processAudio(inputBuffer);

console.log('Buffer traité:', outputBuffer);

// Nettoyage
await compressor.dispose();
```

## 🎛️ Exemple 2 : Chaîne d'effets complète

### Objectif

Créer une chaîne d'effets avec compresseur et delay pour un effet professionnel.

```javascript
class ProfessionalAudioChain {
  constructor() {
    this.effectsModule = new NativeAudioEffectsModule();
    this.compressorId = null;
    this.delayId = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialisation du module
      await this.effectsModule.initialize();

      // Configuration du compresseur
      this.compressorId = await this.effectsModule.createEffect({
        type: 'compressor',
        parameters: {
          thresholdDb: -6.0, // Seuil plus sensible
          ratio: 6.0, // Compression plus agressive
          attackMs: 5.0, // Attack très rapide
          releaseMs: 150.0, // Release plus lente
          makeupDb: 3.0, // Makeup gain pour compenser
        },
        enabled: true,
      });

      // Configuration du delay
      this.delayId = await this.effectsModule.createEffect({
        type: 'delay',
        parameters: {
          delayMs: 300.0, // Delay rythmique
          feedback: 0.4, // Feedback modéré
          mix: 0.3, // Mix subtil
        },
        enabled: true,
      });

      if (this.compressorId === -1 || this.delayId === -1) {
        throw new Error('Échec de la création des effets');
      }

      this.isInitialized = true;
      console.log("Chaîne d'effets initialisée");
    } catch (error) {
      console.error("Erreur d'initialisation:", error);
      throw error;
    }
  }

  // Traitement audio stéréo
  async processAudio(leftChannel, rightChannel) {
    if (!this.isInitialized) {
      throw new Error('Module non initialisé');
    }

    try {
      const result = await this.effectsModule.processAudioStereo(
        leftChannel,
        rightChannel,
      );

      return {
        left: result.left,
        right: result.right,
      };
    } catch (error) {
      console.error('Erreur de traitement:', error);
      // Retour des buffers originaux en cas d'erreur
      return {
        left: leftChannel,
        right: rightChannel,
      };
    }
  }

  // Ajustement dynamique des paramètres
  async adjustForLoudness() {
    if (!this.isInitialized) return;

    // Récupération des métriques actuelles
    const compressorMetrics = await this.effectsModule.getCompressorMetrics(
      this.compressorId,
    );

    if (compressorMetrics) {
      // Ajustement adaptatif du seuil basé sur le niveau d'entrée
      const currentInputLevel = compressorMetrics.inputLevel;

      if (currentInputLevel > -6.0) {
        // Signal fort - compression plus agressive
        await this.effectsModule.updateEffect(this.compressorId, {
          thresholdDb: -3.0,
          ratio: 8.0,
        });
      } else if (currentInputLevel < -20.0) {
        // Signal faible - compression plus douce
        await this.effectsModule.updateEffect(this.compressorId, {
          thresholdDb: -12.0,
          ratio: 4.0,
        });
      }
    }
  }

  // Nettoyage
  async dispose() {
    const effects = [this.compressorId, this.delayId].filter(id => id !== null);

    for (const effectId of effects) {
      await this.effectsModule.destroyEffect(effectId);
    }

    await this.effectsModule.dispose();
    this.isInitialized = false;
  }
}

// Utilisation avancée
const audioChain = new ProfessionalAudioChain();
await audioChain.initialize();

// Traitement audio stéréo
const leftInput = [0.1, 0.3, 0.5, 0.2];
const rightInput = [0.1, 0.2, 0.4, 0.3];

const processed = await audioChain.processAudio(leftInput, rightInput);
console.log('Audio stéréo traité:', processed);

// Ajustement adaptatif
await audioChain.adjustForLoudness();

// Nettoyage
await audioChain.dispose();
```

## 📊 Exemple 3 : Monitoring temps réel

### Objectif

Surveiller les performances et métriques du système en temps réel.

```javascript
class AudioEffectsMonitor {
  constructor() {
    this.effectsModule = new NativeAudioEffectsModule();
    this.monitoring = false;
    this.effects = new Map();
  }

  async initialize() {
    try {
      await this.effectsModule.initialize();

      // Configuration des callbacks
      this.setupCallbacks();

      console.log("Moniteur d'effets initialisé");
    } catch (error) {
      console.error("Erreur d'initialisation du moniteur:", error);
      throw error;
    }
  }

  setupCallbacks() {
    // Callback d'erreur
    this.effectsModule.setErrorCallback(error => {
      console.error("Erreur d'effet:", {
        code: error.code,
        message: error.message,
        effectId: error.effectId,
      });
    });

    // Callback de changement d'état
    this.effectsModule.setStateChangeCallback(state => {
      console.log("Changement d'état:", {
        ancien: state.oldState,
        nouveau: state.newState,
        timestamp: new Date(state.timestamp),
      });
    });

    // Callback de traitement
    this.effectsModule.setProcessingCallback(event => {
      if (event.type === 'processing_complete') {
        this.logMetrics(event.effectId, event.metrics);
      }
    });
  }

  logMetrics(effectId, metrics) {
    console.log(`Métriques effet ${effectId}:`, {
      niveauEntree: `${metrics.inputLevel?.toFixed(2)} dB`,
      niveauSortie: `${metrics.outputLevel?.toFixed(2)} dB`,
      tempsTraitement: `${metrics.processingTime?.toFixed(2)} ms`,
      latence: metrics.latency ? `${metrics.latency.toFixed(2)} ms` : 'N/A',
    });
  }

  async startMonitoring(intervalMs = 1000) {
    this.monitoring = true;

    const monitoringLoop = async () => {
      if (!this.monitoring) return;

      try {
        // Statistiques générales
        const stats = await this.effectsModule.getStatistics();
        if (stats) {
          console.log('Statistiques système:', {
            tempsTraitement: `${stats.processingTime?.toFixed(2)} ms`,
            utilisationCPU: `${stats.cpuUsage?.toFixed(1)}%`,
            effetsActifs: stats.activeEffects,
            tailleBuffer: stats.bufferSize,
          });
        }

        // Métriques par effet
        for (const [name, id] of this.effects) {
          const config = await this.effectsModule.getEffectConfig(id);
          const enabled = await this.effectsModule.isEffectEnabled(id);

          console.log(`Effet ${name} (${id}):`, {
            actif: enabled,
            type: config?.type,
            parametres: config?.parameters,
          });
        }

        // Planifier la prochaine itération
        setTimeout(monitoringLoop, intervalMs);
      } catch (error) {
        console.error('Erreur de monitoring:', error);
        setTimeout(monitoringLoop, intervalMs);
      }
    };

    monitoringLoop();
  }

  stopMonitoring() {
    this.monitoring = false;
  }

  async createMonitoredEffect(name, config) {
    const effectId = await this.effectsModule.createEffect(config);
    if (effectId !== -1) {
      this.effects.set(name, effectId);
      console.log(`Effet surveillé créé: ${name} (ID: ${effectId})`);
    }
    return effectId;
  }

  async dispose() {
    this.stopMonitoring();

    // Destruction de tous les effets
    for (const [name, id] of this.effects) {
      await this.effectsModule.destroyEffect(id);
      console.log(`Effet détruit: ${name}`);
    }

    this.effects.clear();
    await this.effectsModule.dispose();
  }
}

// Utilisation du moniteur
const monitor = new AudioEffectsMonitor();
await monitor.initialize();

// Création d'effets surveillés
const compId = await monitor.createMonitoredEffect('compresseur', {
  type: 'compressor',
  parameters: {
    thresholdDb: -10.0,
    ratio: 4.0,
    attackMs: 10.0,
    releaseMs: 100.0,
  },
});

const delayId = await monitor.createMonitoredEffect('delay', {
  type: 'delay',
  parameters: {
    delayMs: 200.0,
    feedback: 0.3,
    mix: 0.4,
  },
});

// Démarrage du monitoring
monitor.startMonitoring(2000); // Toutes les 2 secondes

// Simulation de traitement audio
setInterval(async () => {
  const testBuffer = Array.from(
    { length: 1024 },
    () => Math.random() * 0.5 - 0.25,
  );

  try {
    const processed = await monitor.effectsModule.processAudio(testBuffer, 1);
    console.log('Buffer traité avec succès');
  } catch (error) {
    console.error('Erreur de traitement:', error);
  }
}, 5000);

// Nettoyage après 30 secondes
setTimeout(async () => {
  monitor.stopMonitoring();
  await monitor.dispose();
  console.log('Monitoring terminé');
}, 30000);
```

## 🎚️ Exemple 4 : Contrôleur MIDI

### Objectif

Contrôler les effets audio via une interface MIDI pour un contrôle professionnel.

```javascript
class MIDIAudioController {
  constructor() {
    this.effectsModule = new NativeAudioEffectsModule();
    this.effects = new Map();
    this.midiController = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await this.effectsModule.initialize();

      // Création des effets avec mapping MIDI
      await this.setupEffects();

      // Configuration MIDI
      await this.setupMIDI();

      this.isInitialized = true;
      console.log('Contrôleur MIDI initialisé');
    } catch (error) {
      console.error("Erreur d'initialisation MIDI:", error);
      throw error;
    }
  }

  async setupEffects() {
    // Compresseur mappable
    const compId = await this.effectsModule.createEffect({
      type: 'compressor',
      parameters: {
        thresholdDb: -12.0,
        ratio: 4.0,
        attackMs: 15.0,
        releaseMs: 120.0,
        makeupDb: 0.0,
      },
    });

    this.effects.set('compressor', {
      id: compId,
      midiMappings: {
        threshold: { cc: 16, min: -60, max: 0 }, // CC 16
        ratio: { cc: 17, min: 1, max: 20 }, // CC 17
        attack: { cc: 18, min: 0.1, max: 100 }, // CC 18
        release: { cc: 19, min: 0.1, max: 1000 }, // CC 19
        makeup: { cc: 20, min: -20, max: 20 }, // CC 20
      },
    });

    // Delay mappable
    const delayId = await this.effectsModule.createEffect({
      type: 'delay',
      parameters: {
        delayMs: 250.0,
        feedback: 0.35,
        mix: 0.4,
      },
    });

    this.effects.set('delay', {
      id: delayId,
      midiMappings: {
        delayTime: { cc: 21, min: 1, max: 2000 }, // CC 21
        feedback: { cc: 22, min: 0, max: 0.99 }, // CC 22
        mix: { cc: 23, min: 0, max: 1 }, // CC 23
      },
    });
  }

  async setupMIDI() {
    try {
      if (navigator.requestMIDIAccess) {
        const midiAccess = await navigator.requestMIDIAccess();

        for (const input of midiAccess.inputs.values()) {
          input.onmidimessage = this.handleMIDIMessage.bind(this);
          console.log(`Port MIDI connecté: ${input.name}`);
        }
      } else {
        console.warn('Web MIDI non supporté');
      }
    } catch (error) {
      console.error("Erreur d'accès MIDI:", error);
    }
  }

  handleMIDIMessage(message) {
    const [status, controller, value] = message.data;

    // Vérification si c'est un message Control Change (CC)
    if ((status & 0xf0) === 0xb0) {
      this.handleControlChange(controller, value);
    }
  }

  handleControlChange(controller, value) {
    // Conversion de la valeur MIDI (0-127) en valeur normalisée (0-1)
    const normalizedValue = value / 127.0;

    // Recherche de l'effet qui utilise ce contrôleur
    for (const [effectName, effect] of this.effects) {
      for (const [paramName, mapping] of Object.entries(effect.midiMappings)) {
        if (mapping.cc === controller) {
          this.updateEffectParameter(
            effect.id,
            paramName,
            normalizedValue,
            mapping,
          );
          return;
        }
      }
    }
  }

  async updateEffectParameter(effectId, paramName, normalizedValue, mapping) {
    try {
      // Conversion de la valeur normalisée vers la plage du paramètre
      const paramValue =
        mapping.min + (mapping.max - mapping.min) * normalizedValue;

      const updateConfig = {};

      // Mapping des noms de paramètres
      switch (paramName) {
        case 'threshold':
          updateConfig.thresholdDb = paramValue;
          break;
        case 'ratio':
          updateConfig.ratio = paramValue;
          break;
        case 'attack':
          updateConfig.attackMs = paramValue;
          break;
        case 'release':
          updateConfig.releaseMs = paramValue;
          break;
        case 'makeup':
          updateConfig.makeupDb = paramValue;
          break;
        case 'delayTime':
          updateConfig.delayMs = paramValue;
          break;
        case 'feedback':
          updateConfig.feedback = paramValue;
          break;
        case 'mix':
          updateConfig.mix = paramValue;
          break;
      }

      await this.effectsModule.updateEffect(effectId, updateConfig);

      console.log(
        `Paramètre mis à jour: ${paramName} = ${paramValue.toFixed(2)}`,
      );
    } catch (error) {
      console.error('Erreur de mise à jour du paramètre:', error);
    }
  }

  // Méthodes utilitaires
  async getEffectParameters(effectName) {
    const effect = this.effects.get(effectName);
    if (effect) {
      return await this.effectsModule.getEffectConfig(effect.id);
    }
    return null;
  }

  async toggleEffect(effectName) {
    const effect = this.effects.get(effectName);
    if (effect) {
      const isEnabled = await this.effectsModule.isEffectEnabled(effect.id);
      await this.effectsModule.enableEffect(effect.id, !isEnabled);
      console.log(`${effectName} ${!isEnabled ? 'activé' : 'désactivé'}`);
    }
  }

  async dispose() {
    for (const [name, effect] of this.effects) {
      await this.effectsModule.destroyEffect(effect.id);
    }

    this.effects.clear();
    await this.effectsModule.dispose();
    this.isInitialized = false;
  }
}

// Utilisation du contrôleur MIDI
const midiController = new MIDIAudioController();
await midiController.initialize();

// Simulation de messages MIDI (pour test)
function simulateMIDI(cc, value) {
  midiController.handleControlChange(cc, value);
}

// Test des contrôles MIDI
simulateMIDI(16, 64); // CC 16 (threshold) à mi-course
simulateMIDI(17, 96); // CC 17 (ratio) à 75%

// Nettoyage
await midiController.dispose();
```

## 🎵 Exemple 5 : Intégration avec Web Audio

### Objectif

Intégrer le système d'effets avec l'API Web Audio pour une chaîne audio complète.

```javascript
class WebAudioEffectsChain {
  constructor() {
    this.effectsModule = new NativeAudioEffectsModule();
    this.audioContext = null;
    this.source = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialisation du contexte Web Audio
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Initialisation du module d'effets
      await this.effectsModule.initialize();

      // Création des effets
      await this.setupAudioEffects();

      this.isInitialized = true;
      console.log('Chaîne Web Audio initialisée');
    } catch (error) {
      console.error("Erreur d'initialisation Web Audio:", error);
      throw error;
    }
  }

  async setupAudioEffects() {
    // Création d'un processeur audio personnalisé
    await this.audioContext.audioWorklet.addModule('audio-processor.js');

    // Création du noeud de traitement
    this.audioProcessor = new AudioWorkletNode(
      this.audioContext,
      'audio-effects-processor',
    );

    // Configuration du processeur
    this.audioProcessor.port.postMessage({
      type: 'init',
      config: {
        sampleRate: this.audioContext.sampleRate,
        channels: 2,
      },
    });

    // Gestion des messages du processeur
    this.audioProcessor.port.onmessage = event => {
      if (event.data.type === 'processed') {
        // Données traitées reçues
        const processedData = event.data.result;
        // Traitement supplémentaire si nécessaire
      }
    };
  }

  async processWithEffects(audioBuffer) {
    if (!this.isInitialized) {
      throw new Error('Système non initialisé');
    }

    try {
      // Conversion du buffer Web Audio vers format natif
      const channelData = [];
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channelData.push(Array.from(audioBuffer.getChannelData(i)));
      }

      // Traitement avec les effets natifs
      const processedData = await this.effectsModule.processAudioStereo(
        channelData[0] || [],
        channelData[1] || [],
      );

      // Conversion vers buffer Web Audio de sortie
      const outputBuffer = this.audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate,
      );

      // Copie des données traitées
      if (processedData.left) {
        outputBuffer.copyToChannel(new Float32Array(processedData.left), 0);
      }
      if (processedData.right) {
        outputBuffer.copyToChannel(new Float32Array(processedData.right), 1);
      }

      return outputBuffer;
    } catch (error) {
      console.error('Erreur de traitement Web Audio:', error);
      return audioBuffer; // Retour buffer original en cas d'erreur
    }
  }

  async loadAudioFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async event => {
        try {
          const arrayBuffer = event.target.result;
          const audioBuffer = await this.audioContext.decodeAudioData(
            arrayBuffer,
          );
          resolve(audioBuffer);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  }

  async playProcessedAudio(audioBuffer) {
    try {
      // Traitement du buffer
      const processedBuffer = await this.processWithEffects(audioBuffer);

      // Création de la source
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = processedBuffer;

      // Connexion à la destination
      this.source.connect(this.audioContext.destination);

      // Lecture
      this.source.start();

      return true;
    } catch (error) {
      console.error('Erreur de lecture audio:', error);
      return false;
    }
  }

  stopPlayback() {
    if (this.source) {
      try {
        this.source.stop();
      } catch (error) {
        // Source déjà arrêtée
      }
      this.source = null;
    }
  }

  async dispose() {
    this.stopPlayback();

    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }

    await this.effectsModule.dispose();

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.isInitialized = false;
  }
}

// Utilisation avec Web Audio
const audioChain = new WebAudioEffectsChain();
await audioChain.initialize();

// Gestionnaire de fichier audio
document.getElementById('audioFile').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (file) {
    try {
      // Chargement du fichier
      const audioBuffer = await audioChain.loadAudioFile(file);

      // Lecture avec effets
      await audioChain.playProcessedAudio(audioBuffer);

      console.log('Audio joué avec effets');
    } catch (error) {
      console.error('Erreur de traitement audio:', error);
    }
  }
});

// Bouton d'arrêt
document.getElementById('stopButton').addEventListener('click', () => {
  audioChain.stopPlayback();
});

// Nettoyage
window.addEventListener('beforeunload', async () => {
  await audioChain.dispose();
});
```

## 📋 Exemple 6 : Tests et validation

### Objectif

Créer des tests automatisés pour valider le fonctionnement du système d'effets.

```javascript
class AudioEffectsTester {
  constructor() {
    this.effectsModule = new NativeAudioEffectsModule();
    this.testResults = [];
  }

  async runAllTests() {
    console.log("🚀 Démarrage des tests d'effets audio...\n");

    try {
      await this.initializeModule();

      await this.testBasicInitialization();
      await this.testEffectCreation();
      await this.testParameterValidation();
      await this.testAudioProcessing();
      await this.testPerformanceMetrics();
      await this.testErrorHandling();

      this.displayResults();
    } catch (error) {
      console.error('❌ Erreur lors des tests:', error);
    } finally {
      await this.cleanup();
    }
  }

  async initializeModule() {
    console.log('📋 Test: Initialisation du module');
    const success = await this.effectsModule.initialize();
    this.assert(success, 'Module initialisé avec succès');
  }

  async testBasicInitialization() {
    console.log("\n📋 Test: Vérification de l'état initial");

    const isInitialized = await this.effectsModule.isInitialized();
    this.assert(isInitialized, 'Module signalé comme initialisé');

    const state = await this.effectsModule.getState();
    this.assert(state === 'initialized', `État correct: ${state}`);
  }

  async testEffectCreation() {
    console.log("\n📋 Test: Création d'effets");

    // Test création compresseur
    const compId = await this.effectsModule.createEffect({
      type: 'compressor',
      parameters: {
        thresholdDb: -10.0,
        ratio: 4.0,
      },
    });

    this.assert(compId !== -1, `Compresseur créé avec ID: ${compId}`);

    // Test création delay
    const delayId = await this.effectsModule.createEffect({
      type: 'delay',
      parameters: {
        delayMs: 100.0,
        feedback: 0.5,
      },
    });

    this.assert(delayId !== -1, `Delay créé avec ID: ${delayId}`);

    // Vérification du nombre d'effets actifs
    const activeCount = await this.effectsModule.getActiveEffectsCount();
    this.assert(
      activeCount === 2,
      `Nombre d'effets actifs correct: ${activeCount}`,
    );

    // Nettoyage
    await this.effectsModule.destroyEffect(compId);
    await this.effectsModule.destroyEffect(delayId);
  }

  async testParameterValidation() {
    console.log('\n📋 Test: Validation des paramètres');

    // Test paramètres invalides
    try {
      await this.effectsModule.createEffect({
        type: 'compressor',
        parameters: {
          thresholdDb: 100.0, // Invalide
          ratio: -1.0, // Invalide
        },
      });
      this.assert(false, 'Devrait rejeter les paramètres invalides');
    } catch (error) {
      this.assert(true, 'Paramètres invalides correctement rejetés');
    }
  }

  async testAudioProcessing() {
    console.log('\n📋 Test: Traitement audio');

    const compId = await this.effectsModule.createEffect({
      type: 'compressor',
      parameters: {
        thresholdDb: -6.0,
        ratio: 4.0,
      },
    });

    // Buffer de test
    const testBuffer = [0.1, 0.5, 0.8, 0.3, 0.1];

    // Traitement
    const processedBuffer = await this.effectsModule.processAudio(
      testBuffer,
      1,
    );

    this.assert(Array.isArray(processedBuffer), 'Buffer traité retourné');

    this.assert(
      processedBuffer.length === testBuffer.length,
      'Longueur du buffer préservée',
    );

    this.assert(processedBuffer !== testBuffer, 'Nouveau buffer créé');

    await this.effectsModule.destroyEffect(compId);
  }

  async testPerformanceMetrics() {
    console.log('\n📋 Test: Métriques de performance');

    const compId = await this.effectsModule.createEffect({
      type: 'compressor',
      parameters: {
        thresholdDb: -12.0,
        ratio: 6.0,
      },
    });

    // Génération d'un buffer plus grand pour test
    const largeBuffer = Array.from(
      { length: 4096 },
      () => Math.random() * 0.8 - 0.4,
    );

    const startTime = performance.now();

    for (let i = 0; i < 10; i++) {
      await this.effectsModule.processAudio(largeBuffer, 1);
    }

    const endTime = performance.now();
    const avgProcessingTime = (endTime - startTime) / 10;

    console.log(
      `   Temps de traitement moyen: ${avgProcessingTime.toFixed(2)} ms`,
    );

    // Récupération des métriques
    const stats = await this.effectsModule.getStatistics();

    if (stats) {
      this.assert(
        typeof stats.processingTime === 'number',
        'Métriques de traitement disponibles',
      );

      console.log(`   Métriques système:`, {
        processingTime: `${stats.processingTime?.toFixed(2)} ms`,
        cpuUsage: `${stats.cpuUsage?.toFixed(1)}%`,
        activeEffects: stats.activeEffects,
      });
    }

    await this.effectsModule.destroyEffect(compId);
  }

  async testErrorHandling() {
    console.log("\n📋 Test: Gestion d'erreurs");

    // Test destruction d'effet inexistant
    const result = await this.effectsModule.destroyEffect(999);
    this.assert(!result, "Destruction d'effet inexistant gérée");

    // Test accès à effet inexistant
    try {
      await this.effectsModule.getEffectConfig(999);
      this.assert(false, "Devrait rejeter l'accès à un effet inexistant");
    } catch (error) {
      this.assert(true, 'Accès à effet inexistant correctement rejeté');
    }
  }

  assert(condition, message) {
    const result = {
      test: message,
      passed: condition,
      timestamp: new Date().toISOString(),
    };

    this.testResults.push(result);

    if (condition) {
      console.log(`   ✅ ${message}`);
    } else {
      console.log(`   ❌ ${message}`);
    }
  }

  displayResults() {
    console.log('\n📊 RÉSULTATS DES TESTS');

    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;

    console.log(
      `\nTests réussis: ${passed}/${total} (${((passed / total) * 100).toFixed(
        1,
      )}%)`,
    );

    if (passed === total) {
      console.log('🎉 Tous les tests ont réussi!');
    } else {
      console.log('\n❌ Tests échoués:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`   - ${result.test}`);
        });
    }
  }

  async cleanup() {
    console.log('\n🧹 Nettoyage...');
    await this.effectsModule.dispose();
  }
}

// Exécution des tests
const tester = new AudioEffectsTester();
await tester.runAllTests();
```

## 💡 Meilleures pratiques

### Gestion des erreurs

```javascript
// Toujours envelopper les appels dans des try-catch
async function safeAudioProcessing(audioBuffer) {
  try {
    const processed = await effectsModule.processAudio(audioBuffer, 1);
    return processed;
  } catch (error) {
    console.error('Erreur de traitement audio:', error);

    // Fallback: retourner le buffer original
    return audioBuffer;
  }
}
```

### Optimisation des performances

```javascript
// Traiter les buffers par blocs pour éviter la surcharge
const BUFFER_SIZE = 1024;
const OVERLAP = 128;

async function processLargeBuffer(audioBuffer) {
  const results = [];

  for (let i = 0; i < audioBuffer.length; i += BUFFER_SIZE - OVERLAP) {
    const chunk = audioBuffer.slice(i, i + BUFFER_SIZE);
    const processedChunk = await effectsModule.processAudio(chunk, 1);
    results.push(processedChunk);
  }

  // Recombiner les chunks traités
  return results.flat();
}
```

### Gestion des ressources

```javascript
// Utiliser un gestionnaire de contexte pour garantir le nettoyage
class EffectsContext {
  constructor() {
    this.effectsModule = new NativeAudioEffectsModule();
    this.effects = [];
  }

  async __aenter__() {
    await this.effectsModule.initialize();
    return this;
  }

  async __aexit__(type, value, traceback) {
    // Nettoyage automatique
    for (const effectId of this.effects) {
      await this.effectsModule.destroyEffect(effectId);
    }
    await this.effectsModule.dispose();
  }

  async createEffect(config) {
    const effectId = await this.effectsModule.createEffect(config);
    this.effects.push(effectId);
    return effectId;
  }
}

// Utilisation avec async context manager (Python-like)
const async with = async (contextManager, callback) => {
  const context = await contextManager.__aenter__();
  try {
    return await callback(context);
  } finally {
    await contextManager.__aexit__(null, null, null);
  }
};

// Exemple d'utilisation
const result = await with(new EffectsContext(), async (ctx) => {
  const compId = await ctx.createEffect({ type: 'compressor' });
  return await ctx.effectsModule.processAudio(buffer, 1);
});
```

---

**Note** : Ces exemples peuvent être adaptés selon vos besoins spécifiques. Ils illustrent les patterns de conception recommandés et les meilleures pratiques pour l'utilisation du système d'effets audio.
