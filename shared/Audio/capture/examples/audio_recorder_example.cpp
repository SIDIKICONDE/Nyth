/**
 * Exemple d'utilisation du système de capture audio Nyth
 * 
 * Ce fichier démontre comment utiliser les différentes fonctionnalités
 * de capture audio pour Android et iOS.
 */

#include "../AudioCapture.hpp"
#include "../AudioCaptureUtils.hpp"
#include "../AudioFileWriter.hpp"
#include <iostream>
#include <chrono>
#include <thread>
#include <iomanip>

using namespace Nyth::Audio;

// === Exemple 1: Capture audio simple ===
void simpleCaptureExample() {
    std::cout << "\n=== Exemple 1: Capture Audio Simple ===" << std::endl;
    
    // Configuration de la capture
    AudioCaptureConfig config;
    config.sampleRate = 44100;
    config.channelCount = 1;  // Mono
    config.bitsPerSample = 16;
    config.bufferSizeFrames = 1024;
    config.enableNoiseSuppression = true;
    
    // Création de l'instance de capture
    auto capture = AudioCapture::create(config);
    if (!capture) {
        std::cerr << "Erreur: Impossible de créer la capture audio" << std::endl;
        return;
    }
    
    // Vérification des permissions (mobile)
    if (!capture->hasPermission()) {
        std::cout << "Demande de permission pour accéder au microphone..." << std::endl;
        capture->requestPermission([](bool granted) {
            if (granted) {
                std::cout << "Permission accordée!" << std::endl;
            } else {
                std::cout << "Permission refusée!" << std::endl;
            }
        });
    }
    
    // Configuration du callback pour recevoir les données audio
    capture->setAudioDataCallback([](const float* data, size_t frameCount, int channels) {
        // Calcul du niveau audio
        float peak = AudioAnalyzer::calculatePeak(data, frameCount * channels);
        float rmsDb = AudioAnalyzer::calculateRMSdB(data, frameCount * channels);
        
        // Affichage du niveau sous forme de barre
        int barLength = static_cast<int>(peak * 50);
        std::cout << "\r[";
        for (int i = 0; i < 50; ++i) {
            std::cout << (i < barLength ? "=" : " ");
        }
        std::cout << "] " << std::fixed << std::setprecision(1) 
                  << rmsDb << " dB" << std::flush;
    });
    
    // Gestion des erreurs
    capture->setErrorCallback([](const std::string& error) {
        std::cerr << "\nErreur de capture: " << error << std::endl;
    });
    
    // Démarrage de la capture
    std::cout << "Démarrage de la capture audio..." << std::endl;
    if (!capture->start()) {
        std::cerr << "Erreur: Impossible de démarrer la capture" << std::endl;
        return;
    }
    
    // Capture pendant 5 secondes
    std::this_thread::sleep_for(std::chrono::seconds(5));
    
    // Arrêt de la capture
    capture->stop();
    std::cout << "\nCapture arrêtée." << std::endl;
    
    // Affichage des statistiques
    auto stats = capture->getStatistics();
    std::cout << "Statistiques:" << std::endl;
    std::cout << "  - Frames traitées: " << stats.framesProcessed << std::endl;
    std::cout << "  - Octets traités: " << stats.bytesProcessed << std::endl;
    std::cout << "  - Niveau moyen: " << stats.averageLevel << std::endl;
    std::cout << "  - Niveau de crête: " << stats.peakLevel << std::endl;
}

// === Exemple 2: Enregistrement dans un fichier WAV ===
void recordToFileExample() {
    std::cout << "\n=== Exemple 2: Enregistrement dans un fichier WAV ===" << std::endl;
    
    // Création de la capture
    auto capture = AudioCapture::create();
    if (!capture) {
        std::cerr << "Erreur: Impossible de créer la capture audio" << std::endl;
        return;
    }
    
    // Configuration de l'enregistreur
    AudioFileWriterConfig writerConfig;
    writerConfig.filePath = "recording.wav";
    writerConfig.format = AudioFileFormat::WAV;
    writerConfig.sampleRate = 44100;
    writerConfig.channelCount = 2;  // Stereo
    writerConfig.bitsPerSample = 16;
    
    // Création de l'enregistreur
    AudioRecorder recorder;
    if (!recorder.initialize(capture, writerConfig)) {
        std::cerr << "Erreur: Impossible d'initialiser l'enregistreur" << std::endl;
        return;
    }
    
    // Configuration des limites
    recorder.setDurationLimit(10.0f);  // Limite à 10 secondes
    
    // Callback pour les événements
    recorder.setRecordingCallback([](const std::string& event) {
        std::cout << "Événement: " << event << std::endl;
    });
    
    // Démarrage de l'enregistrement
    std::cout << "Démarrage de l'enregistrement..." << std::endl;
    if (!recorder.startRecording()) {
        std::cerr << "Erreur: Impossible de démarrer l'enregistrement" << std::endl;
        return;
    }
    
    // Affichage de la progression
    while (recorder.isRecording()) {
        float duration = recorder.getRecordingDuration();
        std::cout << "\rEnregistrement: " << std::fixed << std::setprecision(1) 
                  << duration << " secondes" << std::flush;
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
        
        // Test de pause/reprise après 3 secondes
        if (duration >= 3.0f && duration < 3.2f && !recorder.isPaused()) {
            std::cout << "\n[Pause]" << std::endl;
            recorder.pauseRecording();
            std::this_thread::sleep_for(std::chrono::seconds(2));
            std::cout << "[Reprise]" << std::endl;
            recorder.resumeRecording();
        }
    }
    
    std::cout << "\nEnregistrement terminé!" << std::endl;
    std::cout << "Fichier sauvegardé: " << writerConfig.filePath << std::endl;
    std::cout << "Durée totale: " << recorder.getRecordingDuration() << " secondes" << std::endl;
    std::cout << "Frames enregistrées: " << recorder.getFramesRecorded() << std::endl;
}

// === Exemple 3: Enregistrement multi-fichiers avec division automatique ===
void multiFileRecordingExample() {
    std::cout << "\n=== Exemple 3: Enregistrement Multi-Fichiers ===" << std::endl;
    
    // Création de la capture
    auto capture = AudioCapture::create();
    if (!capture) {
        std::cerr << "Erreur: Impossible de créer la capture audio" << std::endl;
        return;
    }
    
    // Configuration de la division
    MultiFileRecorder::SplitConfig splitConfig;
    splitConfig.mode = MultiFileRecorder::SplitMode::BY_DURATION;
    splitConfig.splitDuration = 5.0f;  // Nouveau fichier toutes les 5 secondes
    splitConfig.filePattern = "segment_{index}.wav";
    splitConfig.startIndex = 1;
    
    // Configuration du writer
    AudioFileWriterConfig writerConfig;
    writerConfig.format = AudioFileFormat::WAV;
    writerConfig.sampleRate = 44100;
    writerConfig.channelCount = 1;
    writerConfig.bitsPerSample = 16;
    
    // Création de l'enregistreur multi-fichiers
    MultiFileRecorder multiRecorder;
    if (!multiRecorder.initialize(capture, splitConfig, writerConfig)) {
        std::cerr << "Erreur: Impossible d'initialiser l'enregistreur multi-fichiers" << std::endl;
        return;
    }
    
    // Callback lors de la création d'un nouveau fichier
    multiRecorder.setFileSplitCallback([](const std::string& newFile, int index) {
        std::cout << "\nNouveau fichier créé: " << newFile << " (index " << index << ")" << std::endl;
    });
    
    // Démarrage de l'enregistrement
    std::cout << "Démarrage de l'enregistrement multi-fichiers..." << std::endl;
    if (!multiRecorder.startRecording()) {
        std::cerr << "Erreur: Impossible de démarrer l'enregistrement" << std::endl;
        return;
    }
    
    // Enregistrement pendant 15 secondes (3 fichiers de 5 secondes)
    std::this_thread::sleep_for(std::chrono::seconds(15));
    
    // Arrêt de l'enregistrement
    multiRecorder.stopRecording();
    
    // Affichage des fichiers créés
    std::cout << "\nEnregistrement terminé!" << std::endl;
    std::cout << "Nombre de fichiers créés: " << multiRecorder.getFileCount() << std::endl;
    std::cout << "Liste des fichiers:" << std::endl;
    for (const auto& file : multiRecorder.getAllFiles()) {
        std::cout << "  - " << file << std::endl;
    }
}

// === Exemple 4: Analyse audio en temps réel ===
void realtimeAnalysisExample() {
    std::cout << "\n=== Exemple 4: Analyse Audio en Temps Réel ===" << std::endl;
    
    // Configuration pour une analyse précise
    AudioCaptureConfig config;
    config.sampleRate = 48000;
    config.channelCount = 1;
    config.bufferSizeFrames = 512;  // Buffer plus petit pour moins de latence
    
    auto capture = AudioCapture::create(config);
    if (!capture) {
        std::cerr << "Erreur: Impossible de créer la capture audio" << std::endl;
        return;
    }
    
    // Variables pour l'analyse
    struct AnalysisData {
        std::atomic<float> currentRMS{0.0f};
        std::atomic<float> currentPeak{0.0f};
        std::atomic<bool> hasClipping{false};
        std::atomic<bool> isSilent{true};
        CircularBuffer<float> historyBuffer{48000};  // 1 seconde d'historique
    } analysis;
    
    // Callback d'analyse
    capture->setAudioDataCallback([&analysis](const float* data, size_t frameCount, int channels) {
        size_t sampleCount = frameCount * channels;
        
        // Calculs d'analyse
        analysis.currentRMS = AudioAnalyzer::calculateRMS(data, sampleCount);
        analysis.currentPeak = AudioAnalyzer::calculatePeak(data, sampleCount);
        analysis.hasClipping = AudioAnalyzer::hasClipping(data, sampleCount, 0.99f);
        analysis.isSilent = AudioAnalyzer::isSilent(data, sampleCount, 0.001f);
        
        // Sauvegarde dans l'historique
        analysis.historyBuffer.write(data, sampleCount);
    });
    
    // Démarrage de la capture
    std::cout << "Démarrage de l'analyse..." << std::endl;
    if (!capture->start()) {
        std::cerr << "Erreur: Impossible de démarrer la capture" << std::endl;
        return;
    }
    
    // Affichage de l'analyse pendant 10 secondes
    auto startTime = std::chrono::steady_clock::now();
    while (std::chrono::steady_clock::now() - startTime < std::chrono::seconds(10)) {
        // Affichage des métriques
        std::cout << "\r";
        std::cout << "RMS: " << std::fixed << std::setprecision(3) 
                  << analysis.currentRMS.load() << " | ";
        std::cout << "Peak: " << analysis.currentPeak.load() << " | ";
        std::cout << "État: ";
        
        if (analysis.isSilent.load()) {
            std::cout << "SILENCE ";
        } else if (analysis.hasClipping.load()) {
            std::cout << "CLIPPING!";
        } else {
            std::cout << "NORMAL  ";
        }
        
        std::cout << " | Buffer: " << analysis.historyBuffer.available() 
                  << " samples" << std::flush;
        
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }
    
    capture->stop();
    std::cout << "\nAnalyse terminée." << std::endl;
}

// === Exemple 5: Utilisation des périphériques audio ===
void audioDevicesExample() {
    std::cout << "\n=== Exemple 5: Gestion des Périphériques Audio ===" << std::endl;
    
    auto capture = AudioCapture::create();
    if (!capture) {
        std::cerr << "Erreur: Impossible de créer la capture audio" << std::endl;
        return;
    }
    
    // Liste des périphériques disponibles
    auto devices = capture->getAvailableDevices();
    std::cout << "Périphériques audio disponibles:" << std::endl;
    for (const auto& device : devices) {
        std::cout << "  - " << device.name;
        if (device.isDefault) {
            std::cout << " [PAR DÉFAUT]";
        }
        std::cout << std::endl;
        std::cout << "    ID: " << device.id << std::endl;
        std::cout << "    Canaux max: " << device.maxChannels << std::endl;
        std::cout << "    Taux d'échantillonnage supportés: ";
        for (auto rate : device.supportedSampleRates) {
            std::cout << rate << "Hz ";
        }
        std::cout << std::endl;
    }
    
    // Sélection d'un périphérique spécifique
    if (devices.size() > 1) {
        std::cout << "\nSélection du deuxième périphérique..." << std::endl;
        if (capture->selectDevice(devices[1].id)) {
            std::cout << "Périphérique sélectionné: " << devices[1].name << std::endl;
        } else {
            std::cout << "Erreur lors de la sélection du périphérique" << std::endl;
        }
    }
    
    // Affichage du périphérique actuel
    auto currentDevice = capture->getCurrentDevice();
    std::cout << "\nPériphérique actuel: " << currentDevice.name << std::endl;
}

// === Programme principal ===
int main(int argc, char* argv[]) {
    std::cout << "========================================" << std::endl;
    std::cout << "   Exemples de Capture Audio Nyth" << std::endl;
    std::cout << "========================================" << std::endl;
    
    if (argc < 2) {
        std::cout << "\nUtilisation: " << argv[0] << " <exemple>" << std::endl;
        std::cout << "\nExemples disponibles:" << std::endl;
        std::cout << "  1 - Capture audio simple avec visualisation" << std::endl;
        std::cout << "  2 - Enregistrement dans un fichier WAV" << std::endl;
        std::cout << "  3 - Enregistrement multi-fichiers" << std::endl;
        std::cout << "  4 - Analyse audio en temps réel" << std::endl;
        std::cout << "  5 - Gestion des périphériques audio" << std::endl;
        std::cout << "  all - Exécuter tous les exemples" << std::endl;
        return 0;
    }
    
    std::string choice = argv[1];
    
    try {
        if (choice == "1") {
            simpleCaptureExample();
        } else if (choice == "2") {
            recordToFileExample();
        } else if (choice == "3") {
            multiFileRecordingExample();
        } else if (choice == "4") {
            realtimeAnalysisExample();
        } else if (choice == "5") {
            audioDevicesExample();
        } else if (choice == "all") {
            simpleCaptureExample();
            recordToFileExample();
            multiFileRecordingExample();
            realtimeAnalysisExample();
            audioDevicesExample();
        } else {
            std::cerr << "Exemple invalide: " << choice << std::endl;
            return 1;
        }
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        return 1;
    }
    
    std::cout << "\n========================================" << std::endl;
    std::cout << "         Exemples terminés!" << std::endl;
    std::cout << "========================================" << std::endl;
    
    return 0;
}