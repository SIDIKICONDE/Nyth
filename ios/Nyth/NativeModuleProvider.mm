#import "NativeModuleProvider.h"
#import <ReactCommon/RCTTurboModule.h>
#import <memory>

// C++ includes for audio modules
#ifdef __cplusplus

#include "../../shared/Audio/core/NativeAudioCoreModule.h"
#include "../../shared/Audio/effects/NativeAudioEffectsModule.h"
#include "../../shared/Audio/noise/NativeAudioNoiseModule.h"
#include "../../shared/Audio/safety/NativeAudioSafetyModule.h"
#include "../../shared/Audio/fft/NativeAudioSpectrumModule.h"
#endif

@implementation NativeAudioCaptureModuleProvider

- (id<RCTTurboModule>)getTurboModule:(id)params {
#if NYTH_AUDIO_CAPTURE_ENABLED && defined(__cplusplus)
  if ([params respondsToSelector:@selector(jsInvoker)]) {
    id jsInvoker = [params jsInvoker];
    // Create instance directly since provider may not exist
    return facebook::react::NativeAudioCaptureModuleProvider(
        std::dynamic_pointer_cast<facebook::react::CallInvoker>(jsInvoker));
  }
#endif
  return nullptr;
}

@end

@implementation NativeAudioCoreModuleProvider

- (id<RCTTurboModule>)getTurboModule:(id)params {
#ifdef __cplusplus
  if ([params respondsToSelector:@selector(jsInvoker)]) {
    id jsInvoker = [params jsInvoker];
    // NativeAudioCoreModuleProvider exists in .cpp
    return facebook::react::NativeAudioCoreModuleProvider(
        std::dynamic_pointer_cast<facebook::react::CallInvoker>(jsInvoker));
  }
#endif
  return nullptr;
}

@end

@implementation NativeAudioEffectsModuleProvider

- (id<RCTTurboModule>)getTurboModule:(id)params {
#ifdef __cplusplus
  if ([params respondsToSelector:@selector(jsInvoker)]) {
    id jsInvoker = [params jsInvoker];
    // Use the provider function that exists
    return facebook::react::NativeAudioEffectsModuleProvider(
        std::dynamic_pointer_cast<facebook::react::CallInvoker>(jsInvoker));
  }
#endif
  return nullptr;
}

@end

@implementation NativeAudioNoiseModuleProvider

- (id<RCTTurboModule>)getTurboModule:(id)params {
#ifdef __cplusplus
  if ([params respondsToSelector:@selector(jsInvoker)]) {
    id jsInvoker = [params jsInvoker];
    // Use the provider function that exists
    return facebook::react::NativeAudioNoiseModuleProvider(
        std::dynamic_pointer_cast<facebook::react::CallInvoker>(jsInvoker));
  }
#endif
  return nullptr;
}

@end

@implementation NativeAudioSafetyModuleProvider

- (id<RCTTurboModule>)getTurboModule:(id)params {
#ifdef __cplusplus
  if ([params respondsToSelector:@selector(jsInvoker)]) {
    id jsInvoker = [params jsInvoker];
    // Use the provider function that exists
    return facebook::react::NativeAudioSafetyModuleProvider(
        std::dynamic_pointer_cast<facebook::react::CallInvoker>(jsInvoker));
  }
#endif
  return nullptr;
}

@end

@implementation NativeAudioSpectrumModuleProvider

- (id<RCTTurboModule>)getTurboModule:(id)params {
#ifdef __cplusplus
  if ([params respondsToSelector:@selector(jsInvoker)]) {
    id jsInvoker = [params jsInvoker];
    // Create instance directly since provider may not exist
    return std::make_shared<facebook::react::NativeAudioSpectrumModule>(
        std::dynamic_pointer_cast<facebook::react::CallInvoker>(jsInvoker));
  }
#endif
  return nullptr;
}

@end

// Note: NativeAudioUtilsModuleProvider and NativeAudioPipelineModuleProvider
// are not implemented yet - commented out until modules are created

//@implementation NativeAudioUtilsModuleProvider
//
//- (id<RCTTurboModule>)getTurboModule:(id)params {
//  // TODO: Implement when provider function is available
//  return nullptr;
//}
//
//@end
//
//@implementation NativeAudioPipelineModuleProvider
//
//- (id<RCTTurboModule>)getTurboModule:(id)params {
//  // TODO: Implement when provider function is available
//  return nullptr;
//}
//
//@end
