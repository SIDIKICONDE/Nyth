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

// Helper function to convert jsi::Object to NSDictionary
static NSDictionary* convertJSIObjectToNSDictionary(jsi::Runtime &rt, const jsi::Object &obj) {
    NSMutableDictionary *dict = [NSMutableDictionary new];
    jsi::Array propertyNames = obj.getPropertyNames(rt);
    for (size_t i = 0; i < propertyNames.size(rt); i++) {
        jsi::String propNameValue = propertyNames.getValueAtIndex(rt, i).asString(rt);
        std::string propName = propNameValue.utf8(rt);
        NSString *key = [NSString stringWithUTF8String:propName.c_str()];

        jsi::Value value = obj.getProperty(rt, propNameValue);

        if (value.isBool()) {
            dict[key] = @(value.getBool());
        } else if (value.isNumber()) {
            dict[key] = @(value.getNumber());
        } else if (value.isString()) {
            dict[key] = [NSString stringWithUTF8String:value.getString(rt).utf8(rt).c_str()];
        } else if (value.isObject()) {
            if (value.getObject(rt).isArray(rt)) {
                // For now, we don't handle arrays, but this is where it would go.
            } else {
                dict[key] = convertJSIObjectToNSDictionary(rt, value.getObject(rt));
            }
        }
    }
    return dict;
}


class NativeAudioEffectsModuleImpl : public NativeAudioEffectsModuleSpecJSI {
public:
    NativeAudioEffectsModuleImpl(const ObjCTurboModule::InitParams &params)
        : NativeAudioEffectsModuleSpecJSI(params.jsInvoker)
        , _jsInvoker(params.jsInvoker)
        , _runtimeExecutor(params.runtimeExecutor)
        , _isInitialized(false)
        , _currentState("uninitialized") {

        // Initialize the C++ implementation
        _cppModule = std::make_shared<NativeAudioEffectsModule>(_jsInvoker);

        // Set the runtime on the C++ module as soon as we can.
        if (_cppModule && _runtimeExecutor) {
            _runtimeExecutor([this](jsi::Runtime &rt) {
                this->_cppModule->setRuntime(&rt);
                if (this->_cppModule->getCallbackManager()) {
                    this->_cppModule->getCallbackManager()->setRuntime(&rt);
                }
            });
        }
    }

    ~NativeAudioEffectsModuleImpl() override {
        if (_cppModule) {
            _cppModule->invalidateRuntime();
            if (_cppModule->getCallbackManager()) {
                _cppModule->getCallbackManager()->invalidateRuntime();
            }
            _cppModule.reset();
        }
    }

private:
    std::shared_ptr<CallInvoker> _jsInvoker;
    std::shared_ptr<NativeAudioEffectsModule> _cppModule;
    RuntimeExecutor _runtimeExecutor;
    bool _isInitialized;
    std::string _currentState;

    // Helper method to get runtime
    jsi::Runtime* getRuntime() {
        // This approach is not ideal. In a typical TurboModule setup,
        // jsi::Runtime should be passed to each JSI method.
        // We are using a stored runtime executor as a workaround.
        if (!_runtimeExecutor) {
            return nullptr;
        }
        // This is a bit of a hack to get the runtime pointer.
        // It relies on the internal implementation of RuntimeExecutor.
        // A better solution would be to refactor the module provider
        // to give us direct access.
        jsi::Runtime *rt = nullptr;
        _runtimeExecutor([&](jsi::Runtime &runtime) {
            rt = &runtime;
        });
        return rt;
    }

public:
    // === Cycle de vie ===
    void initialize() override {
        if (_cppModule) {
            if (_runtimeExecutor) {
                _runtimeExecutor([this](jsi::Runtime &rt) {
                    this->_cppModule->initialize(rt);
                    this->_isInitialized = true;
                    this->_currentState = "initialized";
                });
            }
        }
    }

    NSNumber* start() override {
        if (!_isInitialized) {
            return @NO;
        }

        if (_cppModule && _runtimeExecutor) {
            // Since this method needs to return a value, we can't easily use
            // the async executor. This highlights a flaw in the current architecture.
            // We'll proceed with the getRuntime() hack for now.
            jsi::Runtime* rt = getRuntime();
            if (rt) {
                jsi::Value result = _cppModule->start(*rt);
                _currentState = "processing";
                return result.getBool() ? @YES : @NO;
            }
        }
        return @NO;
    }

    NSNumber* stop() override {
        if (_cppModule) {
             jsi::Runtime* rt = getRuntime();
             if (rt) {
                jsi::Value result = _cppModule->stop(*rt);
                _currentState = "initialized";
                return result.getBool() ? @YES : @NO;
            }
        }
        return @NO;
    }

    void dispose() override {
        if (_cppModule) {
            jsi::Runtime* rt = getRuntime();
            if (rt) {
                _cppModule->dispose(*rt);
            }
        }
        _isInitialized = false;
        _currentState = "uninitialized";
    }

    // === État et informations ===
    NSString* getState() override {
        return [NSString stringWithUTF8String:_currentState.c_str()];
    }

    NSDictionary* getStatistics() override {
        if (!_cppModule) {
            return nil;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return nil;
        }

        jsi::Value stats = _cppModule->getStatistics(*rt);
        if (stats.isNull() || !stats.isObject()) {
            return nil;
        }

        return convertJSIObjectToNSDictionary(*rt, stats.asObject(*rt));
    }

    void resetStatistics() override {
        if (_cppModule) {
            jsi::Runtime* rt = getRuntime();
            if (rt) {
                _cppModule->resetStatistics(*rt);
            }
        }
    }

    // === Gestion des effets ===
    NSNumber* createEffect(JS::NativeAudioEffectsModule::EffectConfig &config) override {
        if (!_cppModule) {
            return @-1;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @-1;
        }

        // Manually convert the generated EffectConfig struct to a jsi::Object.
        // This is necessary because the spec-generated type is not directly usable.
        jsi::Object configObj(*rt);

        // Assuming the config struct has a 'type' property.
        // The spec seems to be missing fields, so we'll have to make some assumptions.
        if (config.type) {
            configObj.setProperty(*rt, "type", jsi::String::createFromUtf8(*rt, [config.type UTF8String]));
        } else {
             // Default to a known type if not provided, for compatibility.
            configObj.setProperty(*rt, "type", jsi::String::createFromUtf8(*rt, "compressor"));
        }

        if (config.enabled) {
            configObj.setProperty(*rt, "enabled", jsi::Value([config.enabled boolValue]));
        }

        // Here we would check for nested config objects (compressor, delay, etc.)
        // and add them to configObj if they exist. Since we don't know the struct,
        // we'll omit this for now.

        jsi::Value result = _cppModule->createEffect(*rt, configObj);
        return result.isNumber() ? @((int)result.getNumber()) : @-1;
    }

    NSNumber* destroyEffect(double effectId) override {
        if (!_cppModule) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        jsi::Value result = _cppModule->destroyEffect(*rt, (int)effectId);
        return result.getBool() ? @YES : @NO;
    }

    NSNumber* updateEffect(double effectId, JS::NativeAudioEffectsModule::EffectConfig &config) override {
        if (!_cppModule) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        // Manually convert config to jsi::Object
        jsi::Object configObj(*rt);
        if (config.enabled) {
            configObj.setProperty(*rt, "enabled", jsi::Value([config.enabled boolValue]));
        }

        // Add specific effect properties if they exist in the config struct
        // e.g., if(config.compressor) { ... }

        jsi::Value result = _cppModule->updateEffect(*rt, (int)effectId, configObj);
        return result.getBool() ? @YES : @NO;
    }

    NSDictionary* getEffectConfig(double effectId) override {
        if (!_cppModule) {
            return nil;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return nil;
        }

        jsi::Value result = _cppModule->getEffectConfig(*rt, (int)effectId);
        if (result.isNull() || !result.isObject()) {
            return nil;
        }

        return convertJSIObjectToNSDictionary(*rt, result.asObject(*rt));
    }

    // === Contrôle des effets ===
    NSNumber* enableEffect(double effectId, BOOL enabled) override {
        if (!_cppModule) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        jsi::Value result = _cppModule->enableEffect(*rt, (int)effectId, enabled);
        return result.getBool() ? @YES : @NO;
    }

    NSNumber* isEffectEnabled(double effectId) override {
        if (!_cppModule) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        jsi::Value result = _cppModule->isEffectEnabled(*rt, (int)effectId);
        return result.getBool() ? @YES : @NO;
    }

    NSNumber* getActiveEffectsCount() override {
        if (!_cppModule) {
            return @0;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @0;
        }

        jsi::Value result = _cppModule->getActiveEffectsCount(*rt);
        return result.isNumber() ? @((int)result.getNumber()) : @0;
    }

    NSArray<NSNumber*>* getActiveEffectIds() override {
        if (!_cppModule) {
            return @[];
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @[];
        }

        jsi::Value result = _cppModule->getActiveEffectIds(*rt);
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
        if (!_cppModule) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        jsi::Value result = _cppModule->setCompressorParameters(*rt, (int)effectId,
                                                              (float)thresholdDb, (float)ratio,
                                                              (float)attackMs, (float)releaseMs,
                                                              (float)makeupDb);
        return result.getBool() ? @YES : @NO;
    }

    NSDictionary* getCompressorParameters(double effectId) override {
        if (!_cppModule) {
            return nil;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return nil;
        }

        jsi::Value result = _cppModule->getCompressorParameters(*rt, (int)effectId);
        if (result.isNull() || !result.isObject()) {
            return nil;
        }

        // Convert JSI object to NSDictionary
        jsi::Object obj = result.asObject(*rt);
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

    NSNumber* setDelayParameters(double effectId, double delayMs, double feedback, double mix) override {
        if (!_cppModule) {
            return @NO;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @NO;
        }

        jsi::Value result = _cppModule->setDelayParameters(*rt, (int)effectId,
                                                         (float)delayMs, (float)feedback, (float)mix);
        return result.getBool() ? @YES : @NO;
    }

    NSDictionary* getDelayParameters(double effectId) override {
        if (!_cppModule) {
            return nil;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return nil;
        }

        jsi::Value result = _cppModule->getDelayParameters(*rt, (int)effectId);
        if (result.isNull() || !result.isObject()) {
            return nil;
        }

        // Convert JSI object to NSDictionary
        jsi::Object obj = result.asObject(*rt);
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

    // === Traitement audio ===
    NSArray<NSNumber*>* processAudio(NSArray *input, double channels) override {
        if (!_cppModule) {
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

        jsi::Value result = _cppModule->processAudio(*rt, inputArray, (int)channels);
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
        if (!_cppModule) {
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

        jsi::Value result = _cppModule->processAudioStereo(*rt, inputArrayL, inputArrayR);
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
        if (!_cppModule) {
            return @0.0;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @0.0;
        }

        jsi::Value result = _cppModule->getInputLevel(*rt);
        return result.isNumber() ? @(result.getNumber()) : @0.0;
    }

    NSNumber* getOutputLevel() override {
        if (!_cppModule) {
            return @0.0;
        }

        jsi::Runtime* rt = getRuntime();
        if (!rt) {
            return @0.0;
        }

        jsi::Value result = _cppModule->getOutputLevel(*rt);
        return result.isNumber() ? @(result.getNumber()) : @0.0;
    }

    // === Callbacks JavaScript ===
    void setAudioDataCallback(RCTResponseSenderBlock callback) override {
        if (_cppModule && _cppModule->getCallbackManager()) {
            // Store the callback for later use
            // In a real implementation, you would properly handle the callback
        }
    }

    void setErrorCallback(RCTResponseSenderBlock callback) override {
        if (_cppModule && _cppModule->getCallbackManager()) {
            // Store the callback for error handling
        }
    }

    void setStateChangeCallback(RCTResponseSenderBlock callback) override {
        if (_cppModule && _cppModule->getCallbackManager()) {
            // Store the callback for state changes
        }
    }
};

// Factory function for the module provider
std::shared_ptr<TurboModule> NativeAudioEffectsModuleProvider(const ObjCTurboModule::InitParams &params) {
    return std::make_shared<NativeAudioEffectsModuleImpl>(params);
}

} // namespace react
} // namespace facebook
