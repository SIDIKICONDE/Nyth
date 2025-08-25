#include "AudioModuleRegistry.h"

namespace Nyth {
namespace Audio {

// Initialize static members
std::mutex AudioModuleRegistry::mutex_;
std::weak_ptr<facebook::react::NativeAudioEffectsModule> AudioModuleRegistry::effectsModule_;
std::weak_ptr<facebook::react::NativeAudioCaptureModule> AudioModuleRegistry::captureModule_;

} // namespace Audio
} // namespace Nyth
