#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// TurboModule Providers for Audio Modules
// Updated to match existing modules in shared/Audio/

@protocol RCTTurboModule;

@interface NativeAudioCaptureModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(id)params;

@end

@interface NativeAudioCoreModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(id)params;

@end

@interface NativeAudioEffectsModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(id)params;

@end

@interface NativeAudioNoiseModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(id)params;

@end

@interface NativeAudioSafetyModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(id)params;

@end

@interface NativeAudioSpectrumModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(id)params;

@end

// Note: NativeAudioUtilsModuleProvider and NativeAudioPipelineModuleProvider
// are not implemented yet - commented out until modules are created

//@interface NativeAudioUtilsModuleProvider : NSObject <RCTTurboModule>
//
//- (id<RCTTurboModule>)getTurboModule:(id)params;
//
//@end
//
//@interface NativeAudioPipelineModuleProvider : NSObject <RCTTurboModule>
//
//- (id<RCTTurboModule>)getTurboModule:(id)params;
//
//@end

NS_ASSUME_NONNULL_END
