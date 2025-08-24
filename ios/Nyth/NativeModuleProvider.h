#import <Foundation/Foundation.h>
#import <ReactCommon/RCTTurboModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface NativeAudioEffectsModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(const RCTTurboModuleInitParams &)params;

@end

@interface NativeAudioNoiseModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(const RCTTurboModuleInitParams &)params;

@end

@interface NativeAudioSafetyModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(const RCTTurboModuleInitParams &)params;

@end

@interface NativeAudioCoreModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(const RCTTurboModuleInitParams &)params;

@end

@interface NativeAudioUtilsModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(const RCTTurboModuleInitParams &)params;

@end

@interface NativeAudioPipelineModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(const RCTTurboModuleInitParams &)params;

@end

@interface NativeAudioCaptureModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(const RCTTurboModuleInitParams &)params;

@end

@interface NativeAudioSpectrumModuleProvider : NSObject <RCTTurboModule>

- (id<RCTTurboModule>)getTurboModule:(const RCTTurboModuleInitParams &)params;

@end

NS_ASSUME_NONNULL_END
