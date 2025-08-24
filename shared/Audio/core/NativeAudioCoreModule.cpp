#include "NativeAudioCoreModule.h"

#if NYTH_AUDIO_CORE_ENABLED

#include <algorithm>

namespace facebook {
namespace react {

NativeAudioCoreModule::NativeAudioCoreModule(std::shared_ptr<CallInvoker> jsInvoker) {
    // Configuration par défaut
    config_ = Nyth::Audio::AudioConfig();

    // Créer le gestionnaire de callbacks
    callbackManager_ = std::make_unique<JSICallbackManager>(jsInvoker);
}

NativeAudioCoreModule::~NativeAudioCoreModule() {
    cleanupManagers();
}

// === Cycle de vie ===
jsi::Value NativeAudioCoreModule::initialize(jsi::Runtime& rt) {
    try {
        setRuntime(&rt);
        initializeManagers();

        // Initialiser l'égaliseur avec la configuration par défaut
        if (equalizerManager_ && equalizerManager_->initialize(config_)) {
            isInitialized_.store(true);
            currentState_ = 1; // INITIALIZED
            return jsi::Value(true);
        }

        handleError(2, "Failed to initialize audio core");
        return jsi::Value(false);

    } catch (const jsi::JSError& e) {
        throw;
    } catch (const std::exception& e) {
        handleError(2, std::string("Initialization failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::isInitialized(jsi::Runtime& rt) {
    return jsi::Value(isInitialized_.load());
}

jsi::Value NativeAudioCoreModule::dispose(jsi::Runtime& rt) {
    cleanupManagers();
    isInitialized_.store(false);
    currentState_ = 0; // UNINITIALIZED
    return jsi::Value(true);
}

// === État et informations ===
jsi::Value NativeAudioCoreModule::getState(jsi::Runtime& rt) {
    return jsi::String::createFromUtf8(rt, stateToString(currentState_));
}

jsi::Value NativeAudioCoreModule::getErrorString(jsi::Runtime& rt, int errorCode) {
    return jsi::String::createFromUtf8(rt, errorToString(errorCode));
}

// === Égaliseur ===
jsi::Value NativeAudioCoreModule::equalizerInitialize(jsi::Runtime& rt, const jsi::Object& config) {
    if (!isInitialized_.load()) {
        handleError(1, "Audio core not initialized");
        return jsi::Value(false);
    }

    try {
        // Parser la configuration depuis JavaScript
        auto nativeConfig = JSIConverter::jsToAudioConfig(rt, config);

        if (equalizerManager_ && equalizerManager_->initialize(nativeConfig)) {
            config_ = nativeConfig;
            return jsi::Value(true);
        }

        return jsi::Value(false);
    } catch (const std::exception& e) {
        handleError(2, std::string("Equalizer initialization failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerIsInitialized(jsi::Runtime& rt) {
    return jsi::Value(equalizerManager_ && equalizerManager_->isInitialized());
}

jsi::Value NativeAudioCoreModule::equalizerRelease(jsi::Runtime& rt) {
    if (equalizerManager_) {
        equalizerManager_->release();
    }
    return jsi::Value(true);
}

jsi::Value NativeAudioCoreModule::equalizerSetMasterGain(jsi::Runtime& rt, double gainDB) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    return jsi::Value(equalizerManager_->setMasterGain(gainDB));
}

jsi::Value NativeAudioCoreModule::equalizerSetBypass(jsi::Runtime& rt, bool bypass) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    return jsi::Value(equalizerManager_->setBypass(bypass));
}

jsi::Value NativeAudioCoreModule::equalizerSetSampleRate(jsi::Runtime& rt, uint32_t sampleRate) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    return jsi::Value(equalizerManager_->setSampleRate(sampleRate));
}

jsi::Value NativeAudioCoreModule::equalizerSetBand(jsi::Runtime& rt, size_t bandIndex, const jsi::Object& bandConfig) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    try {
        // Parser la configuration de bande
        if (!bandConfig.hasProperty(rt, "frequency") || !bandConfig.hasProperty(rt, "gainDB") ||
            !bandConfig.hasProperty(rt, "q") || !bandConfig.hasProperty(rt, "type") ||
            !bandConfig.hasProperty(rt, "enabled")) {
            handleError(2, "Invalid band configuration");
            return jsi::Value(false);
        }

        double frequency = bandConfig.getProperty(rt, "frequency").asNumber();
        double gainDB = bandConfig.getProperty(rt, "gainDB").asNumber();
        double q = bandConfig.getProperty(rt, "q").asNumber();
        int type = static_cast<int>(bandConfig.getProperty(rt, "type").asNumber());
        bool enabled = bandConfig.getProperty(rt, "enabled").asBool();

        return jsi::Value(equalizerManager_->setBand(bandIndex, frequency, gainDB, q, type, enabled));

    } catch (const std::exception& e) {
        handleError(2, std::string("Set band failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerGetBand(jsi::Runtime& rt, size_t bandIndex) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value::null();
    }

    double frequency, gainDB, q;
    int filterType;
    bool enabled;

    if (equalizerManager_->getBand(bandIndex, frequency, gainDB, q, filterType, enabled)) {
        jsi::Object bandInfo(rt);
        bandInfo.setProperty(rt, "bandIndex", jsi::Value(static_cast<int>(bandIndex)));
        bandInfo.setProperty(rt, "frequency", jsi::Value(frequency));
        bandInfo.setProperty(rt, "gainDB", jsi::Value(gainDB));
        bandInfo.setProperty(rt, "q", jsi::Value(q));
        bandInfo.setProperty(rt, "type", jsi::Value(filterType));
        bandInfo.setProperty(rt, "enabled", jsi::Value(enabled));
        return bandInfo;
    }

    return jsi::Value::null();
}

jsi::Value NativeAudioCoreModule::equalizerSetBandGain(jsi::Runtime& rt, size_t bandIndex, double gainDB) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    return jsi::Value(equalizerManager_->setBandGain(bandIndex, gainDB));
}

jsi::Value NativeAudioCoreModule::equalizerSetBandFrequency(jsi::Runtime& rt, size_t bandIndex, double frequency) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    return jsi::Value(equalizerManager_->setBandFrequency(bandIndex, frequency));
}

jsi::Value NativeAudioCoreModule::equalizerSetBandQ(jsi::Runtime& rt, size_t bandIndex, double q) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    return jsi::Value(equalizerManager_->setBandQ(bandIndex, q));
}

jsi::Value NativeAudioCoreModule::equalizerSetBandType(jsi::Runtime& rt, size_t bandIndex, int filterType) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    return jsi::Value(equalizerManager_->setBandType(bandIndex, filterType));
}

jsi::Value NativeAudioCoreModule::equalizerSetBandEnabled(jsi::Runtime& rt, size_t bandIndex, bool enabled) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    return jsi::Value(equalizerManager_->setBandEnabled(bandIndex, enabled));
}

jsi::Value NativeAudioCoreModule::equalizerGetInfo(jsi::Runtime& rt) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value::null();
    }

    jsi::Object info(rt);
    info.setProperty(rt, "numBands", jsi::Value(static_cast<int>(equalizerManager_->getNumBands())));
    info.setProperty(rt, "sampleRate", jsi::Value(static_cast<int>(equalizerManager_->getSampleRate())));
    info.setProperty(rt, "masterGainDB", jsi::Value(equalizerManager_->getMasterGain()));
    info.setProperty(rt, "bypass", jsi::Value(equalizerManager_->isBypassed()));
    info.setProperty(rt, "state", jsi::String::createFromUtf8(rt, stateToString(currentState_)));

    return info;
}

jsi::Value NativeAudioCoreModule::equalizerGetNumBands(jsi::Runtime& rt) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        return jsi::Value(0);
    }

    return jsi::Value(static_cast<int>(equalizerManager_->getNumBands()));
}

jsi::Value NativeAudioCoreModule::equalizerProcessMono(jsi::Runtime& rt, const jsi::Array& input) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value::null();
    }

    try {
        // Convertir l'array JavaScript en vector C++
        size_t length = input.length(rt);
        std::vector<float> inputData(length);
        std::vector<float> outputData(length);

        for (size_t i = 0; i < length; ++i) {
            inputData[i] = static_cast<float>(input.getValueAtIndex(rt, i).asNumber());
        }

        if (equalizerManager_->processMono(inputData.data(), outputData.data(), length)) {
            // Convertir le résultat en array JavaScript
            jsi::Array result(rt, length);
            for (size_t i = 0; i < length; ++i) {
                result.setValueAtIndex(rt, i, jsi::Value(outputData[i]));
            }
            return result;
        }

        return jsi::Value::null();

    } catch (const std::exception& e) {
        handleError(3, std::string("Mono processing failed: ") + e.what());
        return jsi::Value::null();
    }
}

jsi::Value NativeAudioCoreModule::equalizerProcessStereo(jsi::Runtime& rt, const jsi::Array& inputL,
                                                         const jsi::Array& inputR) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value::null();
    }

    try {
        // Convertir les arrays JavaScript en vectors C++
        size_t length = inputL.length(rt);
        if (inputR.length(rt) != length) {
            handleError(2, "Left and right channels must have same length");
            return jsi::Value::null();
        }

        std::vector<float> inputLData(length), inputRData(length);
        std::vector<float> outputLData(length), outputRData(length);

        for (size_t i = 0; i < length; ++i) {
            inputLData[i] = static_cast<float>(inputL.getValueAtIndex(rt, i).asNumber());
            inputRData[i] = static_cast<float>(inputR.getValueAtIndex(rt, i).asNumber());
        }

        if (equalizerManager_->processStereo(inputLData.data(), inputRData.data(), outputLData.data(),
                                             outputRData.data(), length)) {
            // Convertir le résultat en object JavaScript
            jsi::Object result(rt);
            jsi::Array leftResult(rt, length);
            jsi::Array rightResult(rt, length);

            for (size_t i = 0; i < length; ++i) {
                leftResult.setValueAtIndex(rt, i, jsi::Value(outputLData[i]));
                rightResult.setValueAtIndex(rt, i, jsi::Value(outputRData[i]));
            }

            result.setProperty(rt, "left", leftResult);
            result.setProperty(rt, "right", rightResult);
            return result;
        }

        return jsi::Value::null();

    } catch (const std::exception& e) {
        handleError(3, std::string("Stereo processing failed: ") + e.what());
        return jsi::Value::null();
    }
}

jsi::Value NativeAudioCoreModule::equalizerLoadPreset(jsi::Runtime& rt, const jsi::String& presetName) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    std::string preset = presetName.utf8(rt);
    return jsi::Value(equalizerManager_->loadPreset(preset));
}

jsi::Value NativeAudioCoreModule::equalizerSavePreset(jsi::Runtime& rt, const jsi::String& presetName) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    std::string preset = presetName.utf8(rt);
    return jsi::Value(equalizerManager_->savePreset(preset));
}

jsi::Value NativeAudioCoreModule::equalizerResetAllBands(jsi::Runtime& rt) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value(false);
    }

    equalizerManager_->resetAllBands();
    return jsi::Value(true);
}

// === Filtres biquad individuels ===
jsi::Value NativeAudioCoreModule::filterCreate(jsi::Runtime& rt) {
    if (!filterManager_) {
        handleError(1, "Filter manager not initialized");
        return jsi::Value(static_cast<double>(-1));
    }

    int64_t filterId = filterManager_->createFilter();
    return jsi::Value(static_cast<double>(filterId));
}

jsi::Value NativeAudioCoreModule::filterDestroy(jsi::Runtime& rt, int64_t filterId) {
    if (!filterManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(filterManager_->destroyFilter(filterId));
}

jsi::Value NativeAudioCoreModule::filterSetConfig(jsi::Runtime& rt, int64_t filterId, const jsi::Object& config) {
    if (!filterManager_) {
        handleError(1, "Filter manager not initialized");
        return jsi::Value(false);
    }

    try {
        double frequency = config.getProperty(rt, "frequency").asNumber();
        double q = config.getProperty(rt, "q").asNumber();
        double gainDB = config.getProperty(rt, "gainDB").asNumber();
        std::string typeStr = config.getProperty(rt, "type").asString(rt).utf8(rt);
        int filterType = stringToFilterType(typeStr);

        return jsi::Value(filterManager_->setFilterConfig(filterId, frequency, q, gainDB, filterType));

    } catch (const std::exception& e) {
        handleError(2, std::string("Set filter config failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::filterGetConfig(jsi::Runtime& rt, int64_t filterId) {
    if (!filterManager_) {
        return jsi::Value::null();
    }

    double frequency, q, gainDB;
    int filterType;

    if (filterManager_->getFilterConfig(filterId, frequency, q, gainDB, filterType)) {
        jsi::Object config(rt);
        config.setProperty(rt, "frequency", jsi::Value(frequency));
        config.setProperty(rt, "q", jsi::Value(q));
        config.setProperty(rt, "gainDB", jsi::Value(gainDB));
        config.setProperty(rt, "type", jsi::String::createFromUtf8(rt, filterTypeToString(filterType)));
        return config;
    }

    return jsi::Value::null();
}

// === Types de filtres spécifiques ===
jsi::Value NativeAudioCoreModule::filterSetLowpass(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                   double sampleRate, double q) {
    if (!filterManager_) {
        return jsi::Value(false);
    }
    return jsi::Value(filterManager_->setLowpass(filterId, frequency, q));
}

jsi::Value NativeAudioCoreModule::filterSetHighpass(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                    double sampleRate, double q) {
    if (!filterManager_) {
        return jsi::Value(false);
    }
    return jsi::Value(filterManager_->setHighpass(filterId, frequency, q));
}

jsi::Value NativeAudioCoreModule::filterSetBandpass(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                    double sampleRate, double q) {
    if (!filterManager_) {
        return jsi::Value(false);
    }
    return jsi::Value(filterManager_->setBandpass(filterId, frequency, q));
}

jsi::Value NativeAudioCoreModule::filterSetNotch(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                 double sampleRate, double q) {
    if (!filterManager_) {
        return jsi::Value(false);
    }
    return jsi::Value(filterManager_->setNotch(filterId, frequency, q));
}

jsi::Value NativeAudioCoreModule::filterSetPeaking(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                   double sampleRate, double q, double gainDB) {
    if (!filterManager_) {
        return jsi::Value(false);
    }
    return jsi::Value(filterManager_->setPeaking(filterId, frequency, q, gainDB));
}

jsi::Value NativeAudioCoreModule::filterSetLowShelf(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                    double sampleRate, double q, double gainDB) {
    if (!filterManager_) {
        return jsi::Value(false);
    }
    return jsi::Value(filterManager_->setLowShelf(filterId, frequency, q, gainDB));
}

jsi::Value NativeAudioCoreModule::filterSetHighShelf(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                     double sampleRate, double q, double gainDB) {
    if (!filterManager_) {
        return jsi::Value(false);
    }
    return jsi::Value(filterManager_->setHighShelf(filterId, frequency, q, gainDB));
}

jsi::Value NativeAudioCoreModule::filterSetAllpass(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                   double sampleRate, double q) {
    if (!filterManager_) {
        return jsi::Value(false);
    }
    return jsi::Value(filterManager_->setAllpass(filterId, frequency, q));
}

// === Processing ===
jsi::Value NativeAudioCoreModule::filterProcessMono(jsi::Runtime& rt, int64_t filterId, const jsi::Array& input) {
    if (!filterManager_) {
        return jsi::Value::null();
    }

    try {
        size_t length = input.length(rt);
        std::vector<float> inputData(length);
        std::vector<float> outputData(length);

        for (size_t i = 0; i < length; ++i) {
            inputData[i] = static_cast<float>(input.getValueAtIndex(rt, i).asNumber());
        }

        if (filterManager_->processMono(filterId, inputData.data(), outputData.data(), length)) {
            jsi::Array result(rt, length);
            for (size_t i = 0; i < length; ++i) {
                result.setValueAtIndex(rt, i, jsi::Value(outputData[i]));
            }
            return result;
        }

        return jsi::Value::null();

    } catch (const std::exception& e) {
        handleError(3, std::string("Filter mono processing failed: ") + e.what());
        return jsi::Value::null();
    }
}

jsi::Value NativeAudioCoreModule::filterProcessStereo(jsi::Runtime& rt, int64_t filterId, const jsi::Array& inputL,
                                                      const jsi::Array& inputR) {
    if (!filterManager_) {
        return jsi::Value::null();
    }

    try {
        size_t length = inputL.length(rt);
        if (inputR.length(rt) != length) {
            handleError(2, "Left and right channels must have same length");
            return jsi::Value::null();
        }

        std::vector<float> inputLData(length), inputRData(length);
        std::vector<float> outputLData(length), outputRData(length);

        for (size_t i = 0; i < length; ++i) {
            inputLData[i] = static_cast<float>(inputL.getValueAtIndex(rt, i).asNumber());
            inputRData[i] = static_cast<float>(inputR.getValueAtIndex(rt, i).asNumber());
        }

        if (filterManager_->processStereo(filterId, inputLData.data(), inputRData.data(), outputLData.data(),
                                          outputRData.data(), length)) {
            jsi::Object result(rt);
            jsi::Array leftResult(rt, length);
            jsi::Array rightResult(rt, length);

            for (size_t i = 0; i < length; ++i) {
                leftResult.setValueAtIndex(rt, i, jsi::Value(outputLData[i]));
                rightResult.setValueAtIndex(rt, i, jsi::Value(outputRData[i]));
            }

            result.setProperty(rt, "left", leftResult);
            result.setProperty(rt, "right", rightResult);
            return result;
        }

        return jsi::Value::null();

    } catch (const std::exception& e) {
        handleError(3, std::string("Filter stereo processing failed: ") + e.what());
        return jsi::Value::null();
    }
}

jsi::Value NativeAudioCoreModule::filterGetInfo(jsi::Runtime& rt, int64_t filterId) {
    if (!filterManager_) {
        return jsi::Value::null();
    }

    double a0, a1, a2, b1, b2;
    if (filterManager_->getFilterInfo(filterId, a0, a1, a2, b1, b2)) {
        jsi::Object info(rt);
        info.setProperty(rt, "a0", jsi::Value(a0));
        info.setProperty(rt, "a1", jsi::Value(a1));
        info.setProperty(rt, "a2", jsi::Value(a2));
        info.setProperty(rt, "b1", jsi::Value(b1));
        info.setProperty(rt, "b2", jsi::Value(b2));
        return info;
    }

    return jsi::Value::null();
}

jsi::Value NativeAudioCoreModule::filterReset(jsi::Runtime& rt, int64_t filterId) {
    if (!filterManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(filterManager_->resetFilter(filterId));
}

// === Utilitaires ===
jsi::Value NativeAudioCoreModule::dbToLinear(jsi::Runtime& rt, double db) {
    // Conversion simple dB vers linéaire
    double linear = std::pow(10.0, db / 20.0);
    return jsi::Value(linear);
}

jsi::Value NativeAudioCoreModule::linearToDb(jsi::Runtime& rt, double linear) {
    // Conversion simple linéaire vers dB
    if (linear <= 0.0) {
        return jsi::Value(-120.0); // Valeur minimale
    }
    double db = 20.0 * std::log10(linear);
    return jsi::Value(std::max(db, -120.0));
}

jsi::Value NativeAudioCoreModule::validateFrequency(jsi::Runtime& rt, double frequency, double sampleRate) {
    bool isValid = frequency > 0.0 && frequency < sampleRate / 2.0;
    return jsi::Value(isValid);
}

jsi::Value NativeAudioCoreModule::validateQ(jsi::Runtime& rt, double q) {
    bool isValid = q > 0.0 && q <= 10.0;
    return jsi::Value(isValid);
}

jsi::Value NativeAudioCoreModule::validateGainDB(jsi::Runtime& rt, double gainDB) {
    bool isValid = gainDB >= -60.0 && gainDB <= 30.0;
    return jsi::Value(isValid);
}

// === Installation du module ===
jsi::Value NativeAudioCoreModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    auto module = std::make_shared<NativeAudioCoreModule>(jsInvoker);

    auto object = jsi::Object(rt);

// Helpers d'enregistrement (style Capture)
#define REG0(name) object.setProperty(rt, #name, jsi::Function::createFromHostFunction( \
  rt, jsi::PropNameID::forAscii(rt, #name), 0, \
  [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value { \
    return module->name(rt); }))

#define REG1_NUM(name) object.setProperty(rt, #name, jsi::Function::createFromHostFunction( \
  rt, jsi::PropNameID::forAscii(rt, #name), 1, \
  [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c) -> jsi::Value { \
    if (c < 1 || !args[0].isNumber()) throw jsi::JSError(rt, #name " expects number"); \
    return module->name(rt, args[0].asNumber()); }))

#define REG1_OBJ(name) object.setProperty(rt, #name, jsi::Function::createFromHostFunction( \
  rt, jsi::PropNameID::forAscii(rt, #name), 1, \
  [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c) -> jsi::Value { \
    if (c < 1 || !args[0].isObject()) throw jsi::JSError(rt, #name " expects object"); \
    return module->name(rt, args[0].asObject(rt)); }))

#define REG2_MIX(name) object.setProperty(rt, #name, jsi::Function::createFromHostFunction( \
  rt, jsi::PropNameID::forAscii(rt, #name), 2, \
  [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c) -> jsi::Value { \
    if (c < 2) throw jsi::JSError(rt, #name " expects 2 args"); \
    return module->name(rt, args[0], args[1]); }))

    // Enregistrer les méthodes
    REG0(initialize);
    REG0(isInitialized);
    REG0(dispose);
    REG0(getState);
    REG1_NUM(getErrorString);

    // Égaliseur
    REG1_OBJ(equalizerInitialize);
    REG0(equalizerIsInitialized);
    REG0(equalizerRelease);
    REG1_NUM(equalizerSetMasterGain);
    object.setProperty(rt, "equalizerSetBypass", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "equalizerSetBypass"), 1,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c) -> jsi::Value {
            if (c < 1 || !args[0].isBool()) throw jsi::JSError(rt, "equalizerSetBypass expects boolean");
            return module->equalizerSetBypass(rt, args[0].getBool());
        }));
    REG1_NUM(equalizerSetSampleRate);
    // Méthodes Equalizer multi-args: on valide explicitement
    object.setProperty(rt, "equalizerSetBand", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "equalizerSetBand"), 2,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c) -> jsi::Value {
            if (c < 2 || !args[0].isNumber() || !args[1].isObject())
                throw jsi::JSError(rt, "equalizerSetBand expects (number, object)");
            size_t idx = static_cast<size_t>(args[0].asNumber());
            return module->equalizerSetBand(rt, idx, args[1].asObject(rt));
        }));
    REG1_NUM(equalizerGetBand);
    object.setProperty(rt, "equalizerSetBandGain", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "equalizerSetBandGain"), 2,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 2 || !a[0].isNumber() || !a[1].isNumber()) throw jsi::JSError(rt, "equalizerSetBandGain expects (number, number)");
            return module->equalizerSetBandGain(rt, static_cast<size_t>(a[0].asNumber()), a[1].asNumber());
        }));
    object.setProperty(rt, "equalizerSetBandFrequency", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "equalizerSetBandFrequency"), 2,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 2 || !a[0].isNumber() || !a[1].isNumber()) throw jsi::JSError(rt, "equalizerSetBandFrequency expects (number, number)");
            return module->equalizerSetBandFrequency(rt, static_cast<size_t>(a[0].asNumber()), a[1].asNumber());
        }));
    object.setProperty(rt, "equalizerSetBandQ", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "equalizerSetBandQ"), 2,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 2 || !a[0].isNumber() || !a[1].isNumber()) throw jsi::JSError(rt, "equalizerSetBandQ expects (number, number)");
            return module->equalizerSetBandQ(rt, static_cast<size_t>(a[0].asNumber()), a[1].asNumber());
        }));
    object.setProperty(rt, "equalizerSetBandType", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "equalizerSetBandType"), 2,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 2 || !a[0].isNumber() || !a[1].isNumber()) throw jsi::JSError(rt, "equalizerSetBandType expects (number, number)");
            return module->equalizerSetBandType(rt, static_cast<size_t>(a[0].asNumber()), static_cast<int>(a[1].asNumber()));
        }));
    object.setProperty(rt, "equalizerSetBandEnabled", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "equalizerSetBandEnabled"), 2,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 2 || !a[0].isNumber() || !a[1].isBool()) throw jsi::JSError(rt, "equalizerSetBandEnabled expects (number, boolean)");
            return module->equalizerSetBandEnabled(rt, static_cast<size_t>(a[0].asNumber()), a[1].getBool());
        }));
    REG0(equalizerGetInfo);
    REG0(equalizerGetNumBands);
    REG1_OBJ(equalizerProcessMono);
    object.setProperty(rt, "equalizerProcessStereo", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "equalizerProcessStereo"), 2,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 2 || !a[0].isObject() || !a[1].isObject()) throw jsi::JSError(rt, "equalizerProcessStereo expects (array, array)");
            return module->equalizerProcessStereo(rt, a[0].asObject(rt).asArray(rt), a[1].asObject(rt).asArray(rt));
        }));
    object.setProperty(rt, "equalizerLoadPreset", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "equalizerLoadPreset"), 1,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 1 || !a[0].isString()) throw jsi::JSError(rt, "equalizerLoadPreset expects (string)");
            return module->equalizerLoadPreset(rt, a[0].asString(rt));
        }));
    object.setProperty(rt, "equalizerSavePreset", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "equalizerSavePreset"), 1,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 1 || !a[0].isString()) throw jsi::JSError(rt, "equalizerSavePreset expects (string)");
            return module->equalizerSavePreset(rt, a[0].asString(rt));
        }));
    REG0(equalizerResetAllBands);

    // Filtres
    REG0(filterCreate);
    object.setProperty(rt, "filterDestroy", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "filterDestroy"), 1,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 1 || !a[0].isNumber()) throw jsi::JSError(rt, "filterDestroy expects (number)");
            return module->filterDestroy(rt, static_cast<int64_t>(a[0].asNumber()));
        }));
    object.setProperty(rt, "filterSetConfig", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "filterSetConfig"), 2,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 2 || !a[0].isNumber() || !a[1].isObject()) throw jsi::JSError(rt, "filterSetConfig expects (number, object)");
            return module->filterSetConfig(rt, static_cast<int64_t>(a[0].asNumber()), a[1].asObject(rt));
        }));
    object.setProperty(rt, "filterGetConfig", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "filterGetConfig"), 1,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 1 || !a[0].isNumber()) throw jsi::JSError(rt, "filterGetConfig expects (number)");
            return module->filterGetConfig(rt, static_cast<int64_t>(a[0].asNumber()));
        }));
    auto set4 = [&](const char* name, auto fn){
        object.setProperty(rt, name, jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forAscii(rt, name), 4,
            [module, fn](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
                if (c < 4 || !a[0].isNumber() || !a[1].isNumber() || !a[2].isNumber() || !a[3].isNumber())
                    throw jsi::JSError(rt, std::string(name) + " expects (number, number, number, number)");
                return (module.get()->*fn)(rt, static_cast<int64_t>(a[0].asNumber()), a[1].asNumber(), a[2].asNumber(), a[3].asNumber());
            }));
    };
    set4("filterSetLowpass", &NativeAudioCoreModule::filterSetLowpass);
    set4("filterSetHighpass", &NativeAudioCoreModule::filterSetHighpass);
    set4("filterSetBandpass", &NativeAudioCoreModule::filterSetBandpass);
    set4("filterSetNotch", &NativeAudioCoreModule::filterSetNotch);
    object.setProperty(rt, "filterSetPeaking", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "filterSetPeaking"), 5,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 5) throw jsi::JSError(rt, "filterSetPeaking expects 5 args");
            return module->filterSetPeaking(rt, static_cast<int64_t>(a[0].asNumber()), a[1].asNumber(), a[2].asNumber(), a[3].asNumber(), a[4].asNumber());
        }));
    object.setProperty(rt, "filterSetLowShelf", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "filterSetLowShelf"), 5,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 5) throw jsi::JSError(rt, "filterSetLowShelf expects 5 args");
            return module->filterSetLowShelf(rt, static_cast<int64_t>(a[0].asNumber()), a[1].asNumber(), a[2].asNumber(), a[3].asNumber(), a[4].asNumber());
        }));
    object.setProperty(rt, "filterSetHighShelf", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "filterSetHighShelf"), 5,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 5) throw jsi::JSError(rt, "filterSetHighShelf expects 5 args");
            return module->filterSetHighShelf(rt, static_cast<int64_t>(a[0].asNumber()), a[1].asNumber(), a[2].asNumber(), a[3].asNumber(), a[4].asNumber());
        }));
    set4("filterSetAllpass", &NativeAudioCoreModule::filterSetAllpass);
    object.setProperty(rt, "filterProcessMono", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "filterProcessMono"), 2,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 2 || !a[0].isNumber() || !a[1].isObject()) throw jsi::JSError(rt, "filterProcessMono expects (number, array)");
            return module->filterProcessMono(rt, static_cast<int64_t>(a[0].asNumber()), a[1].asObject(rt).asArray(rt));
        }));
    object.setProperty(rt, "filterProcessStereo", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "filterProcessStereo"), 3,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 3 || !a[0].isNumber() || !a[1].isObject() || !a[2].isObject()) throw jsi::JSError(rt, "filterProcessStereo expects (number, array, array)");
            return module->filterProcessStereo(rt, static_cast<int64_t>(a[0].asNumber()), a[1].asObject(rt).asArray(rt), a[2].asObject(rt).asArray(rt));
        }));
    object.setProperty(rt, "filterGetInfo", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "filterGetInfo"), 1,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 1 || !a[0].isNumber()) throw jsi::JSError(rt, "filterGetInfo expects (number)");
            return module->filterGetInfo(rt, static_cast<int64_t>(a[0].asNumber()));
        }));
    object.setProperty(rt, "filterReset", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "filterReset"), 1,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 1 || !a[0].isNumber()) throw jsi::JSError(rt, "filterReset expects (number)");
            return module->filterReset(rt, static_cast<int64_t>(a[0].asNumber()));
        }));

    // Utilitaires
    REG1_NUM(dbToLinear);
    REG1_NUM(linearToDb);
    object.setProperty(rt, "validateFrequency", jsi::Function::createFromHostFunction(
        rt, jsi::PropNameID::forAscii(rt, "validateFrequency"), 2,
        [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* a, size_t c) -> jsi::Value {
            if (c < 2 || !a[0].isNumber() || !a[1].isNumber()) throw jsi::JSError(rt, "validateFrequency expects (number, number)");
            return module->validateFrequency(rt, a[0].asNumber(), a[1].asNumber());
        }));
    REG1_NUM(validateQ);
    REG1_NUM(validateGainDB);

#undef REG0
#undef REG1_NUM
#undef REG1_OBJ

    rt.global().setProperty(rt, "NativeAudioCoreModule", object);
    return object;
}

// === Méthodes privées ===
void NativeAudioCoreModule::initializeManagers() {
    if (!equalizerManager_) {
        equalizerManager_ = std::make_unique<EqualizerManager>(callbackManager_);
    }

    if (!filterManager_) {
        filterManager_ = std::make_unique<FilterManager>(callbackManager_);
    }

    if (!analysisManager_) {
        analysisManager_ = std::make_unique<AudioAnalysisManager>(callbackManager_);
    }
}

void NativeAudioCoreModule::cleanupManagers() {
    if (equalizerManager_) {
        equalizerManager_->release();
    }

    if (filterManager_) {
        // Le destructeur de FilterManager gère le nettoyage
    }

    if (analysisManager_) {
        analysisManager_->release();
    }

    isInitialized_.store(false);
    currentState_ = 0;
}

void NativeAudioCoreModule::setRuntime(jsi::Runtime* rt) {
    runtime_ = rt;
    runtimeValid_.store(rt != nullptr);

    if (callbackManager_) {
        callbackManager_->setRuntime(rt);
    }
}

void NativeAudioCoreModule::invalidateRuntime() {
    runtimeValid_.store(false);
    runtime_ = nullptr;

    if (callbackManager_) {
        callbackManager_->invalidateRuntime();
    }
}

void NativeAudioCoreModule::handleError(int error, const std::string& message) {
    currentState_ = 3; // ERROR

    if (callbackManager_) {
        callbackManager_->invokeErrorCallback(message);
    }
}

std::string NativeAudioCoreModule::stateToString(int state) const {
    switch (state) {
        case 0:
            return "uninitialized";
        case 1:
            return "initialized";
        case 2:
            return "processing";
        case 3:
            return "error";
        default:
            return "unknown";
    }
}

std::string NativeAudioCoreModule::errorToString(int error) const {
    switch (error) {
        case 0:
            return "OK";
        case 1:
            return "Not initialized";
        case 2:
            return "Config error";
        case 3:
            return "Processing failed";
        default:
            return "Unknown error";
    }
}

int NativeAudioCoreModule::stringToFilterType(const std::string& typeStr) const {
    if (typeStr == "lowpass")
        return 0;
    if (typeStr == "highpass")
        return 1;
    if (typeStr == "bandpass")
        return 2;
    if (typeStr == "notch")
        return 3;
    if (typeStr == "peak")
        return 4;
    if (typeStr == "lowshelf")
        return 5;
    if (typeStr == "highshelf")
        return 6;
    if (typeStr == "allpass")
        return 7;
    return 4; // Default to peak
}

std::string NativeAudioCoreModule::filterTypeToString(int type) const {
    switch (type) {
        case 0:
            return "lowpass";
        case 1:
            return "highpass";
        case 2:
            return "bandpass";
        case 3:
            return "notch";
        case 4:
            return "peak";
        case 5:
            return "lowshelf";
        case 6:
            return "highshelf";
        case 7:
            return "allpass";
        default:
            return "peak";
    }
}

// === Analyse audio ===
jsi::Value NativeAudioCoreModule::startAnalysis(jsi::Runtime& rt) {
    if (!isInitialized_.load()) {
        handleError(1, "Audio core not initialized");
        return jsi::Value(false);
    }

    try {
        if (analysisManager_ && analysisManager_->initialize(config_)) {
            if (analysisManager_->startAnalysis()) {
                currentState_ = 2; // PROCESSING
                return jsi::Value(true);
            }
        }
        return jsi::Value(false);
    } catch (const std::exception& e) {
        handleError(2, std::string("Failed to start analysis: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::stopAnalysis(jsi::Runtime& rt) {
    if (!isInitialized_.load()) {
        return jsi::Value(true);
    }

    try {
        if (analysisManager_) {
            analysisManager_->stopAnalysis();
        }
        currentState_ = 1; // INITIALIZED
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(2, std::string("Failed to stop analysis: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::isAnalyzing(jsi::Runtime& rt) {
    return jsi::Value(analysisManager_ && analysisManager_->isAnalyzing());
}

jsi::Value NativeAudioCoreModule::getAnalysisMetrics(jsi::Runtime& rt) {
    if (!analysisManager_ || !analysisManager_->isInitialized()) {
        return jsi::Value::null();
    }

    try {
        auto metrics = analysisManager_->getCurrentMetrics();
        auto result = jsi::Object(rt);

        result.setProperty(rt, "rmsLevel", jsi::Value(metrics.rmsLevel));
        result.setProperty(rt, "peakLevel", jsi::Value(metrics.peakLevel));
        result.setProperty(rt, "averageLevel", jsi::Value(metrics.averageLevel));
        result.setProperty(rt, "hasClipping", jsi::Value(metrics.hasClipping));
        result.setProperty(rt, "isSilent", jsi::Value(metrics.isSilent));
        result.setProperty(rt, "silenceDuration", jsi::Value(metrics.silenceDuration));
        result.setProperty(rt, "clippingDuration", jsi::Value(metrics.clippingDuration));

        return result;
    } catch (const std::exception& e) {
        handleError(2, std::string("Failed to get analysis metrics: ") + e.what());
        return jsi::Value::null();
    }
}

jsi::Value NativeAudioCoreModule::getFrequencyAnalysis(jsi::Runtime& rt) {
    if (!analysisManager_ || !analysisManager_->isInitialized()) {
        return jsi::Value::null();
    }

    try {
        auto analysis = analysisManager_->getFrequencyAnalysis();
        auto result = jsi::Object(rt);

        // Convertir les magnitudes en Array JavaScript
        auto magnitudesArray = jsi::Array(rt, analysis.magnitudes.size());
        for (size_t i = 0; i < analysis.magnitudes.size(); ++i) {
            magnitudesArray.setValueAtIndex(rt, i, jsi::Value(analysis.magnitudes[i]));
        }

        // Convertir les fréquences en Array JavaScript
        auto frequenciesArray = jsi::Array(rt, analysis.frequencies.size());
        for (size_t i = 0; i < analysis.frequencies.size(); ++i) {
            frequenciesArray.setValueAtIndex(rt, i, jsi::Value(analysis.frequencies[i]));
        }

        result.setProperty(rt, "magnitudes", magnitudesArray);
        result.setProperty(rt, "frequencies", frequenciesArray);
        result.setProperty(rt, "spectralCentroid", jsi::Value(analysis.spectralCentroid));
        result.setProperty(rt, "spectralRolloff", jsi::Value(analysis.spectralRolloff));
        result.setProperty(rt, "spectralFlux", jsi::Value(analysis.spectralFlux));

        return result;
    } catch (const std::exception& e) {
        handleError(2, std::string("Failed to get frequency analysis: ") + e.what());
        return jsi::Value::null();
    }
}

jsi::Value NativeAudioCoreModule::setAnalysisConfig(jsi::Runtime& rt, const jsi::Object& config) {
    if (!isInitialized_.load()) {
        handleError(1, "Audio core not initialized");
        return jsi::Value(false);
    }

    try {
        // Parser la configuration depuis JavaScript
        int analysisIntervalMs = 100;
        double silenceThreshold = -60.0;
        double clippingThreshold = -1.0;
        bool enableFrequencyAnalysis = true;

        if (config.hasProperty(rt, "analysisIntervalMs")) {
            analysisIntervalMs = static_cast<int>(config.getProperty(rt, "analysisIntervalMs").asNumber());
        }
        if (config.hasProperty(rt, "silenceThreshold")) {
            silenceThreshold = config.getProperty(rt, "silenceThreshold").asNumber();
        }
        if (config.hasProperty(rt, "clippingThreshold")) {
            clippingThreshold = config.getProperty(rt, "clippingThreshold").asNumber();
        }
        if (config.hasProperty(rt, "enableFrequencyAnalysis")) {
            enableFrequencyAnalysis = config.getProperty(rt, "enableFrequencyAnalysis").asBool();
        }

        if (analysisManager_ && analysisManager_->setAnalysisConfig(analysisIntervalMs, silenceThreshold,
                                                                    clippingThreshold, enableFrequencyAnalysis)) {
            return jsi::Value(true);
        }

        return jsi::Value(false);
    } catch (const std::exception& e) {
        handleError(2, std::string("Failed to set analysis config: ") + e.what());
        return jsi::Value(false);
    }
}

// === Provider function ===
std::shared_ptr<TurboModule> NativeAudioCoreModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioCoreModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CORE_ENABLED
