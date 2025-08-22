/**
 * Exemple d'utilisation du système de capture audio Nyth
 * 
 * Cet exemple montre comment:
 * - Configurer la capture audio
 * - Capturer l'audio depuis le microphone
 * - Enregistrer dans un fichier WAV
 * - Monitorer les niveaux audio
 * - Utiliser l'enregistrement circulaire
 */

#include "../AudioCapture.hpp"
#include "../AudioCaptureImpl.hpp"
#include "../AudioFileWriter.hpp"
#include "../AudioFileWriterImpl.hpp"
#include "../AudioCaptureUtils.hpp"

#include <iostream>
#include <thread>
#include <chrono>
#include <iomanip>
#include <signal.h>

using namespace Nyth::Audio;

// Flag global pour l'arrêt
volatile bool g_shouldStop = false;

// Gestionnaire de signal pour Ctrl+C
void signalHandler(int signal) {
    if (signal == SIGINT) {
        std::cout << "\n\nArrêt de l'enregistrement...\n";
        g_shouldStop = true;
    }
}

// Fonction pour afficher les niveaux audio en temps réel
void displayAudioLevels(float rms, float peak) {
    // Convertir en dB
    float rmsDb = Utils::linearToDb(rms);
    float peakDb = Utils::linearToDb(peak);
    
    // Créer une barre de visualisation
    int rmsBar = static_cast<int>((rms * 50));
    int peakBar = static_cast<int>((peak * 50));
    
    std::cout << "\r";
    std::cout << "RMS: " << std::setw(6) << std::fixed << std::setprecision(1) << rmsDb << " dB [";
    for (int i = 0; i < 50; ++i) {
        if (i < rmsBar) std::cout << "=";
        else std::cout << " ";
    }
    std::cout << "] | Peak: " << std::setw(6) << std::fixed << std::setprecision(1) << peakDb << " dB [";
    for (int i = 0; i < 50; ++i) {
        if (i < peakBar) std::cout << "#";
        else std::cout << " ";
    }
    std::cout << "]" << std::flush;
}

// Exemple 1: Capture audio simple avec enregistrement dans fichier
void example1_SimpleRecording() {
    std::cout << "\n=== Exemple 1: Enregistrement Simple ===\n\n";
    
    // Créer l'instance de capture
    auto capture = std::make_unique<AudioCaptureImpl>();
    
    // Configuration
    CaptureConfig config;
    config.sampleRate = 48000;
    config.channels = 2;
    config.bitsPerSample = 16;
    config.bufferSize = 4096;
    
    if (!capture->configure(config)) {
        std::cerr << "Erreur de configuration de la capture\n";
        return;
    }
    
    // Créer le writer pour enregistrer dans un fichier
    AudioFileWriter writer;
    FileWriterConfig writerConfig;
    writerConfig.format = AudioFileFormat::WAV;
    writerConfig.sampleRate = config.sampleRate;
    writerConfig.channels = config.channels;
    writerConfig.bitsPerSample = config.bitsPerSample;
    
    if (!writer.open("recording_simple.wav", writerConfig)) {
        std::cerr << "Erreur d'ouverture du fichier de sortie\n";
        return;
    }
    
    // Configurer le callback pour recevoir les données audio
    capture->setDataCallback([&writer, &capture](const float* data, size_t frames, size_t channels) {
        // Écrire les données dans le fichier
        writer.write(data, frames);
        
        // Afficher les niveaux
        float rms = capture->getRMSLevel();
        float peak = capture->getPeakLevel();
        displayAudioLevels(rms, peak);
    });
    
    // Configurer les callbacks d'événements
    capture->setStateChangeCallback([](CaptureState oldState, CaptureState newState) {
        std::cout << "\nÉtat changé: " << static_cast<int>(oldState) 
                  << " -> " << static_cast<int>(newState) << "\n";
    });
    
    capture->setErrorCallback([](const std::string& error) {
        std::cerr << "\nErreur: " << error << "\n";
    });
    
    // Démarrer la capture
    std::cout << "Démarrage de l'enregistrement (appuyez sur Ctrl+C pour arrêter)...\n";
    
    if (!capture->start()) {
        std::cerr << "Erreur de démarrage de la capture\n";
        return;
    }
    
    // Attendre l'arrêt
    while (!g_shouldStop && capture->isCapturing()) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    
    // Arrêter la capture
    capture->stop();
    writer.close();
    
    // Afficher les statistiques
    auto stats = capture->getStatistics();
    std::cout << "\n\nStatistiques de capture:\n";
    std::cout << "  Échantillons traités: " << stats.samplesProcessed << "\n";
    std::cout << "  Durée: " << Utils::formatTime(stats.captureTimeSeconds) << "\n";
    std::cout << "  Frames perdues: " << stats.droppedFrames << "\n";
    
    auto writerStats = writer.getStats();
    std::cout << "\nStatistiques d'écriture:\n";
    std::cout << "  Octets écrits: " << Utils::formatBytes(writerStats.bytesWritten) << "\n";
    std::cout << "  Durée: " << Utils::formatTime(writerStats.durationSeconds) << "\n";
}

// Exemple 2: Enregistrement circulaire (buffer ring)
void example2_CircularRecording() {
    std::cout << "\n=== Exemple 2: Enregistrement Circulaire ===\n\n";
    std::cout << "Enregistre en continu les 30 dernières secondes\n\n";
    
    // Créer l'instance de capture
    auto capture = std::make_unique<AudioCaptureImpl>();
    
    // Configuration
    CaptureConfig config;
    config.sampleRate = 48000;
    config.channels = 2;
    config.bitsPerSample = 16;
    config.bufferSize = 4096;
    
    if (!capture->configure(config)) {
        std::cerr << "Erreur de configuration de la capture\n";
        return;
    }
    
    // Créer l'enregistreur circulaire (30 secondes de buffer)
    CircularRecorder recorder(30, config.sampleRate, config.channels);
    
    // Configurer le callback pour recevoir les données audio
    capture->setDataCallback([&recorder, &capture](const float* data, size_t frames, size_t channels) {
        // Ajouter au buffer circulaire
        recorder.write(data, frames);
        
        // Afficher les niveaux et la durée du buffer
        float rms = capture->getRMSLevel();
        float peak = capture->getPeakLevel();
        double duration = recorder.getCurrentDuration();
        
        std::cout << "\r";
        std::cout << "Buffer: " << std::setw(5) << std::fixed << std::setprecision(1) 
                  << duration << "s | ";
        displayAudioLevels(rms, peak);
    });
    
    // Démarrer la capture
    std::cout << "Démarrage de l'enregistrement circulaire...\n";
    std::cout << "Appuyez sur Ctrl+C pour sauvegarder les 10 dernières secondes\n\n";
    
    if (!capture->start()) {
        std::cerr << "Erreur de démarrage de la capture\n";
        return;
    }
    
    // Attendre l'arrêt
    while (!g_shouldStop && capture->isCapturing()) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    
    // Arrêter la capture
    capture->stop();
    
    // Sauvegarder les 10 dernières secondes
    std::cout << "\n\nSauvegarde des 10 dernières secondes...\n";
    
    FileWriterConfig writerConfig;
    writerConfig.format = AudioFileFormat::WAV;
    writerConfig.sampleRate = config.sampleRate;
    writerConfig.channels = config.channels;
    writerConfig.bitsPerSample = config.bitsPerSample;
    
    if (recorder.saveLastSeconds("recording_last_10s.wav", 10.0, writerConfig)) {
        std::cout << "Fichier sauvegardé: recording_last_10s.wav\n";
    } else {
        std::cerr << "Erreur de sauvegarde\n";
    }
}

// Exemple 3: Détection de silence et découpage automatique
void example3_SilenceDetection() {
    std::cout << "\n=== Exemple 3: Détection de Silence ===\n\n";
    std::cout << "Enregistre uniquement quand du son est détecté\n\n";
    
    // Créer l'instance de capture
    auto capture = std::make_unique<AudioCaptureImpl>();
    
    // Configuration
    CaptureConfig config;
    config.sampleRate = 48000;
    config.channels = 2;
    config.bitsPerSample = 16;
    config.bufferSize = 4096;
    
    if (!capture->configure(config)) {
        std::cerr << "Erreur de configuration de la capture\n";
        return;
    }
    
    // Variables pour la détection de silence
    bool isRecording = false;
    int silenceCounter = 0;
    const int silenceThreshold = 50; // ~500ms de silence à 100ms d'intervalle
    std::unique_ptr<AudioFileWriter> currentWriter;
    int fileIndex = 0;
    
    // Configurer le callback
    capture->setDataCallback([&](const float* data, size_t frames, size_t channels) {
        // Vérifier si c'est du silence
        bool isSilent = Utils::isSilent(data, frames * channels, -40.0f);
        
        if (isSilent) {
            silenceCounter++;
            
            // Si on enregistrait et qu'on a assez de silence, arrêter
            if (isRecording && silenceCounter > silenceThreshold) {
                if (currentWriter) {
                    currentWriter->close();
                    std::cout << "\nFin de l'enregistrement (silence détecté)\n";
                    currentWriter.reset();
                }
                isRecording = false;
            }
        } else {
            silenceCounter = 0;
            
            // Si on n'enregistrait pas, commencer
            if (!isRecording) {
                FileWriterConfig writerConfig;
                writerConfig.format = AudioFileFormat::WAV;
                writerConfig.sampleRate = config.sampleRate;
                writerConfig.channels = config.channels;
                writerConfig.bitsPerSample = config.bitsPerSample;
                
                std::string filename = "recording_segment_" + std::to_string(++fileIndex) + ".wav";
                currentWriter = std::make_unique<AudioFileWriter>();
                
                if (currentWriter->open(filename, writerConfig)) {
                    std::cout << "\nDébut de l'enregistrement: " << filename << "\n";
                    isRecording = true;
                }
            }
        }
        
        // Écrire les données si on enregistre
        if (isRecording && currentWriter) {
            currentWriter->write(data, frames);
        }
        
        // Afficher l'état
        std::cout << "\r" << (isRecording ? "[REC]" : "[---]") << " ";
        displayAudioLevels(capture->getRMSLevel(), capture->getPeakLevel());
    });
    
    // Démarrer la capture
    std::cout << "Démarrage de la détection de silence...\n";
    std::cout << "L'enregistrement démarre automatiquement quand du son est détecté\n";
    std::cout << "Appuyez sur Ctrl+C pour arrêter\n\n";
    
    if (!capture->start()) {
        std::cerr << "Erreur de démarrage de la capture\n";
        return;
    }
    
    // Attendre l'arrêt
    while (!g_shouldStop && capture->isCapturing()) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    
    // Arrêter la capture
    capture->stop();
    
    // Fermer le dernier fichier si nécessaire
    if (currentWriter) {
        currentWriter->close();
    }
    
    std::cout << "\n\n" << fileIndex << " segments enregistrés\n";
}

// Exemple 4: Génération de signaux de test
void example4_TestSignals() {
    std::cout << "\n=== Exemple 4: Signaux de Test ===\n\n";
    std::cout << "Génération de signaux de test dans des fichiers WAV\n\n";
    
    const uint32_t sampleRate = 48000;
    const uint16_t channels = 2;
    const double duration = 5.0; // 5 secondes
    const size_t totalFrames = static_cast<size_t>(sampleRate * duration);
    
    // Buffer pour les données
    std::vector<float> buffer(totalFrames * channels);
    
    // 1. Sinus 440Hz (La)
    {
        std::cout << "Génération d'un sinus 440Hz...\n";
        
        // Générer le signal mono
        std::vector<float> mono(totalFrames);
        Utils::generateSine(mono.data(), totalFrames, 440.0f, sampleRate, 0.5f);
        
        // Convertir en stéréo
        Utils::monoToStereo(mono.data(), buffer.data(), totalFrames);
        
        // Écrire le fichier
        FileWriterConfig config;
        config.format = AudioFileFormat::WAV;
        config.sampleRate = sampleRate;
        config.channels = channels;
        config.bitsPerSample = 16;
        
        AudioFileWriter writer;
        if (writer.open("test_sine_440hz.wav", config)) {
            writer.write(buffer.data(), totalFrames);
            writer.close();
            std::cout << "  Fichier créé: test_sine_440hz.wav\n";
        }
    }
    
    // 2. Bruit blanc
    {
        std::cout << "Génération de bruit blanc...\n";
        
        std::vector<float> mono(totalFrames);
        Utils::generateWhiteNoise(mono.data(), totalFrames, 0.3f);
        Utils::monoToStereo(mono.data(), buffer.data(), totalFrames);
        
        FileWriterConfig config;
        config.format = AudioFileFormat::WAV;
        config.sampleRate = sampleRate;
        config.channels = channels;
        config.bitsPerSample = 16;
        
        AudioFileWriter writer;
        if (writer.open("test_white_noise.wav", config)) {
            writer.write(buffer.data(), totalFrames);
            writer.close();
            std::cout << "  Fichier créé: test_white_noise.wav\n";
        }
    }
    
    // 3. Bruit rose
    {
        std::cout << "Génération de bruit rose...\n";
        
        std::vector<float> mono(totalFrames);
        Utils::generatePinkNoise(mono.data(), totalFrames, 0.5f);
        Utils::monoToStereo(mono.data(), buffer.data(), totalFrames);
        
        FileWriterConfig config;
        config.format = AudioFileFormat::WAV;
        config.sampleRate = sampleRate;
        config.channels = channels;
        config.bitsPerSample = 16;
        
        AudioFileWriter writer;
        if (writer.open("test_pink_noise.wav", config)) {
            writer.write(buffer.data(), totalFrames);
            writer.close();
            std::cout << "  Fichier créé: test_pink_noise.wav\n";
        }
    }
    
    // 4. Sweep de fréquence (20Hz à 20kHz)
    {
        std::cout << "Génération d'un sweep de fréquence...\n";
        
        std::vector<float> mono(totalFrames);
        float startFreq = 20.0f;
        float endFreq = 20000.0f;
        
        for (size_t i = 0; i < totalFrames; ++i) {
            float t = static_cast<float>(i) / totalFrames;
            float freq = startFreq * std::pow(endFreq / startFreq, t);
            float phase = 2.0f * M_PI * freq * i / sampleRate;
            mono[i] = 0.5f * std::sin(phase);
        }
        
        // Appliquer un fade in/out
        size_t fadeSamples = sampleRate / 10; // 100ms
        Utils::fadeIn(mono.data(), totalFrames, fadeSamples);
        Utils::fadeOut(mono.data(), totalFrames, fadeSamples);
        
        Utils::monoToStereo(mono.data(), buffer.data(), totalFrames);
        
        FileWriterConfig config;
        config.format = AudioFileFormat::WAV;
        config.sampleRate = sampleRate;
        config.channels = channels;
        config.bitsPerSample = 16;
        
        AudioFileWriter writer;
        if (writer.open("test_frequency_sweep.wav", config)) {
            writer.write(buffer.data(), totalFrames);
            writer.close();
            std::cout << "  Fichier créé: test_frequency_sweep.wav\n";
        }
    }
    
    std::cout << "\nTous les fichiers de test ont été générés!\n";
}

// Menu principal
int main(int argc, char* argv[]) {
    // Installer le gestionnaire de signal
    signal(SIGINT, signalHandler);
    
    std::cout << "\n";
    std::cout << "╔══════════════════════════════════════════════╗\n";
    std::cout << "║     Nyth Audio Capture - Exemples           ║\n";
    std::cout << "╚══════════════════════════════════════════════╝\n";
    std::cout << "\n";
    std::cout << "Choisissez un exemple:\n";
    std::cout << "  1. Enregistrement simple\n";
    std::cout << "  2. Enregistrement circulaire (buffer ring)\n";
    std::cout << "  3. Détection de silence et découpage\n";
    std::cout << "  4. Génération de signaux de test\n";
    std::cout << "  0. Quitter\n";
    std::cout << "\nVotre choix: ";
    
    int choice;
    std::cin >> choice;
    
    switch (choice) {
        case 1:
            example1_SimpleRecording();
            break;
        case 2:
            example2_CircularRecording();
            break;
        case 3:
            example3_SilenceDetection();
            break;
        case 4:
            example4_TestSignals();
            break;
        case 0:
            std::cout << "Au revoir!\n";
            break;
        default:
            std::cout << "Choix invalide\n";
            break;
    }
    
    return 0;
}