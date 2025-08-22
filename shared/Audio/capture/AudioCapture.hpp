#pragma once

#include <cstdint>
#include <cstddef>
#include <memory>
#include <functional>
#include <vector>
#include <string>
#include <atomic>
#include <chrono>

namespace Nyth {
namespace Audio {

// Configuration de la capture audio
struct AudioCaptureConfig {
    // Format audio
    int sampleRate = 44100;        // Taux d'échantillonnage en Hz
    int channelCount = 1;           // Nombre de canaux (1=mono, 2=stereo)
    int bitsPerSample = 16;         // Bits par échantillon (16 ou 32)
    
    // Configuration du buffer
    int bufferSizeFrames = 1024;    // Taille du buffer en frames
    int numBuffers = 3;             // Nombre de buffers pour le double/triple buffering
    
    // Options
    bool enableEchoCancellation = false;
    bool enableNoiseSuppression = false;
    bool enableAutoGainControl = false;
    
    // Permissions
    bool requestPermissionOnInit = true;
};

// État de la capture
enum class CaptureState {
    Uninitialized,
    Initialized,
    Starting,
    Running,
    Pausing,
    Paused,
    Stopping,
    Stopped,
    Error
};

// Informations sur le périphérique audio
struct AudioDeviceInfo {
    std::string id;
    std::string name;
    bool isDefault;
    int maxChannels;
    std::vector<int> supportedSampleRates;
};

// Statistiques de capture
struct CaptureStatistics {
    uint64_t framesProcessed = 0;
    uint64_t bytesProcessed = 0;
    std::chrono::milliseconds totalDuration{0};
    float averageLevel = 0.0f;
    float peakLevel = 0.0f;
    uint32_t overruns = 0;
    uint32_t underruns = 0;
};

// Callback pour les données audio capturées
using AudioDataCallback = std::function<void(const float* data, size_t frameCount, int channels)>;
using AudioDataCallbackInt16 = std::function<void(const int16_t* data, size_t frameCount, int channels)>;

// Callback pour les erreurs
using ErrorCallback = std::function<void(const std::string& error)>;

// Callback pour les changements d'état
using StateChangeCallback = std::function<void(CaptureState oldState, CaptureState newState)>;

// Interface principale pour la capture audio
class AudioCapture {
public:
    virtual ~AudioCapture() = default;
    
    // === Gestion du cycle de vie ===
    
    // Initialise la capture avec la configuration spécifiée
    virtual bool initialize(const AudioCaptureConfig& config) = 0;
    
    // Démarre la capture audio
    virtual bool start() = 0;
    
    // Met en pause la capture
    virtual bool pause() = 0;
    
    // Reprend la capture après une pause
    virtual bool resume() = 0;
    
    // Arrête la capture
    virtual bool stop() = 0;
    
    // Libère toutes les ressources
    virtual void release() = 0;
    
    // === Configuration ===
    
    // Obtient la configuration actuelle
    virtual AudioCaptureConfig getConfig() const = 0;
    
    // Met à jour la configuration (peut nécessiter un redémarrage)
    virtual bool updateConfig(const AudioCaptureConfig& config) = 0;
    
    // === Callbacks ===
    
    // Définit le callback pour les données audio (float)
    virtual void setAudioDataCallback(AudioDataCallback callback) = 0;
    
    // Définit le callback pour les données audio (int16)
    virtual void setAudioDataCallbackInt16(AudioDataCallbackInt16 callback) = 0;
    
    // Définit le callback pour les erreurs
    virtual void setErrorCallback(ErrorCallback callback) = 0;
    
    // Définit le callback pour les changements d'état
    virtual void setStateChangeCallback(StateChangeCallback callback) = 0;
    
    // === État et informations ===
    
    // Obtient l'état actuel
    virtual CaptureState getState() const = 0;
    
    // Vérifie si la capture est active
    virtual bool isCapturing() const = 0;
    
    // Obtient les statistiques de capture
    virtual CaptureStatistics getStatistics() const = 0;
    
    // Réinitialise les statistiques
    virtual void resetStatistics() = 0;
    
    // === Périphériques ===
    
    // Liste les périphériques disponibles
    virtual std::vector<AudioDeviceInfo> getAvailableDevices() const = 0;
    
    // Sélectionne un périphérique spécifique
    virtual bool selectDevice(const std::string& deviceId) = 0;
    
    // Obtient le périphérique actuellement sélectionné
    virtual AudioDeviceInfo getCurrentDevice() const = 0;
    
    // === Permissions (mobile) ===
    
    // Vérifie si les permissions sont accordées
    virtual bool hasPermission() const = 0;
    
    // Demande les permissions nécessaires
    virtual void requestPermission(std::function<void(bool granted)> callback) = 0;
    
    // === Niveaux audio ===
    
    // Obtient le niveau audio actuel (0.0 à 1.0)
    virtual float getCurrentLevel() const = 0;
    
    // Obtient le niveau de crête (0.0 à 1.0)
    virtual float getPeakLevel() const = 0;
    
    // Réinitialise le niveau de crête
    virtual void resetPeakLevel() = 0;
    
    // === Factory ===
    
    // Crée une instance de capture audio pour la plateforme actuelle
    static std::unique_ptr<AudioCapture> create();
    
    // Crée une instance avec une configuration spécifique
    static std::unique_ptr<AudioCapture> create(const AudioCaptureConfig& config);
};

// Classe de base avec implémentation commune
class AudioCaptureBase : public AudioCapture {
protected:
    AudioCaptureConfig config_;
    std::atomic<CaptureState> state_{CaptureState::Uninitialized};
    CaptureStatistics statistics_;
    
    AudioDataCallback dataCallback_;
    AudioDataCallbackInt16 dataCallbackInt16_;
    ErrorCallback errorCallback_;
    StateChangeCallback stateChangeCallback_;
    
    std::atomic<float> currentLevel_{0.0f};
    std::atomic<float> peakLevel_{0.0f};
    
    // Méthodes utilitaires protégées
    void setState(CaptureState newState);
    void reportError(const std::string& error);
    void processAudioData(const float* data, size_t frameCount);
    void processAudioDataInt16(const int16_t* data, size_t frameCount);
    void updateLevels(const float* data, size_t sampleCount);
    void updateLevelsInt16(const int16_t* data, size_t sampleCount);
    
public:
    AudioCaptureBase() = default;
    virtual ~AudioCaptureBase() = default;
    
    // Implémentations communes
    AudioCaptureConfig getConfig() const override { return config_; }
    CaptureState getState() const override { return state_.load(); }
    bool isCapturing() const override { return state_ == CaptureState::Running; }
    CaptureStatistics getStatistics() const override { return statistics_; }
    void resetStatistics() override;
    
    void setAudioDataCallback(AudioDataCallback callback) override { dataCallback_ = callback; }
    void setAudioDataCallbackInt16(AudioDataCallbackInt16 callback) override { dataCallbackInt16_ = callback; }
    void setErrorCallback(ErrorCallback callback) override { errorCallback_ = callback; }
    void setStateChangeCallback(StateChangeCallback callback) override { stateChangeCallback_ = callback; }
    
    float getCurrentLevel() const override { return currentLevel_.load(); }
    float getPeakLevel() const override { return peakLevel_.load(); }
    void resetPeakLevel() override { peakLevel_ = 0.0f; }
};

} // namespace Audio
} // namespace Nyth