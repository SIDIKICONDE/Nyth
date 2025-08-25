/**
 * Exemple d'intégration du module AudioRecorder dans un TurboModule React Native
 * 
 * Ce fichier montre comment wrapper la classe Swift AudioRecorder
 * pour l'exposer à JavaScript via l'architecture TurboModule
 */

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// Import du module Swift via le bridging header
#import "AudioModule-Swift.h"

// Protocole TurboModule (à générer via codegen)
@protocol AudioModuleSpec <NSObject>
- (void)startRecording:(NSDictionary *)options
              resolver:(RCTPromiseResolveBlock)resolve
              rejecter:(RCTPromiseRejectBlock)reject;
- (void)stopRecording:(RCTPromiseResolveBlock)resolve
             rejecter:(RCTPromiseRejectBlock)reject;
- (void)pauseRecording:(RCTPromiseResolveBlock)resolve
              rejecter:(RCTPromiseRejectBlock)reject;
- (void)resumeRecording:(RCTPromiseResolveBlock)resolve
               rejecter:(RCTPromiseRejectBlock)reject;
- (NSDictionary *)getRecordingStatus;
- (void)configureAudioOptions:(NSDictionary *)options
                     resolver:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject;
@end

// Implémentation du TurboModule
@interface AudioModuleTurboModule : RCTEventEmitter <RCTBridgeModule, AudioModuleSpec, AudioRecorderDelegate>
@property (nonatomic, strong) AudioRecorder *audioRecorder;
@property (nonatomic, assign) BOOL hasListeners;
@end

@implementation AudioModuleTurboModule

RCT_EXPORT_MODULE(AudioModule)

- (instancetype)init {
    if (self = [super init]) {
        _audioRecorder = [[AudioRecorder alloc] init];
        _audioRecorder.delegate = self;
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

// MARK: - Exported Methods

RCT_EXPORT_METHOD(startRecording:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self.audioRecorder startRecordingWithOptions:options
                                         resolver:resolve
                                         rejecter:reject];
}

RCT_EXPORT_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    [self.audioRecorder stopRecordingWithResolver:resolve
                                         rejecter:reject];
}

RCT_EXPORT_METHOD(pauseRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self.audioRecorder pauseRecordingWithResolver:resolve
                                          rejecter:reject];
}

RCT_EXPORT_METHOD(resumeRecording:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject) {
    [self.audioRecorder resumeRecordingWithResolver:resolve
                                           rejecter:reject];
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSDictionary *, getRecordingStatus) {
    return [self.audioRecorder getRecordingStatus];
}

RCT_EXPORT_METHOD(configureAudioOptions:(NSDictionary *)options
                         resolver:(RCTPromiseResolveBlock)resolve
                         rejecter:(RCTPromiseRejectBlock)reject) {
    [self.audioRecorder configureAudioOptions:options
                                     resolver:resolve
                                     rejecter:reject];
}

// MARK: - Event Emitter

- (NSArray<NSString *> *)supportedEvents {
    return @[
        @"recordingStarted",
        @"recordingStopped",
        @"recordingPaused",
        @"recordingResumed",
        @"audioLevel",
        @"error"
    ];
}

- (void)startObserving {
    self.hasListeners = YES;
}

- (void)stopObserving {
    self.hasListeners = NO;
}

// MARK: - AudioRecorderDelegate

- (void)audioRecorderDidConfigureSession:(AudioRecorder *)recorder {
    // Optionnel : émettre un événement si nécessaire
}

- (void)audioRecorderDidStartRecording:(AudioRecorder *)recorder {
    if (self.hasListeners) {
        [self sendEventWithName:@"recordingStarted" body:@{}];
    }
}

- (void)audioRecorderDidPauseRecording:(AudioRecorder *)recorder {
    if (self.hasListeners) {
        [self sendEventWithName:@"recordingPaused" body:@{}];
    }
}

- (void)audioRecorderDidResumeRecording:(AudioRecorder *)recorder {
    if (self.hasListeners) {
        [self sendEventWithName:@"recordingResumed" body:@{}];
    }
}

- (void)audioRecorder:(AudioRecorder *)recorder didFinishRecordingToURL:(NSURL *)url {
    if (self.hasListeners) {
        // Calcule la durée si possible
        NSNumber *duration = nil;
        AVAudioFile *audioFile = [[AVAudioFile alloc] initForReading:url error:nil];
        if (audioFile) {
            double durationValue = (double)audioFile.length / audioFile.fileFormat.sampleRate;
            duration = @(durationValue);
        }
        
        NSMutableDictionary *body = [@{
            @"filePath": url.path
        } mutableCopy];
        
        if (duration) {
            body[@"duration"] = duration;
        }
        
        [self sendEventWithName:@"recordingStopped" body:body];
    }
}

- (void)audioRecorder:(AudioRecorder *)recorder didUpdateAudioLevel:(float)level {
    if (self.hasListeners) {
        [self sendEventWithName:@"audioLevel" body:@{@"level": @(level)}];
    }
}

- (void)audioRecorder:(AudioRecorder *)recorder didFailWithError:(AudioRecorderError)error {
    if (self.hasListeners) {
        [self sendEventWithName:@"error" body:@{
            @"code": @(error),
            @"message": [self errorMessageForError:error]
        }];
    }
}

// MARK: - Helpers

- (NSString *)errorMessageForError:(AudioRecorderError)error {
    switch (error) {
        case AudioRecorderErrorSetupFailed:
            return @"Failed to setup audio engine";
        case AudioRecorderErrorSessionConfigurationFailed:
            return @"Failed to configure audio session";
        case AudioRecorderErrorPermissionDenied:
            return @"Microphone permission denied";
        case AudioRecorderErrorAlreadyRecording:
            return @"Already recording";
        case AudioRecorderErrorNotRecording:
            return @"Not currently recording";
        case AudioRecorderErrorInvalidFormat:
            return @"Invalid audio format";
        case AudioRecorderErrorFileCreationFailed:
            return @"Failed to create audio file";
        case AudioRecorderErrorInputNodeUnavailable:
            return @"Audio input node unavailable";
        case AudioRecorderErrorEngineUnavailable:
            return @"Audio engine unavailable";
        case AudioRecorderErrorEngineStartFailed:
            return @"Failed to start audio engine";
        case AudioRecorderErrorWriteFailed:
            return @"Failed to write audio data";
        default:
            return @"Unknown error";
    }
}

@end

/**
 * Configuration du Bridging Header (AudioModule-Bridging-Header.h) :
 * 
 * #import <React/RCTBridgeModule.h>
 * #import <React/RCTEventEmitter.h>
 * 
 * Configuration du module Swift (AudioModule.h) :
 * 
 * #import <Foundation/Foundation.h>
 * // Exposer les classes Swift nécessaires
 */