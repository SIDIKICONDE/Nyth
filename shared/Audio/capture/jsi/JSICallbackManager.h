#pragma once

#include <ReactCommon/CallInvoker.h>
#include <atomic>
#include <condition_variable>
#include <functional>
#include <jsi/jsi.h>
#include <memory>
#include <mutex>
#include <queue>
#include <string>
#include <thread>
#include <unordered_map>


namespace facebook {
namespace react {

class JSICallbackManager {
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

private:
    // === Structure pour les callbacks ===
    struct CallbackData {
        std::shared_ptr<jsi::Function> function;
        jsi::Runtime* runtime = nullptr;
        std::atomic<bool> isValid{false};
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
