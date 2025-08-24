#pragma once

#include "ReactCommon/CallInvoker.h"
#include <atomic>
#include <condition_variable>
#include <functional>
#include "jsi/jsi.h"
#include <memory>
#include <mutex>
#include <queue>
#include <string>
#include <thread>
#include <unordered_map>
#include <vector>

namespace facebook {
namespace react {

class IJSICallbackManager {
public:
    virtual ~IJSICallbackManager() = default;

    // === Configuration du runtime ===
    virtual void setRuntime(jsi::Runtime* rt) = 0;
    virtual void invalidateRuntime() = 0;

    // === Gestion des callbacks ===
    virtual void setAudioDataCallback(const jsi::Function& callback) = 0;
    virtual void setErrorCallback(const jsi::Function& callback) = 0;
    virtual void setStateChangeCallback(const jsi::Function& callback) = 0;
    virtual void setAnalysisCallback(const jsi::Function& callback) = 0;

    virtual void removeCallback(const std::string& name) = 0;
    virtual void clearAllCallbacks() = 0;

    // === Invocation des callbacks ===
    virtual void invokeAudioDataCallback(const float* data, size_t frameCount, int channels) = 0;
    virtual void invokeErrorCallback(const std::string& error) = 0;
    virtual void invokeStateChangeCallback(const std::string& oldState, const std::string& newState) = 0;
    virtual void invokeAnalysisCallback(const jsi::Object& analysisData) = 0;

    // === Callback générique pour les effets ===
    virtual void invokeCallback(const std::string& callbackName, std::function<jsi::Value(jsi::Runtime&)> callback) = 0;
    virtual void invokeCallback(const std::string& callbackName,
                                std::function<std::vector<jsi::Value>(jsi::Runtime&)> callback) = 0;

    // === Gestion de la file d'attente ===
    virtual void setMaxQueueSize(size_t maxSize) = 0;
    virtual size_t getQueueSize() const = 0;
    virtual bool isQueueFull() const = 0;

    // === API générique de gestion des callbacks ===
    virtual void registerCallback(const std::string& name, jsi::Runtime& rt, const jsi::Function& callback) = 0;
    virtual void setCallback(const std::string& name, jsi::Runtime& rt, const jsi::Function& callback) = 0;
};

// === Implémentation du gestionnaire de callbacks JSI ===

class JSICallbackManager : public IJSICallbackManager {
public:
    explicit JSICallbackManager(std::shared_ptr<CallInvoker> jsInvoker);
    ~JSICallbackManager();

    // === Configuration du runtime ===
    void setRuntime(jsi::Runtime* rt);
    void invalidateRuntime();

    // === Gestion des callbacks ===
    void setAudioDataCallback(const jsi::Function& callback);
    void setErrorCallback(const jsi::Function& callback);
    void setStateChangeCallback(const jsi::Function& callback);
    void setAnalysisCallback(const jsi::Function& callback);

    void removeCallback(const std::string& name);
    void clearAllCallbacks();

    // === Invocation des callbacks ===
    void invokeAudioDataCallback(const float* data, size_t frameCount, int channels);
    void invokeErrorCallback(const std::string& error);
    void invokeStateChangeCallback(const std::string& oldState, const std::string& newState);
    void invokeAnalysisCallback(const jsi::Object& analysisData);

    // === Gestion de la file d'attente ===
    void setMaxQueueSize(size_t maxSize);
    size_t getQueueSize() const;
    bool isQueueFull() const;

    // === API générique de gestion des callbacks ===
    void registerCallback(const std::string& name, jsi::Runtime& rt, const jsi::Function& callback);
    void setCallback(const std::string& name, jsi::Runtime& rt, const jsi::Function& callback);

    // === Callback générique pour les effets ===
    void invokeCallback(const std::string& callbackName,
                        std::function<std::vector<jsi::Value>(jsi::Runtime&)> callback);

private:
    // === Structure pour les callbacks ===
    struct CallbackData {
        std::shared_ptr<jsi::Function> function;
        jsi::Runtime* runtime = nullptr;
        bool isValid = false;

        // Constructeur par défaut
        CallbackData() = default;

        // Constructeur avec paramètres
        CallbackData(std::shared_ptr<jsi::Function> func, jsi::Runtime* rt, bool valid)
            : function(func), runtime(rt), isValid(valid) {}

        // Constructeur de copie
        CallbackData(const CallbackData& other)
            : function(other.function), runtime(other.runtime), isValid(other.isValid) {}

        // Opérateur d'assignation
        CallbackData& operator=(const CallbackData& other) {
            if (this != &other) {
                function = other.function;
                runtime = other.runtime;
                isValid = other.isValid;
            }
            return *this;
        }
    };

    // === Structure pour les invocations en attente ===
    struct CallbackInvocation {
        std::string callbackName;
        std::function<void(jsi::Runtime&)> invocation;
    };

    // === Membres privés ===
    std::shared_ptr<CallInvoker> jsInvoker_;
    jsi::Runtime* runtime_ = nullptr;
    std::atomic<bool> runtimeValid_{false};

    std::unordered_map<std::string, CallbackData> callbacks_;
    mutable std::mutex callbackMutex_;

    // File d'attente pour les invocations
    std::queue<CallbackInvocation> invocationQueue_;
    mutable std::mutex queueMutex_;
    std::condition_variable queueCV_;
    std::atomic<size_t> maxQueueSize_{10};
    std::atomic<bool> processing_{false};

    // Thread de traitement
    std::thread processingThread_;
    std::atomic<bool> shouldStop_{false};

    // === Méthodes privées ===
    void startProcessingThread();
    void stopProcessingThread();
    void processingThreadLoop();

    void enqueueInvocation(const std::string& callbackName, std::function<void(jsi::Runtime&)> invocation);

    bool hasCallback(const std::string& name) const;
    CallbackData getCallback(const std::string& name) const;

    // Validation des données audio
    void validateAudioData(const float* data, size_t frameCount, int channels) const;
};

} // namespace react
} // namespace facebook
