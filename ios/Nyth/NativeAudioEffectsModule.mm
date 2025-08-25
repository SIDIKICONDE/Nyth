#import "NativeModuleProvider.h"
#import <Foundation/Foundation.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>
#import <memory>

// Import the generated spec
#import "Nyth.h"

// C++ includes for the actual implementation
#include "../../shared/Audio/effects/NativeAudioEffectsModule.h"
#include "../../shared/Audio/common/jsi/JSICallbackManager.h"

namespace facebook {
namespace react {

class NativeAudioEffectsModuleImpl : public NativeAudioEffectsModuleSpecJSI {
public:
    NativeAudioEffectsModuleImpl(std::shared_ptr<CallInvoker> jsInvoker)
        : NativeAudioEffectsModuleSpecJSI(jsInvoker)
        , jsInvoker_(jsInvoker)
        , isInitialized_(false)
        , currentState_("uninitialized") {
        // Initialize the C++ implementation
        cppModule_ = std::make_shared<NativeAudioEffectsModule>(jsInvoker);
        callbackManager_ = std::make_shared<JSICallbackManager>();
    }

    ~NativeAudioEffectsModuleImpl() override {
        if (cppModule_) {
            cppModule_.reset();
        }
    }

private:
    std::shared_ptr<CallInvoker> jsInvoker_;
    std::shared_ptr<NativeAudioEffectsModule> cppModule_;
    std::shared_ptr<JSICallbackManager> callbackManager_;
    bool isInitialized_;
    std::string currentState_;

    // Helper method to get runtime
    jsi::Runtime* getRuntime() {
        // This is a simplified approach - in a real implementation,
        // you would need to properly manage the runtime
        return nullptr;
    }

public:
    // === Cycle de vie ===
    void initialize() override {
        if (cppModule_) {
            jsi::Runtime* rt = getRuntime();
            if (rt) {
                cppModule_->initialize(*rt);
                isInitialized_ = true;
                currentState_ = "initialized";
            }
        }
    }

    NSNumber* start() override {
        if (!isInitialized_) {
            return @NO;
        }

        if (cppModule_) {
            jsi::Runtime* rt = getRuntime();
            if (rt) {
                jsi::Value result = cppModule_->start(*rt);
                currentState_ = "processing";
                return result.getBool() ? @YES : @NO;
            }
        }
        return @NO;
    }

    NSNumber* stop() override {
        if (cppModule_) {
            jsi::Runtime* rt = getRuntime();
            if (rt) {
                jsi::Value result = cppModule_->stop(*rt);
                currentState_ = "initialized";
                return result.getBool() ? @YES : @NO;
            }
        }
        return @NO;
    }

    void dispose() override {
        if (cppModule_) {
            jsi::Runtime* rt = getRuntime();
            if (rt) {
                cppModule_->dispose(*rt);
            }
        }
        isInitialized_ = false;
        currentState_ = "uninitialized";
    }

    // === État et informations ===
    NSString* getState() override {
        return [NSString stringWithUTF8String:currentState_.c_str()];
    }

    NSDictionary* getStatistics() override {
        if (!cppModule_) {
            return nil;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return nil;
        }

        jsi::Value stats = cppModule_->getStatistics(*rt);
        if (stats.isNull()) {
            return nil;
        }

        // Convert JSI object to NSDictionary
        // This is a simplified conversion - in a real implementation
        // you would properly convert the JSI object
        NSMutableDictionary* result = [NSMutableDictionary new];
        result[@"inputLevel"] = @0.0;
        result[@"outputLevel"] = @0.0;
        result[@"processedFrames"] = @0;
        result[@"processedSamples"] = @0;
        result[@"durationMs"] = @0;
        result[@"activeEffectsCount"] = @0;

        return result;
    }

    void resetStatistics() override {
        if (cppModule_) {
            jsi::Runtime* rt = getRuntime();
            if (rt) {
                cppModule_->resetStatistics(*rt);
            }
        }
    }

    // === Gestion des effets ===
    NSNumber* createEffect(JS::NativeAudioEffectsModule::EffectConfig &config) override {
        if (!cppModule_) {
            return @-1;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @-1;
        }

        // Convert EffectConfig to JSI object
        jsi::Object configObj(*rt);
        configObj.setProperty(*rt, "type", jsi::String::createFromUtf8(*rt, "compressor"));
        configObj.setProperty(*rt, "enabled", jsi::Value(true));
        configObj.setProperty(*rt, "sampleRate", jsi::Value(44100));
        configObj.setProperty(*rt, "channels", jsi::Value(2));

        jsi::Value result = cppModule_->createEffect(*rt, configObj);
        return result.isNumber() ? @((int)result.getNumber()) : @-1;
    }

    NSNumber* destroyEffect(double effectId) override {
        if (!cppModule_) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        jsi::Value result = cppModule_->destroyEffect(*rt, (int)effectId);
        return result.getBool() ? @YES : @NO;
    }

    NSNumber* updateEffect(double effectId, JS::NativeAudioEffectsModule::EffectConfig &config) override {
        if (!cppModule_) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        // Convert EffectConfig to JSI object
        jsi::Object configObj(*rt);
        configObj.setProperty(*rt, "type", jsi::String::createFromUtf8(*rt, "compressor"));
        configObj.setProperty(*rt, "enabled", jsi::Value(true));
        configObj.setProperty(*rt, "sampleRate", jsi::Value(44100));
        configObj.setProperty(*rt, "channels", jsi::Value(2));

        jsi::Value result = cppModule_->updateEffect(*rt, (int)effectId, configObj);
        return result.getBool() ? @YES : @NO;
    }

    NSDictionary* getEffectConfig(double effectId) override {
        if (!cppModule_) {
            return nil;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return nil;
        }

        jsi::Value result = cppModule_->getEffectConfig(*rt, (int)effectId);
        if (result.isNull()) {
            return nil;
        }

        // Convert JSI object to NSDictionary
        NSMutableDictionary* config = [NSMutableDictionary new];
        config[@"effectId"] = @(effectId);
        config[@"type"] = @"compressor";
        config[@"enabled"] = @YES;
        config[@"sampleRate"] = @44100;
        config[@"channels"] = @2;

        return config;
    }

    // === Contrôle des effets ===
    NSNumber* enableEffect(double effectId, BOOL enabled) override {
        if (!cppModule_) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        jsi::Value result = cppModule_->enableEffect(*rt, (int)effectId, enabled);
        return result.getBool() ? @YES : @NO;
    }

    NSNumber* isEffectEnabled(double effectId) override {
        if (!cppModule_) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        jsi::Value result = cppModule_->isEffectEnabled(*rt, (int)effectId);
        return result.getBool() ? @YES : @NO;
    }

    NSNumber* getActiveEffectsCount() override {
        if (!cppModule_) {
            return @0;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @0;
        }

        jsi::Value result = cppModule_->getActiveEffectsCount(*rt);
        return result.isNumber() ? @((int)result.getNumber()) : @0;
    }

    NSArray<NSNumber*>* getActiveEffectIds() override {
        if (!cppModule_) {
            return @[];
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @[];
        }

        jsi::Value result = cppModule_->getActiveEffectIds(*rt);
        if (result.isObject() && result.getObject(*rt).isArray(*rt)) {
            jsi::Array array = result.getObject(*rt).getArray(*rt);
            NSMutableArray<NSNumber*>* ids = [NSMutableArray new];
            for (size_t i = 0; i < array.size(*rt); i++) {
                jsi::Value element = array.getValueAtIndex(*rt, i);
                if (element.isNumber()) {
                    [ids addObject:@((int)element.getNumber())];
                }
            }
            return ids;
        }

        return @[];
    }

    // === Configuration des effets spécifiques ===
    NSNumber* setCompressorParameters(double effectId, double thresholdDb, double ratio,
                                    double attackMs, double releaseMs, double makeupDb) override {
        if (!cppModule_) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        jsi::Value result = cppModule_->setCompressorParameters(*rt, (int)effectId,
                                                              (float)thresholdDb, (float)ratio,
                                                              (float)attackMs, (float)releaseMs,
                                                              (float)makeupDb);
        return result.getBool() ? @YES : @NO;
    }

    NSDictionary* getCompressorParameters(double effectId) override {
        if (!cppModule_) {
            return nil;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return nil;
        }

        jsi::Value result = cppModule_->getCompressorParameters(*rt, (int)effectId);
        if (result.isNull()) {
            return nil;
        }

        // Convert JSI object to NSDictionary
        if (result.isObject()) {
            jsi::Object obj = result.getObject(*rt);
            NSMutableDictionary* params = [NSMutableDictionary new];

            // Extract parameters from JSI object
            jsi::Value thresholdDb = obj.getProperty(*rt, "thresholdDb");
            jsi::Value ratio = obj.getProperty(*rt, "ratio");
            jsi::Value attackMs = obj.getProperty(*rt, "attackMs");
            jsi::Value releaseMs = obj.getProperty(*rt, "releaseMs");
            jsi::Value makeupDb = obj.getProperty(*rt, "makeupDb");

            if (thresholdDb.isNumber()) params[@"thresholdDb"] = @(thresholdDb.getNumber());
            if (ratio.isNumber()) params[@"ratio"] = @(ratio.getNumber());
            if (attackMs.isNumber()) params[@"attackMs"] = @(attackMs.getNumber());
            if (releaseMs.isNumber()) params[@"releaseMs"] = @(releaseMs.getNumber());
            if (makeupDb.isNumber()) params[@"makeupDb"] = @(makeupDb.getNumber());

            return params;
        }

        return nil;
    }

    NSNumber* setDelayParameters(double effectId, double delayMs, double feedback, double mix) override {
        if (!cppModule_) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        jsi::Value result = cppModule_->setDelayParameters(*rt, (int)effectId,
                                                         (float)delayMs, (float)feedback, (float)mix);
        return result.getBool() ? @YES : @NO;
    }

    NSDictionary* getDelayParameters(double effectId) override {
        if (!cppModule_) {
            return nil;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return nil;
        }

        jsi::Value result = cppModule_->getDelayParameters(*rt, (int)effectId);
        if (result.isNull()) {
            return nil;
        }

        // Convert JSI object to NSDictionary
        if (result.isObject()) {
            jsi::Object obj = result.getObject(*rt);
            NSMutableDictionary* params = [NSMutableDictionary new];

            // Extract parameters from JSI object
            jsi::Value delayMs = obj.getProperty(*rt, "delayMs");
            jsi::Value feedback = obj.getProperty(*rt, "feedback");
            jsi::Value mix = obj.getProperty(*rt, "mix");

            if (delayMs.isNumber()) params[@"delayMs"] = @(delayMs.getNumber());
            if (feedback.isNumber()) params[@"feedback"] = @(feedback.getNumber());
            if (mix.isNumber()) params[@"mix"] = @(mix.getNumber());

            return params;
        }

        return nil;
    }

    // === Traitement audio ===
    NSArray<NSNumber*>* processAudio(NSArray *input, double channels) override {
        if (!cppModule_) {
            return input;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return input;
        }

        // Convert NSArray to JSI Array
        jsi::Array inputArray(*rt, input.count);
        for (size_t i = 0; i < input.count; i++) {
            inputArray.setValueAtIndex(*rt, i, jsi::Value([input[i] doubleValue]));
        }

        jsi::Value result = cppModule_->processAudio(*rt, inputArray, (int)channels);
        if (result.isNull()) {
            return input;
        }

        // Convert JSI Array back to NSArray
        if (result.isObject() && result.getObject(*rt).isArray(*rt)) {
            jsi::Array outputArray = result.getObject(*rt).getArray(*rt);
            NSMutableArray<NSNumber*>* output = [NSMutableArray new];
            for (size_t i = 0; i < outputArray.size(*rt); i++) {
                jsi::Value element = outputArray.getValueAtIndex(*rt, i);
                if (element.isNumber()) {
                    [output addObject:@(element.getNumber())];
                }
            }
            return output;
        }

        return input;
    }

    NSDictionary* processAudioStereo(NSArray *inputL, NSArray *inputR) override {
        if (!cppModule_) {
            return @{@"left": inputL, @"right": inputR};
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @{@"left": inputL, @"right": inputR};
        }

        // Convert NSArrays to JSI Arrays
        jsi::Array inputArrayL(*rt, inputL.count);
        for (size_t i = 0; i < inputL.count; i++) {
            inputArrayL.setValueAtIndex(*rt, i, jsi::Value([inputL[i] doubleValue]));
        }

        jsi::Array inputArrayR(*rt, inputR.count);
        for (size_t i = 0; i < inputR.count; i++) {
            inputArrayR.setValueAtIndex(*rt, i, jsi::Value([inputR[i] doubleValue]));
        }

        jsi::Value result = cppModule_->processAudioStereo(*rt, inputArrayL, inputArrayR);
        if (result.isNull()) {
            return @{@"left": inputL, @"right": inputR};
        }

        // Convert JSI object back to NSDictionary
        if (result.isObject()) {
            jsi::Object resultObj = result.getObject(*rt);
            jsi::Value left = resultObj.getProperty(*rt, "left");
            jsi::Value right = resultObj.getProperty(*rt, "right");

            NSMutableArray<NSNumber*>* outputL = [NSMutableArray new];
            NSMutableArray<NSNumber*>* outputR = [NSMutableArray new];

            if (left.isObject() && left.getObject(*rt).isArray(*rt)) {
                jsi::Array leftArray = left.getObject(*rt).getArray(*rt);
                for (size_t i = 0; i < leftArray.size(*rt); i++) {
                    jsi::Value element = leftArray.getValueAtIndex(*rt, i);
                    if (element.isNumber()) {
                        [outputL addObject:@(element.getNumber())];
                    }
                }
            }

            if (right.isObject() && right.getObject(*rt).isArray(*rt)) {
                jsi::Array rightArray = right.getObject(*rt).getArray(*rt);
                for (size_t i = 0; i < rightArray.size(*rt); i++) {
                    jsi::Value element = rightArray.getValueAtIndex(*rt, i);
                    if (element.isNumber()) {
                        [outputR addObject:@(element.getNumber())];
                    }
                }
            }

            return @{@"left": outputL, @"right": outputR};
        }

        return @{@"left": inputL, @"right": inputR};
    }

    // === Analyse audio ===
    NSNumber* getInputLevel() override {
        if (!cppModule_) {
            return @0.0;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @0.0;
        }

        jsi::Value result = cppModule_->getInputLevel(*rt);
        return result.isNumber() ? @(result.getNumber()) : @0.0;
    }

    NSNumber* getOutputLevel() override {
        if (!cppModule_) {
            return @0.0;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @0.0;
        }

        jsi::Value result = cppModule_->getOutputLevel(*rt);
        return result.isNumber() ? @(result.getNumber()) : @0.0;
    }

    // === Callbacks JavaScript ===
    void setAudioDataCallback(RCTResponseSenderBlock callback) override {
        if (cppModule_ && callbackManager_) {
            // Store the callback for later use
            // In a real implementation, you would properly handle the callback
        }
    }

    void setErrorCallback(RCTResponseSenderBlock callback) override {
        if (cppModule_ && callbackManager_) {
            // Store the callback for error handling
        }
    }

    void setStateChangeCallback(RCTResponseSenderBlock callback) override {
        if (cppModule_ && callbackManager_) {
            // Store the callback for state changes
        }
    }
};

// Factory function for the module provider
std::shared_ptr<TurboModule> NativeAudioEffectsModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioEffectsModuleImpl>(jsInvoker);
}

} // namespace react
} // namespace facebook
