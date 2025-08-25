#ifdef __APPLE__
#if TARGET_OS_IOS

#import <Foundation/Foundation.h>
#include "../components/platform/IOS/IOSAudioFileWriter.h"
#include "../components/platform/IOS/IOSAudioFormats.h"
#include "../config/AudioFormatConfig.h"
#include <iostream>
#include <vector>
#include <cmath>

using namespace Nyth::Audio;
using namespace Nyth::Audio::iOS;

// Exemple d'utilisation des formats audio iOS
void demonstrateIOSAudioFormats() {
    
    // ========== 1. ALAC (Apple Lossless) ==========
    std::cout << "=== Test ALAC (Apple Lossless) ===" << std::endl;
    {
        AudioFileWriterConfig config;
        config.filePath = "/tmp/test_alac.m4a";
        config.format = AudioFileFormat::ALAC;
        config.sampleRate = 44100;
        config.channelCount = 2;
        config.bitsPerSample = 16;
        
        IOSAudioFileWriter writer;
        if (writer.open(config)) {
            std::cout << "✓ Fichier ALAC créé avec succès" << std::endl;
            
            // Générer un signal de test (sine wave stéréo)
            const size_t duration = 2;  // 2 secondes
            const size_t frameCount = config.sampleRate * duration;
            std::vector<float> audioData(frameCount * config.channelCount);
            
            for (size_t i = 0; i < frameCount; ++i) {
                float time = static_cast<float>(i) / config.sampleRate;
                // Canal gauche: 440 Hz (La)
                audioData[i * 2] = std::sin(2.0f * M_PI * 440.0f * time) * 0.5f;
                // Canal droit: 880 Hz (La octave supérieur)
                audioData[i * 2 + 1] = std::sin(2.0f * M_PI * 880.0f * time) * 0.5f;
            }
            
            if (writer.write(audioData.data(), frameCount)) {
                std::cout << "✓ Audio écrit: " << writer.getFramesWritten() 
                         << " frames" << std::endl;
            }
            
            writer.close();
        }
    }
    
    // ========== 2. CAF (Core Audio Format) ==========
    std::cout << "\n=== Test CAF (Core Audio Format) ===" << std::endl;
    {
        AudioFileWriterConfig config;
        config.filePath = "/tmp/test_long_recording.caf";
        config.format = AudioFileFormat::CAF;
        config.sampleRate = 48000;
        config.channelCount = 1;  // Mono
        config.bitsPerSample = 32;  // Float
        
        IOSAudioFileWriter writer;
        if (writer.open(config)) {
            std::cout << "✓ Fichier CAF créé (pas de limite 4GB!)" << std::endl;
            
            // Simuler un enregistrement long par chunks
            const size_t chunkSize = config.sampleRate;  // 1 seconde par chunk
            std::vector<float> chunk(chunkSize);
            
            for (int seconds = 0; seconds < 5; ++seconds) {
                // Générer un signal différent chaque seconde
                float frequency = 220.0f * (seconds + 1);  // 220Hz, 440Hz, etc.
                
                for (size_t i = 0; i < chunkSize; ++i) {
                    float time = static_cast<float>(i) / config.sampleRate;
                    chunk[i] = std::sin(2.0f * M_PI * frequency * time) * 0.3f;
                }
                
                writer.write(chunk.data(), chunkSize);
                std::cout << "  Chunk " << (seconds + 1) << " écrit" << std::endl;
            }
            
            std::cout << "✓ Total écrit: " << writer.getFramesWritten() 
                     << " frames" << std::endl;
            writer.close();
        }
    }
    
    // ========== 3. AMR (Pour la voix) ==========
    std::cout << "\n=== Test AMR (Adaptive Multi-Rate) ===" << std::endl;
    {
        AudioFileWriterConfig config;
        config.filePath = "/tmp/test_voice.amr";
        config.format = AudioFileFormat::AMR;
        config.sampleRate = 8000;   // AMR utilise 8kHz
        config.channelCount = 1;     // Mono seulement
        config.bitsPerSample = 16;
        
        IOSAudioFileWriter writer;
        if (writer.open(config)) {
            std::cout << "✓ Fichier AMR créé (optimisé pour la voix)" << std::endl;
            
            // Simuler une voix avec des fréquences typiques
            const size_t duration = 3;  // 3 secondes
            const size_t frameCount = config.sampleRate * duration;
            std::vector<float> voiceData(frameCount);
            
            // Générer un signal complexe simulant la voix
            for (size_t i = 0; i < frameCount; ++i) {
                float time = static_cast<float>(i) / config.sampleRate;
                
                // Fondamentale (voix masculine ~120Hz)
                float fundamental = std::sin(2.0f * M_PI * 120.0f * time) * 0.4f;
                
                // Harmoniques
                float harmonic1 = std::sin(2.0f * M_PI * 240.0f * time) * 0.2f;
                float harmonic2 = std::sin(2.0f * M_PI * 360.0f * time) * 0.1f;
                
                // Modulation pour simuler la variation de la voix
                float modulation = std::sin(2.0f * M_PI * 5.0f * time) * 0.1f + 1.0f;
                
                voiceData[i] = (fundamental + harmonic1 + harmonic2) * modulation;
            }
            
            if (writer.write(voiceData.data(), frameCount)) {
                std::cout << "✓ Audio voix écrit: " << writer.getFramesWritten() 
                         << " frames" << std::endl;
                std::cout << "  Taille optimisée pour transmission mobile" << std::endl;
            }
            
            writer.close();
        }
    }
    
    // ========== 4. Configuration selon l'usage ==========
    std::cout << "\n=== Configurations recommandées ===" << std::endl;
    
    // Pour enregistrement haute qualité
    {
        auto config = IOSAudioFormatConfig::forHighQualityRecording();
        std::cout << "\nEnregistrement haute qualité:" << std::endl;
        std::cout << "  - ALAC sans perte" << std::endl;
        std::cout << "  - Compression niveau: " << config.alac.compressionLevel << std::endl;
        std::cout << "  - Idéal pour musique/production" << std::endl;
    }
    
    // Pour enregistrement voix
    {
        auto config = IOSAudioFormatConfig::forVoiceRecording();
        std::cout << "\nEnregistrement voix:" << std::endl;
        std::cout << "  - AMR optimisé" << std::endl;
        std::cout << "  - Bitrate: " << config.amr.bitrate << " bps" << std::endl;
        std::cout << "  - DTX activé pour économie batterie" << std::endl;
    }
    
    // Pour enregistrement long
    {
        auto config = IOSAudioFormatConfig::forLongRecording();
        std::cout << "\nEnregistrement long:" << std::endl;
        std::cout << "  - Format CAF" << std::endl;
        std::cout << "  - Pas de limite 4GB" << std::endl;
        std::cout << "  - Frames variables supportés" << std::endl;
    }
    
    // ========== 5. Détection format optimal ==========
    std::cout << "\n=== Format optimal pour iOS ===" << std::endl;
    std::string bestFormat = AudioFormat::getBestFormatForPlatform();
    std::cout << "Format recommandé: " << bestFormat << std::endl;
    
    // Vérifier support natif
    std::cout << "\nSupport natif iOS:" << std::endl;
    std::vector<std::string> formats = {
        AudioFormats::ALAC, AudioFormats::CAF, AudioFormats::AMR,
        AudioFormats::AAC, AudioFormats::M4A, AudioFormats::WAV
    };
    
    for (const auto& fmt : formats) {
        bool isNative = AudioFormat::isIOSNative(fmt);
        std::cout << "  " << fmt << ": " << (isNative ? "✓" : "✗") << std::endl;
    }
}

// Point d'entrée pour test
int main() {
    @autoreleasepool {
        std::cout << "Démonstration des formats audio iOS" << std::endl;
        std::cout << "===================================" << std::endl;
        
        demonstrateIOSAudioFormats();
        
        std::cout << "\n✅ Démonstration terminée!" << std::endl;
        std::cout << "Les fichiers ont été créés dans /tmp/" << std::endl;
    }
    return 0;
}

#endif // TARGET_OS_IOS
#endif // __APPLE__