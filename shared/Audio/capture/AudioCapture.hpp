#pragma once

#include <vector>
#include <memory>
#include <functional>
#include <string>
#include <atomic>
#include <chrono>
#include <cstdint>

namespace Nyth {
namespace Audio {

// Configuration de la capture audio
struct CaptureConfig {
    uint32_t sampleRate = 48000;      // Fréquence d'échantillonnage (Hz)
    uint16_t channels = 2;            // Nombre de canaux (1=mono, 2=stéréo)
    uint16_t bitsPerSample = 16;      // Bits par échantillon
    uint32_t bufferSize = 4096;       // Taille du buffer en échantillons
    bool useFloatingPoint = false;    // Utiliser des échantillons flottants
    
    // Configuration avancée
    uint32_t latencyMs = 10;          // Latence cible en millisecondes
    bool enableNoiseReduction = false; // Activer la réduction de bruit
    bool enableEchoCancellation = false; // Activer l'annulation d'écho
    bool enableAutoGainControl = false; // Contrôle automatique du gain
};

// État de la capture
enum class CaptureState {
    IDLE,        // Inactif
    STARTING,    // Démarrage en cours
    RUNNING,     // En cours de capture
    PAUSED,      // En pause
    STOPPING,    // Arrêt en cours
    ERROR        // Erreur
};

// Informations sur le périphérique audio
struct AudioDevice {
    std::string id;           // Identifiant unique
    std::string name;         // Nom du périphérique
    uint16_t maxChannels;     // Nombre maximum de canaux
    uint32_t maxSampleRate;   // Fréquence d'échantillonnage maximale
    bool isDefault;           // Périphérique par défaut
    bool isAvailable;         // Disponible pour la capture
};

// Statistiques de capture
struct CaptureStats {
    uint64_t samplesProcessed = 0;    // Nombre total d'échantillons traités
    uint64_t bytesProcessed = 0;      // Nombre total d'octets traités
    double captureTimeSeconds = 0.0;   // Durée totale de capture
    uint32_t droppedFrames = 0;        // Nombre de frames perdues
    double currentLatencyMs = 0.0;     // Latence actuelle
    double averageLatencyMs = 0.0;     // Latence moyenne
    double peakAmplitude = 0.0;        // Amplitude maximale détectée
    double rmsLevel = 0.0;             // Niveau RMS actuel
};

// Callback pour les données audio capturées
using AudioDataCallback = std::function<void(const float* data, size_t frames, size_t channels)>;
using AudioDataCallbackInt16 = std::function<void(const int16_t* data, size_t frames, size_t channels)>;

// Callback pour les événements
using StateChangeCallback = std::function<void(CaptureState oldState, CaptureState newState)>;
using ErrorCallback = std::function<void(const std::string& error)>;

// Interface principale pour la capture audio
class AudioCapture {
public:
    AudioCapture() = default;
    virtual ~AudioCapture() = default;
    
    // Configuration
    virtual bool configure(const CaptureConfig& config) = 0;
    virtual CaptureConfig getConfiguration() const = 0;
    
    // Contrôle de la capture
    virtual bool start() = 0;
    virtual bool stop() = 0;
    virtual bool pause() = 0;
    virtual bool resume() = 0;
    
    // État
    virtual CaptureState getState() const = 0;
    virtual bool isCapturing() const = 0;
    
    // Périphériques
    virtual std::vector<AudioDevice> getAvailableDevices() const = 0;
    virtual bool selectDevice(const std::string& deviceId) = 0;
    virtual AudioDevice getCurrentDevice() const = 0;
    
    // Callbacks
    virtual void setDataCallback(AudioDataCallback callback) = 0;
    virtual void setDataCallbackInt16(AudioDataCallbackInt16 callback) = 0;
    virtual void setStateChangeCallback(StateChangeCallback callback) = 0;
    virtual void setErrorCallback(ErrorCallback callback) = 0;
    
    // Statistiques
    virtual CaptureStats getStatistics() const = 0;
    virtual void resetStatistics() = 0;
    
    // Volume et gain
    virtual bool setInputGain(float gain) = 0;  // 0.0 à 2.0
    virtual float getInputGain() const = 0;
    virtual float getPeakLevel() const = 0;     // 0.0 à 1.0
    virtual float getRMSLevel() const = 0;      // 0.0 à 1.0
    
    // Factory method
    static std::unique_ptr<AudioCapture> create();
    
protected:
    // Méthodes utilitaires pour les implémentations dérivées
    virtual void notifyStateChange(CaptureState newState) = 0;
    virtual void notifyError(const std::string& error) = 0;
};

// Classe de buffer circulaire pour la capture
template<typename T>
class CircularAudioBuffer {
public:
    explicit CircularAudioBuffer(size_t capacity) 
        : buffer_(capacity), capacity_(capacity), writePos_(0), readPos_(0), size_(0) {}
    
    bool write(const T* data, size_t count) {
        if (count > available()) {
            return false;
        }
        
        for (size_t i = 0; i < count; ++i) {
            buffer_[writePos_] = data[i];
            writePos_ = (writePos_ + 1) % capacity_;
        }
        
        size_ += count;
        return true;
    }
    
    bool read(T* data, size_t count) {
        if (count > size_) {
            return false;
        }
        
        for (size_t i = 0; i < count; ++i) {
            data[i] = buffer_[readPos_];
            readPos_ = (readPos_ + 1) % capacity_;
        }
        
        size_ -= count;
        return true;
    }
    
    size_t size() const { return size_; }
    size_t capacity() const { return capacity_; }
    size_t available() const { return capacity_ - size_; }
    void clear() { 
        writePos_ = 0; 
        readPos_ = 0; 
        size_ = 0; 
    }
    
private:
    std::vector<T> buffer_;
    size_t capacity_;
    std::atomic<size_t> writePos_;
    std::atomic<size_t> readPos_;
    std::atomic<size_t> size_;
};

} // namespace Audio
} // namespace Nyth