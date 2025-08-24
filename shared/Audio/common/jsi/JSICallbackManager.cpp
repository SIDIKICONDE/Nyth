#include "JSICallbackManager.h"
#include "../../common/config/AudioLimits.h"
#include "ReactCommon/TurboModuleUtils.h"
#include <cstring>
#include <sstream>
#include <vector>

namespace facebook {
namespace react {

// Classe helper pour créer des buffers de données
class SimpleBuffer {
public:
    SimpleBuffer(size_t size) : data_(size) {}
    uint8_t* data() {
        return data_.data();
    }
    size_t size() const {
        return data_.size();
    }

private:
    std::vector<uint8_t> data_;
};

JSICallbackManager::JSICallbackManager(std::shared_ptr<CallInvoker> jsInvoker) : jsInvoker_(jsInvoker) {
    startProcessingThread();
}

JSICallbackManager::~JSICallbackManager() {
    stopProcessingThread();
    clearAllCallbacks();
}

// === Configuration du runtime ===
void JSICallbackManager::setRuntime(jsi::Runtime* rt) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    runtime_ = rt;
    runtimeValid_.store(rt != nullptr);
}

void JSICallbackManager::invalidateRuntime() {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    runtimeValid_.store(false);
    runtime_ = nullptr;
}

// === Gestion des callbacks ===
void JSICallbackManager::setAudioDataCallback(const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    callbacks_["audioData"] = {std::make_shared<jsi::Function>(callback), runtime_, true};
}

void JSICallbackManager::setErrorCallback(const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    callbacks_["error"] = {std::make_shared<jsi::Function>(callback), runtime_, true};
}

void JSICallbackManager::setStateChangeCallback(const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    callbacks_["stateChange"] = {std::make_shared<jsi::Function>(callback), runtime_, true};
}

void JSICallbackManager::setAnalysisCallback(const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    callbacks_["analysis"] = {std::make_shared<jsi::Function>(callback), runtime_, true};
}

void JSICallbackManager::removeCallback(const std::string& name) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    auto it = callbacks_.find(name);
    if (it != callbacks_.end()) {
        it->second.isValid.store(false);
        callbacks_.erase(it);
    }
}

void JSICallbackManager::clearAllCallbacks() {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    for (auto& pair : callbacks_) {
        pair.second.isValid.store(false);
    }
    callbacks_.clear();
}

// === Invocation des callbacks ===
void JSICallbackManager::invokeAudioDataCallback(const float* data, size_t frameCount, int channels) {
    if (!hasCallback("audioData") || !runtimeValid_.load()) {
        return;
    }

    // Validation des données
    validateAudioData(data, frameCount, channels);

    // Copie des données pour l'invocation asynchrone
    size_t totalSamples = frameCount * channels;
    std::vector<float> dataCopy(data, data + totalSamples);

    enqueueInvocation("audioData",
                      [this, dataCopy = std::move(dataCopy), frameCount, channels](jsi::Runtime& rt) mutable {
                          auto callbackData = getCallback("audioData");
                          if (!callbackData.isValid.load() || !callbackData.function) {
                              return;
                          }

                          try {
                              // Vérifier que Float32Array existe
                              if (!rt.global().hasProperty(rt, "Float32Array")) {
                                  throw jsi::JSError(rt, "Float32Array not available in this environment");
                              }

                              // Limiter la taille pour la sécurité
                              size_t totalBytes = dataCopy.size() * sizeof(float);
                              if (totalBytes > Nyth::Audio::Limits::MAX_BUFFER_SIZE * sizeof(float)) {
                                  throw jsi::JSError(rt, "Buffer size exceeds maximum allowed");
                              }

                              // Créer ArrayBuffer et Float32Array
                              auto buffer = std::make_shared<SimpleBuffer>(totalBytes);

                              // Copier les données dans le buffer
                              std::memcpy(buffer->data(), dataCopy.data(), totalBytes);

                              // Créer ArrayBuffer à partir du buffer
                              auto arrayBuffer = jsi::ArrayBuffer(rt, buffer->data(), totalBytes);

                              // Créer Float32Array
                              auto float32ArrayCtor = rt.global().getPropertyAsFunction(rt, "Float32Array");
                              auto float32Array = float32ArrayCtor.callAsConstructor(rt, arrayBuffer).asObject(rt);

                              // Appeler le callback
                              callbackData.function->call(rt, float32Array, jsi::Value(static_cast<int>(frameCount)),
                                                          jsi::Value(channels));

                          } catch (const jsi::JSError& e) {
                              // Logger l'erreur mais ne pas la propager
                              if (hasCallback("error")) {
                                  invokeErrorCallback(std::string("JS audio callback error: ") + e.getMessage());
                              }
                          } catch (const std::exception& e) {
                              if (hasCallback("error")) {
                                  invokeErrorCallback(std::string("Native audio callback error: ") + e.what());
                              }
                          }
                      });
}

void JSICallbackManager::invokeErrorCallback(const std::string& error) {
    if (!hasCallback("error") || !runtimeValid_.load()) {
        return;
    }

    std::string errorCopy = error;
    enqueueInvocation("error", [this, errorCopy](jsi::Runtime& rt) {
        auto callbackData = getCallback("error");
        if (!callbackData.isValid.load() || !callbackData.function) {
            return;
        }

        try {
            callbackData.function->call(rt, jsi::String::createFromUtf8(rt, errorCopy));
        } catch (const jsi::JSError& e) {
            // Éviter les boucles d'erreur infinies
        } catch (const std::exception& e) {
            // Logger silencieusement
        }
    });
}

void JSICallbackManager::invokeStateChangeCallback(const std::string& oldState, const std::string& newState) {
    if (!hasCallback("stateChange") || !runtimeValid_.load()) {
        return;
    }

    std::string oldStateCopy = oldState;
    std::string newStateCopy = newState;

    enqueueInvocation("stateChange", [this, oldStateCopy, newStateCopy](jsi::Runtime& rt) {
        auto callbackData = getCallback("stateChange");
        if (!callbackData.isValid.load() || !callbackData.function) {
            return;
        }

        try {
            callbackData.function->call(rt, jsi::String::createFromUtf8(rt, oldStateCopy),
                                        jsi::String::createFromUtf8(rt, newStateCopy));
        } catch (const jsi::JSError& e) {
            if (hasCallback("error")) {
                invokeErrorCallback(std::string("JS state change callback error: ") + e.getMessage());
            }
        } catch (const std::exception& e) {
            if (hasCallback("error")) {
                invokeErrorCallback(std::string("Native state change callback error: ") + e.what());
            }
        }
    });
}

void JSICallbackManager::invokeAnalysisCallback(const jsi::Object& analysisData) {
    if (!hasCallback("analysis") || !runtimeValid_.load()) {
        return;
    }

    // Copie de l'objet pour l'invocation asynchrone
    auto analysisCopy = std::make_shared<jsi::Object>(analysisData);

    enqueueInvocation("analysis", [this, analysisCopy](jsi::Runtime& rt) {
        auto callbackData = getCallback("analysis");
        if (!callbackData.isValid.load() || !callbackData.function) {
            return;
        }

        try {
            callbackData.function->call(rt, *analysisCopy);
        } catch (const jsi::JSError& e) {
            if (hasCallback("error")) {
                invokeErrorCallback(std::string("JS analysis callback error: ") + e.getMessage());
            }
        } catch (const std::exception& e) {
            if (hasCallback("error")) {
                invokeErrorCallback(std::string("Native analysis callback error: ") + e.what());
            }
        }
    });
}

// === Gestion de la file d'attente ===
void JSICallbackManager::setMaxQueueSize(size_t maxSize) {
    maxQueueSize_.store(maxSize);
}

size_t JSICallbackManager::getQueueSize() const {
    std::lock_guard<std::mutex> lock(queueMutex_);
    return invocationQueue_.size();
}

bool JSICallbackManager::isQueueFull() const {
    return getQueueSize() >= maxQueueSize_.load();
}

// === Méthodes privées ===
void JSICallbackManager::startProcessingThread() {
    shouldStop_.store(false);
    processingThread_ = std::thread(&JSICallbackManager::processingThreadLoop, this);
}

void JSICallbackManager::stopProcessingThread() {
    shouldStop_.store(true);
    queueCV_.notify_all();

    if (processingThread_.joinable()) {
        processingThread_.join();
    }
}

void JSICallbackManager::processingThreadLoop() {
    while (!shouldStop_.load()) {
        std::unique_lock<std::mutex> lock(queueMutex_);
        queueCV_.wait(lock, [this]() { return shouldStop_.load() || !invocationQueue_.empty(); });

        if (shouldStop_.load()) {
            break;
        }

        if (!invocationQueue_.empty()) {
            auto invocation = std::move(invocationQueue_.front());
            invocationQueue_.pop();
            lock.unlock();

            // Traiter l'invocation si le runtime est valide
            if (runtimeValid_.load() && jsInvoker_) {
                jsInvoker_->invokeAsync(std::move(invocation.invocation));
            }
        }
    }
}

void JSICallbackManager::enqueueInvocation(const std::string& callbackName,
                                           std::function<void(jsi::Runtime&)> invocation) {
    std::lock_guard<std::mutex> lock(queueMutex_);

    // Limiter la taille de la queue
    if (invocationQueue_.size() >= maxQueueSize_.load()) {
        // Supprimer les anciens éléments si nécessaire
        while (invocationQueue_.size() >= maxQueueSize_.load() / 2) {
            invocationQueue_.pop();
        }
    }

    invocationQueue_.push({callbackName, std::move(invocation)});
    queueCV_.notify_one();
}

bool JSICallbackManager::hasCallback(const std::string& name) const {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    auto it = callbacks_.find(name);
    return it != callbacks_.end() && it->second.isValid.load() && it->second.function != nullptr;
}

JSICallbackManager::CallbackData JSICallbackManager::getCallback(const std::string& name) const {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    auto it = callbacks_.find(name);
    if (it != callbacks_.end()) {
        return it->second;
    }
    return {};
}

void JSICallbackManager::validateAudioData(const float* data, size_t frameCount, int channels) const {
    if (!data) {
        throw std::runtime_error("Audio data pointer is null");
    }
    if (frameCount == 0) {
        throw std::runtime_error("Frame count cannot be zero");
    }
    if (channels <= 0 || channels > Nyth::Audio::Limits::MAX_CHANNELS) {
        throw std::runtime_error("Invalid channel count: " + std::to_string(channels));
    }

    size_t totalSamples = frameCount * channels;
    if (totalSamples > Nyth::Audio::Limits::MAX_BUFFER_SIZE) {
        throw std::runtime_error("Audio buffer too large: " + std::to_string(totalSamples) + " samples");
    }
}

void JSICallbackManager::invokeCallback(const std::string& callbackName,
                                        std::function<jsi::Value(jsi::Runtime&)> callback) {
    if (!hasCallback(callbackName) || !runtimeValid_.load()) {
        return;
    }

    enqueueInvocation(callbackName, [this, callbackName, callback](jsi::Runtime& rt) mutable {
        auto callbackData = getCallback(callbackName);
        if (!callbackData.isValid.load() || !callbackData.function) {
            return;
        }

        try {
            jsi::Value result = callback(rt);
            callbackData.function->call(rt, result);
        } catch (const jsi::JSError& e) {
            // Logger l'erreur mais ne pas la propager
            if (hasCallback("error")) {
                invokeErrorCallback(std::string("JS callback error in ") + callbackName + ": " + e.getMessage());
            }
        } catch (const std::exception& e) {
            if (hasCallback("error")) {
                invokeErrorCallback(std::string("Native callback error in ") + callbackName + ": " + e.what());
            }
        }
    });
}

} // namespace react
} // namespace facebook
