#pragma once

#include <memory>
#include <mutex>

// Forward declare the module classes to avoid circular dependencies
namespace facebook { namespace react {
    class NativeAudioEffectsModule;
}}

namespace Nyth {
namespace Audio {

class AudioModuleRegistry {
public:
    static void registerEffectsModule(std::weak_ptr<facebook::react::NativeAudioEffectsModule> module) {
        std::lock_guard<std::mutex> lock(mutex_);
        effectsModule_ = module;
    }

    static std::shared_ptr<facebook::react::NativeAudioEffectsModule> getEffectsModule() {
        std::lock_guard<std::mutex> lock(mutex_);
        return effectsModule_.lock();
    }

private:
    static std::mutex mutex_;
    static std::weak_ptr<facebook::react::NativeAudioEffectsModule> effectsModule_;
};

} // namespace Audio
} // namespace Nyth
