/**
 * Exemple d'utilisation du pipeline audio intégré
 * 
 * Démontre comment le module capture/ fonctionne avec :
 * - core/ : Equalizer et filtres biquad
 * - effects/ : Chaîne d'effets audio
 * - noise/ : Réduction de bruit
 * - safety/ : Limiteur de sécurité
 * - fft/ : Analyse spectrale
 * - utils/ : Buffers et utilitaires
 */

#include "../AudioPipeline.hpp"
#include <iostream>
#include <thread>
#include <chrono>

using namespace Nyth::Audio;
using namespace std::chrono_literals;

// Callback pour visualiser le spectre FFT
void onFFTAnalysis(const float* magnitudes, size_t binCount, float sampleRate) {
    // Afficher les 10 premières bandes de fréquence
    std::cout << "FFT Spectrum: ";
    for (size_t i = 0; i < std::min(size_t(10), binCount); ++i) {
        float freq = (i * sampleRate) / (2.0f * binCount);
        float dbLevel = 20.0f * std::log10(magnitudes[i] + 1e-10f);
        std::cout << freq << "Hz:" << dbLevel << "dB ";
    }
    std::cout << std::endl;
}

// Callback pour traiter les données audio finales
void onProcessedAudio(const float* data, size_t frameCount, int channels) {
    // Calculer le niveau RMS
    float sum = 0.0f;
    size_t sampleCount = frameCount * channels;
    for (size_t i = 0; i < sampleCount; ++i) {
        sum += data[i] * data[i];
    }
    float rms = std::sqrt(sum / sampleCount);
    float rmsDb = 20.0f * std::log10(rms + 1e-10f);
    
    std::cout << "Processed Audio - RMS: " << rmsDb << " dB, Frames: " << frameCount << std::endl;
}

int main() {
    std::cout << "=== Exemple d'intégration du pipeline audio ===" << std::endl;
    
    // 1. Créer et configurer le pipeline
    AudioPipeline pipeline;
    
    AudioPipeline::Config config;
    
    // Configuration de la capture
    config.captureConfig.sampleRate = 44100;
    config.captureConfig.channelCount = 2;  // Stéréo
    config.captureConfig.bitsPerSample = 16;
    config.captureConfig.bufferSizeFrames = 1024;
    
    // Activer tous les modules de traitement
    config.enableEqualizer = true;         // core/AudioEqualizer
    config.enableNoiseReduction = true;    // noise/NoiseReduction
    config.enableEffects = true;           // effects/AudioEffects
    config.enableSafetyLimiter = true;     // safety/AudioSafety
    config.enableFFTAnalysis = true;       // fft/AudioFFT
    
    // Configuration du limiteur de sécurité
    config.safetyLimiterThreshold = 0.95f; // Limite à -0.5 dB
    config.noiseReductionStrength = 0.3f;  // Réduction de bruit modérée
    
    // 2. Initialiser le pipeline
    if (!pipeline.initialize(config)) {
        std::cerr << "Erreur: Impossible d'initialiser le pipeline audio" << std::endl;
        return 1;
    }
    
    std::cout << "Pipeline audio initialisé avec succès!" << std::endl;
    std::cout << "Modules activés:" << std::endl;
    std::cout << "  - Capture audio (capture/)" << std::endl;
    std::cout << "  - Equalizer 10 bandes (core/)" << std::endl;
    std::cout << "  - Réduction de bruit (noise/)" << std::endl;
    std::cout << "  - Chaîne d'effets (effects/)" << std::endl;
    std::cout << "  - Limiteur de sécurité (safety/)" << std::endl;
    std::cout << "  - Analyse FFT (fft/)" << std::endl;
    
    // 3. Configurer l'égaliseur avec un preset
    pipeline.loadEqualizerPreset("Rock");
    
    // Ou configurer manuellement les bandes
    pipeline.setEqualizerBand(0, 60.0f, 3.0f, 0.7f);    // Boost basses @ 60Hz
    pipeline.setEqualizerBand(1, 250.0f, 1.5f, 0.7f);   // Légère augmentation @ 250Hz
    pipeline.setEqualizerBand(2, 1000.0f, 0.0f, 0.7f);  // Neutre @ 1kHz
    pipeline.setEqualizerBand(3, 4000.0f, 2.0f, 0.7f);  // Boost présence @ 4kHz
    pipeline.setEqualizerBand(4, 10000.0f, 1.0f, 0.7f); // Légère augmentation aigus @ 10kHz
    
    // 4. Configurer les callbacks
    pipeline.setProcessedDataCallback(onProcessedAudio);
    pipeline.setFFTAnalysisCallback(onFFTAnalysis);
    
    // 5. Configurer la taille FFT pour l'analyse spectrale
    pipeline.setFFTSize(2048); // Bonne résolution fréquentielle
    
    // 6. Démarrer l'enregistrement dans un fichier
    std::string outputFile = "output_integrated.wav";
    if (pipeline.startRecording(outputFile)) {
        std::cout << "Enregistrement démarré: " << outputFile << std::endl;
    }
    
    // 7. Démarrer le pipeline
    if (!pipeline.start()) {
        std::cerr << "Erreur: Impossible de démarrer le pipeline" << std::endl;
        return 1;
    }
    
    std::cout << "\nPipeline audio en cours d'exécution..." << std::endl;
    std::cout << "Chaîne de traitement:" << std::endl;
    std::cout << "  Capture -> Noise Reduction -> EQ -> Effects -> Limiter -> Output" << std::endl;
    std::cout << "                                                    |" << std::endl;
    std::cout << "                                                    v" << std::endl;
    std::cout << "                                                FFT Analysis" << std::endl;
    
    // 8. Entraîner le profil de bruit (1 seconde de silence)
    std::cout << "\nEntraînement du profil de bruit (restez silencieux)..." << std::endl;
    pipeline.trainNoiseProfile(1.0f);
    std::this_thread::sleep_for(1s);
    
    // 9. Boucle principale avec monitoring
    for (int i = 0; i < 10; ++i) {
        std::this_thread::sleep_for(1s);
        
        // Afficher les métriques
        float currentLevel = pipeline.getCurrentLevel();
        float peakLevel = pipeline.getPeakLevel();
        bool isClipping = pipeline.isClipping();
        float latency = pipeline.getLatencyMs();
        
        std::cout << "\n--- Métriques (t=" << i+1 << "s) ---" << std::endl;
        std::cout << "Niveau actuel: " << 20.0f * std::log10(currentLevel + 1e-10f) << " dB" << std::endl;
        std::cout << "Niveau crête: " << 20.0f * std::log10(peakLevel + 1e-10f) << " dB" << std::endl;
        std::cout << "Clipping: " << (isClipping ? "OUI" : "NON") << std::endl;
        std::cout << "Latence totale: " << latency << " ms" << std::endl;
        
        // Ajuster dynamiquement les paramètres
        if (i == 5) {
            std::cout << "\n[Changement] Augmentation de la réduction de bruit..." << std::endl;
            pipeline.setNoiseReductionStrength(0.7f);
        }
        
        if (i == 7) {
            std::cout << "\n[Changement] Changement de preset EQ vers 'Jazz'..." << std::endl;
            pipeline.loadEqualizerPreset("Jazz");
        }
    }
    
    // 10. Arrêter l'enregistrement
    pipeline.stopRecording();
    std::cout << "\nEnregistrement terminé: " << outputFile << std::endl;
    
    // 11. Test de pause/reprise
    std::cout << "\nTest pause/reprise..." << std::endl;
    pipeline.pause();
    std::cout << "Pipeline en pause" << std::endl;
    std::this_thread::sleep_for(2s);
    
    pipeline.resume();
    std::cout << "Pipeline repris" << std::endl;
    std::this_thread::sleep_for(2s);
    
    // 12. Arrêter le pipeline
    pipeline.stop();
    std::cout << "\nPipeline arrêté" << std::endl;
    
    // 13. Démonstration du processeur temps réel
    std::cout << "\n=== Test du processeur temps réel ===" << std::endl;
    
    RealtimeAudioProcessor processor;
    RealtimeAudioProcessor::ProcessorConfig procConfig;
    procConfig.sampleRate = 44100;
    procConfig.blockSize = 512;
    procConfig.channelCount = 2;
    
    processor.initialize(procConfig);
    
    // Ajouter des processeurs à la chaîne
    processor.addProcessor([](float* data, size_t frames, int channels) {
        // Processeur 1: Gain de 0.5
        size_t samples = frames * channels;
        for (size_t i = 0; i < samples; ++i) {
            data[i] *= 0.5f;
        }
    });
    
    processor.addProcessor([](float* data, size_t frames, int channels) {
        // Processeur 2: Soft clipping
        size_t samples = frames * channels;
        for (size_t i = 0; i < samples; ++i) {
            data[i] = std::tanh(data[i]);
        }
    });
    
    // Simuler le traitement
    std::vector<float> testData(procConfig.blockSize * procConfig.channelCount, 0.5f);
    processor.process(testData.data(), procConfig.blockSize);
    
    std::cout << "CPU Usage: " << processor.getCpuUsage() << "%" << std::endl;
    std::cout << "Processing Time: " << processor.getProcessingTimeUs() << " µs" << std::endl;
    
    // 14. Test du gestionnaire de session
    std::cout << "\n=== Test du gestionnaire de session ===" << std::endl;
    
    AudioSessionManager& sessionManager = AudioSessionManager::getInstance();
    
    AudioSessionManager::SessionConfig sessionConfig;
    sessionConfig.type = AudioSessionManager::SessionType::Recording;
    sessionConfig.sampleRate = 44100;
    sessionConfig.channelCount = 2;
    sessionConfig.lowLatency = true;
    
    if (sessionManager.hasAudioPermission()) {
        std::cout << "Permission audio accordée" << std::endl;
        
        if (sessionManager.startSession(sessionConfig)) {
            std::cout << "Session audio démarrée" << std::endl;
            
            // Simuler une interruption
            sessionManager.handleInterruption();
            std::cout << "Interruption gérée" << std::endl;
            
            // Simuler un changement de route
            sessionManager.handleRouteChange();
            std::cout << "Changement de route géré" << std::endl;
            
            sessionManager.endSession();
            std::cout << "Session audio terminée" << std::endl;
        }
    } else {
        std::cout << "Permission audio refusée - demande en cours..." << std::endl;
        sessionManager.requestAudioPermission([](bool granted) {
            std::cout << "Permission " << (granted ? "accordée" : "refusée") << std::endl;
        });
    }
    
    std::cout << "\n=== Exemple terminé avec succès ===" << std::endl;
    std::cout << "Le module capture/ est maintenant pleinement intégré avec:" << std::endl;
    std::cout << "  ✓ core/ (Equalizer, Filtres)" << std::endl;
    std::cout << "  ✓ effects/ (Chaîne d'effets)" << std::endl;
    std::cout << "  ✓ noise/ (Réduction de bruit)" << std::endl;
    std::cout << "  ✓ safety/ (Limiteur)" << std::endl;
    std::cout << "  ✓ fft/ (Analyse spectrale)" << std::endl;
    std::cout << "  ✓ utils/ (Buffers)" << std::endl;
    
    return 0;
}