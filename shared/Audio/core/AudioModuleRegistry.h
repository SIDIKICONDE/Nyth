#pragma once

#include <memory>
#include <mutex>

// Forward declare the module classes to avoid circular dependencies
namespace facebook { namespace react {
    class NativeAudioEffectsModule;
    class NativeAudioCaptureModule;
}}

namespace Nyth {
namespace Audio {

class AudioModuleRegistry {
public:
    static void registerEffectsModule(std::weak_ptr<facebook::react::NativeAudioEffectsModule> module) {
        std::lock_guard<std::mutex> lock(mutex_);
        effectsModule_ = module;
    }

    static void registerCaptureModule(std::weak_ptr<facebook::react::NativeAudioCaptureModule> module) {
        std::lock_guard<std::mutex> lock(mutex_);
        captureModule_ = module;
    }

    static std::shared_ptr<facebook::react::NativeAudioEffectsModule> getEffectsModule() {
        std::lock_guard<std::mutex> lock(mutex_);
        return effectsModule_.lock();
    }

    static std::shared_ptr<facebook::react::NativeAudioCaptureModule> getCaptureModule() {
        std::lock_guard<std::mutex> lock(mutex_);
        return captureModule_.lock();
    }

private:
    static std::mutex mutex_;
    static std::weak_ptr<facebook::react::NativeAudioEffectsModule> effectsModule_;
    static std::weak_ptr<facebook::react::NativeAudioCaptureModule> captureModule_;
};

} // namespace Audio
} // namespace Nyth
