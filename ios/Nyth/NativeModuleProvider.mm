#import "NativeAudioModuleProvider.h"
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>

// C++ includes for audio modules
#ifdef __cplusplus
#include "../../shared/Audio/capture/NativeAudioCaptureModule.h"
#include "../../shared/Audio/core/NativeAudioCoreModule.h"
#include "../../shared/NativeAudioEffectsModule.h"
#include "../../shared/NativeAudioNoiseModule.h"
#include "../../shared/NativeAudioPipelineModule.h"
#include "../../shared/NativeAudioSafetyModule.h"
#include "../../shared/NativeAudioSpectrumModule.h"
#include "../../shared/NativeAudioUtilsModule.h"
#include <memory>

#endif

@implementation NativeAudioEffectsModuleProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeAudioEffectsModule>(
      params.jsInvoker);
}

@end

@implementation NativeAudioNoiseModuleProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeAudioNoiseModule>(
      params.jsInvoker);
}

@end

@implementation NativeAudioSafetyModuleProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeAudioSafetyModule>(
      params.jsInvoker);
}

@end

@implementation NativeAudioCoreModuleProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeAudioCoreModule>(
      params.jsInvoker);
}

@end

@implementation NativeAudioUtilsModuleProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeAudioUtilsModule>(
      params.jsInvoker);
}

@end

@implementation NativeAudioPipelineModuleProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeAudioPipelineModule>(
      params.jsInvoker);
}

@end

@implementation NativeAudioCaptureModuleProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeAudioCaptureModule>(
      params.jsInvoker);
}

@end

@implementation NativeAudioSpectrumModuleProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeAudioSpectrumModule>(
      params.jsInvoker);
}

@end
