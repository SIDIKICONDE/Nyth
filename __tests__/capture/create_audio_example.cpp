#define _USE_MATH_DEFINES
#include <cmath>

#include "../../shared/Audio/capture/AudioCaptureUtils.hpp"
#include <cstdint>
#include <cstring>
#include <fstream>
#include <iostream>
#include <vector>

using namespace Nyth::Audio;

// Structure pour l'en-tête WAV
struct WAVHeader {
    char riff[4] = {'R', 'I', 'F', 'F'};
    uint32_t chunkSize;
    char wave[4] = {'W', 'A', 'V', 'E'};
    char fmt[4] = {'f', 'm', 't', ' '};
    uint32_t fmtChunkSize = 16;
    uint16_t audioFormat = 1; // PCM
    uint16_t numChannels;
    uint32_t sampleRate;
    uint32_t byteRate;
    uint16_t blockAlign;
    uint16_t bitsPerSample;
    char data[4] = {'d', 'a', 't', 'a'};
    uint32_t dataChunkSize;
};

// Fonction pour écrire un fichier WAV
bool writeWAVFile(const std::string& filename, const std::vector<float>& audioData, int sampleRate = 44100,
                  int channels = 1, int bitsPerSample = 16) {
    std::ofstream file(filename, std::ios::binary);
    if (!file.is_open()) {
        std::cerr << "❌ Impossible d'ouvrir le fichier: " << filename << std::endl;
        return false;
    }

    // Préparer l'en-tête WAV
    WAVHeader header;
    header.numChannels = channels;
    header.sampleRate = sampleRate;
    header.bitsPerSample = bitsPerSample;
    header.blockAlign = channels * bitsPerSample / 8;
    header.byteRate = sampleRate * header.blockAlign;

    // Convertir les données float en int16
    std::vector<int16_t> int16Data(audioData.size());
    AudioFormatConverter::floatToInt16(audioData.data(), int16Data.data(), audioData.size());

    header.dataChunkSize = int16Data.size() * sizeof(int16_t);
    header.chunkSize = 36 + header.dataChunkSize;

    // Écrire l'en-tête
    file.write(reinterpret_cast<const char*>(&header), sizeof(WAVHeader));

    // Écrire les données audio
    file.write(reinterpret_cast<const char*>(int16Data.data()), header.dataChunkSize);

    file.close();
    return true;
}

// Générer un signal sinusoïdal
std::vector<float> generateSineWave(float frequency, float amplitude, float duration, int sampleRate = 44100) {
    size_t numSamples = static_cast<size_t>(duration * sampleRate);
    std::vector<float> signal(numSamples);

    for (size_t i = 0; i < numSamples; ++i) {
        signal[i] = amplitude * std::sin(2.0 * M_PI * frequency * i / sampleRate);
    }

    return signal;
}

// Générer un signal carré
std::vector<float> generateSquareWave(float frequency, float amplitude, float duration, int sampleRate = 44100) {
    size_t numSamples = static_cast<size_t>(duration * sampleRate);
    std::vector<float> signal(numSamples);

    for (size_t i = 0; i < numSamples; ++i) {
        float t = static_cast<float>(i) / sampleRate;
        float phase = frequency * t;
        signal[i] = amplitude * (std::sin(2.0 * M_PI * phase) > 0 ? 1.0f : -1.0f);
    }

    return signal;
}

// Générer un signal en dents de scie
std::vector<float> generateSawtoothWave(float frequency, float amplitude, float duration, int sampleRate = 44100) {
    size_t numSamples = static_cast<size_t>(duration * sampleRate);
    std::vector<float> signal(numSamples);

    for (size_t i = 0; i < numSamples; ++i) {
        float t = static_cast<float>(i) / sampleRate;
        float phase = frequency * t;
        signal[i] = amplitude * (2.0f * (phase - std::floor(phase + 0.5f)));
    }

    return signal;
}

// Générer du bruit blanc
std::vector<float> generateWhiteNoise(float amplitude, float duration, int sampleRate = 44100) {
    size_t numSamples = static_cast<size_t>(duration * sampleRate);
    std::vector<float> signal(numSamples);

    for (size_t i = 0; i < numSamples; ++i) {
        // Bruit pseudo-aléatoire simple
        float noise = static_cast<float>(rand()) / RAND_MAX * 2.0f - 1.0f;
        signal[i] = amplitude * noise;
    }

    return signal;
}

// Appliquer une enveloppe ADSR
void applyADSR(std::vector<float>& signal, float attackTime, float decayTime, float sustainLevel, float releaseTime,
               int sampleRate = 44100) {
    size_t attackSamples = static_cast<size_t>(attackTime * sampleRate);
    size_t decaySamples = static_cast<size_t>(decayTime * sampleRate);
    size_t releaseSamples = static_cast<size_t>(releaseTime * sampleRate);

    size_t totalSamples = signal.size();

    for (size_t i = 0; i < totalSamples; ++i) {
        float envelope = 1.0f;

        if (i < attackSamples) {
            // Attack
            envelope = static_cast<float>(i) / attackSamples;
        } else if (i < attackSamples + decaySamples) {
            // Decay
            float decayPhase = static_cast<float>(i - attackSamples) / decaySamples;
            envelope = 1.0f - (1.0f - sustainLevel) * decayPhase;
        } else if (i >= totalSamples - releaseSamples) {
            // Release
            float releasePhase = static_cast<float>(i - (totalSamples - releaseSamples)) / releaseSamples;
            envelope = sustainLevel * (1.0f - releasePhase);
        } else {
            // Sustain
            envelope = sustainLevel;
        }

        signal[i] *= envelope;
    }
}

int main() {
    std::cout << "🎵 CRÉATION D'AUDIO - DÉMONSTRATION" << std::endl;
    std::cout << "===================================" << std::endl << std::endl;

    const int sampleRate = 44100;
    const float duration = 3.0f; // 3 secondes

    // 1. Signal sinusoïdal pur (440 Hz - La)
    std::cout << "🎼 Génération d'un signal sinusoïdal (440 Hz - La)..." << std::endl;
    auto sineWave = generateSineWave(440.0f, 0.5f, duration, sampleRate);

    // Analyser le signal
    float rms = AudioAnalyzer::calculateRMS(sineWave.data(), sineWave.size());
    float peak = AudioAnalyzer::calculatePeak(sineWave.data(), sineWave.size());
    float peakDb = AudioAnalyzer::calculatePeakdB(sineWave.data(), sineWave.size());

    std::cout << "   📊 RMS: " << rms << std::endl;
    std::cout << "   📈 Peak: " << peak << std::endl;
    std::cout << "   🔊 Peak dB: " << peakDb << " dB" << std::endl;

    // Normaliser le signal
    AudioAnalyzer::normalize(sineWave.data(), sineWave.size(), 0.8f);
    float newPeak = AudioAnalyzer::calculatePeak(sineWave.data(), sineWave.size());
    std::cout << "   🎚️ Peak après normalisation: " << newPeak << std::endl;

    // Sauvegarder
    if (writeWAVFile("sine_440hz.wav", sineWave, sampleRate)) {
        std::cout << "   ✅ Fichier sauvegardé: sine_440hz.wav" << std::endl;
    }

    // 2. Signal carré avec enveloppe ADSR
    std::cout << "\n🎼 Génération d'un signal carré avec enveloppe ADSR..." << std::endl;
    auto squareWave = generateSquareWave(220.0f, 0.3f, duration, sampleRate);
    applyADSR(squareWave, 0.1f, 0.2f, 0.6f, 0.5f, sampleRate);

    if (writeWAVFile("square_220hz_adsr.wav", squareWave, sampleRate)) {
        std::cout << "   ✅ Fichier sauvegardé: square_220hz_adsr.wav" << std::endl;
    }

    // 3. Signal en dents de scie
    std::cout << "\n🎼 Génération d'un signal en dents de scie..." << std::endl;
    auto sawtoothWave = generateSawtoothWave(330.0f, 0.4f, duration, sampleRate);

    if (writeWAVFile("sawtooth_330hz.wav", sawtoothWave, sampleRate)) {
        std::cout << "   ✅ Fichier sauvegardé: sawtooth_330hz.wav" << std::endl;
    }

    // 4. Bruit blanc
    std::cout << "\n🎼 Génération de bruit blanc..." << std::endl;
    auto whiteNoise = generateWhiteNoise(0.2f, duration, sampleRate);

    if (writeWAVFile("white_noise.wav", whiteNoise, sampleRate)) {
        std::cout << "   ✅ Fichier sauvegardé: white_noise.wav" << std::endl;
    }

    // 5. Mélange de signaux (stéréo)
    std::cout << "\n🎼 Création d'un mix stéréo..." << std::endl;
    auto leftChannel = generateSineWave(440.0f, 0.3f, duration, sampleRate);
    auto rightChannel = generateSineWave(880.0f, 0.3f, duration, sampleRate);

    // Convertir en stéréo
    std::vector<float> stereoMix(leftChannel.size() * 2);
    for (size_t i = 0; i < leftChannel.size(); ++i) {
        stereoMix[i * 2] = leftChannel[i];      // Canal gauche
        stereoMix[i * 2 + 1] = rightChannel[i]; // Canal droit
    }

    if (writeWAVFile("stereo_mix.wav", stereoMix, sampleRate, 2)) {
        std::cout << "   ✅ Fichier sauvegardé: stereo_mix.wav" << std::endl;
    }

    // 6. Démonstration du buffer circulaire
    std::cout << "\n🎼 Test du buffer circulaire..." << std::endl;
    CircularBuffer<float> buffer(1024);

    // Générer un signal de test
    auto testSignal = generateSineWave(1000.0f, 0.5f, 0.1f, sampleRate);

    // Écrire dans le buffer
    size_t written = buffer.write(testSignal.data(), testSignal.size());
    std::cout << "   📝 Écrit: " << written << " échantillons" << std::endl;

    // Lire depuis le buffer
    std::vector<float> readData(written);
    size_t read = buffer.read(readData.data(), readData.size());
    std::cout << "   📖 Lu: " << read << " échantillons" << std::endl;

    // Vérifier l'intégrité
    bool integrityOK = (read == written) && (readData == testSignal);
    std::cout << "   ✅ Intégrité du buffer: " << (integrityOK ? "OK" : "ERREUR") << std::endl;

    // 7. Test de conversion de format
    std::cout << "\n🎼 Test de conversion de format..." << std::endl;
    std::vector<int16_t> int16Data(testSignal.size());
    std::vector<float> floatData(testSignal.size());

    AudioFormatConverter::floatToInt16(testSignal.data(), int16Data.data(), testSignal.size());
    AudioFormatConverter::int16ToFloat(int16Data.data(), floatData.data(), int16Data.size());

    // Vérifier la conversion
    bool conversionOK = true;
    for (size_t i = 0; i < testSignal.size(); ++i) {
        if (std::abs(floatData[i] - testSignal[i]) > 1e-3f) {
            conversionOK = false;
            break;
        }
    }
    std::cout << "   ✅ Conversion float ↔ int16: " << (conversionOK ? "OK" : "ERREUR") << std::endl;

    std::cout << "\n🎉 CRÉATION AUDIO TERMINÉE!" << std::endl;
    std::cout << "=============================" << std::endl;
    std::cout << "📁 Fichiers créés:" << std::endl;
    std::cout << "   • sine_440hz.wav - Signal sinusoïdal 440 Hz" << std::endl;
    std::cout << "   • square_220hz_adsr.wav - Signal carré avec enveloppe" << std::endl;
    std::cout << "   • sawtooth_330hz.wav - Signal en dents de scie" << std::endl;
    std::cout << "   • white_noise.wav - Bruit blanc" << std::endl;
    std::cout << "   • stereo_mix.wav - Mix stéréo 440 Hz + 880 Hz" << std::endl;
    std::cout << std::endl;
    std::cout << "🔧 Fonctionnalités testées:" << std::endl;
    std::cout << "   ✅ Génération de signaux" << std::endl;
    std::cout << "   ✅ Analyse audio (RMS, Peak, dB)" << std::endl;
    std::cout << "   ✅ Normalisation" << std::endl;
    std::cout << "   ✅ Enveloppes ADSR" << std::endl;
    std::cout << "   ✅ Buffer circulaire" << std::endl;
    std::cout << "   ✅ Conversion de formats" << std::endl;
    std::cout << "   ✅ Écriture WAV" << std::endl;

    return 0;
}
