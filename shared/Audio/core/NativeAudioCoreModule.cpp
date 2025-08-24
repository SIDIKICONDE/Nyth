#include "NativeAudioCoreModule.h"

#if NYTH_AUDIO_CORE_ENABLED

#include <algorithm>
#include "jsi/JSIConverter.h"

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
/**
 * @brief Initialise le module audio core et tous ses composants
 * 
 * Cette méthode doit être appelée avant toute autre opération.
 * Elle initialise les managers (equalizer, filter, analysis) et configure
 * le runtime JSI pour les callbacks.
 * 
 * @param rt Runtime JSI pour l'exécution JavaScript
 * @return jsi::Value(true) si l'initialisation réussit, jsi::Value(false) sinon
 */
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
/**
 * @brief Initialise l'égaliseur audio avec une configuration personnalisée
 * 
 * @param rt Runtime JSI
 * @param config Objet JavaScript contenant la configuration:
 *   - sampleRate: Taux d'échantillonnage (ex: 44100, 48000)
 *   - bufferSize: Taille du buffer audio
 *   - channels: Nombre de canaux (1 pour mono, 2 pour stéréo)
 *   - format: Format audio ("float32", "int16", etc.)
 * @return jsi::Value(true) si succès, jsi::Value(false) sinon
 */
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

/**
 * @brief Traite un signal audio mono avec l'égaliseur
 * 
 * Cette méthode applique l'égalisation configurée à un signal mono.
 * Supporte les TypedArray (Float32Array) pour de meilleures performances.
 * 
 * @param rt Runtime JSI
 * @param input Array JavaScript contenant les échantillons audio (Float32Array recommandé)
 * @return Array JavaScript contenant les échantillons traités, ou null en cas d'erreur
 */
jsi::Value NativeAudioCoreModule::equalizerProcessMono(jsi::Runtime& rt, const jsi::Array& input) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value::null();
    }

    try {
        // Utiliser le JSIConverter pour une conversion optimisée
        auto inputData = JSIConverter::jsArrayToFloatVector(rt, input);
        std::vector<float> outputData(inputData.size());

        if (equalizerManager_->processMono(inputData.data(), outputData.data(), inputData.size())) {
            // Convertir le résultat en array JavaScript (optimisé avec TypedArray si possible)
            return JSIConverter::floatVectorToJSArray(rt, outputData);
        }

        return jsi::Value::null();

    } catch (const std::exception& e) {
        handleError(3, std::string("Mono processing failed: ") + e.what());
        return jsi::Value::null();
    }
}

/**
 * @brief Traite un signal audio stéréo avec l'égaliseur
 * 
 * Cette méthode applique l'égalisation configurée à un signal stéréo.
 * Les canaux gauche et droit sont traités séparément mais avec les mêmes paramètres.
 * Supporte les TypedArray (Float32Array) pour de meilleures performances.
 * 
 * @param rt Runtime JSI
 * @param inputL Array JavaScript contenant les échantillons du canal gauche
 * @param inputR Array JavaScript contenant les échantillons du canal droit
 * @return Objet JavaScript avec propriétés 'left' et 'right' contenant les arrays traités
 */
jsi::Value NativeAudioCoreModule::equalizerProcessStereo(jsi::Runtime& rt, const jsi::Array& inputL,
                                                         const jsi::Array& inputR) {
    if (!equalizerManager_ || !equalizerManager_->isInitialized()) {
        handleError(1, "Equalizer not initialized");
        return jsi::Value::null();
    }

    try {
        // Utiliser le JSIConverter pour une conversion optimisée
        auto inputLData = JSIConverter::jsArrayToFloatVector(rt, inputL);
        auto inputRData = JSIConverter::jsArrayToFloatVector(rt, inputR);
        
        if (inputLData.size() != inputRData.size()) {
            handleError(2, "Left and right channels must have same length");
            return jsi::Value::null();
        }

        std::vector<float> outputLData(inputLData.size());
        std::vector<float> outputRData(inputRData.size());

        if (equalizerManager_->processStereo(inputLData.data(), inputRData.data(), outputLData.data(),
                                             outputRData.data(), inputLData.size())) {
            // Convertir les résultats en objet JavaScript avec deux arrays optimisés
            jsi::Object result(rt);
            result.setProperty(rt, "left", JSIConverter::floatVectorToJSArray(rt, outputLData));
            result.setProperty(rt, "right", JSIConverter::floatVectorToJSArray(rt, outputRData));
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
/**
 * @brief Installe le module NativeAudioCoreModule dans le runtime JavaScript
 * 
 * Cette méthode statique crée une instance du module et expose toutes ses méthodes
 * au JavaScript. Elle utilise une macro optimisée pour enregistrer les méthodes
 * avec support des TypedArray pour les conversions de données audio.
 * 
 * @param rt Runtime JSI où installer le module
 * @param jsInvoker CallInvoker pour l'exécution asynchrone des callbacks
 * @return Objet JavaScript contenant toutes les méthodes du module
 * 
 * @note Le module est accessible globalement via window.NativeAudioCoreModule
 */
jsi::Value NativeAudioCoreModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    auto module = std::make_shared<NativeAudioCoreModule>(jsInvoker);

    auto object = jsi::Object(rt);

// Macro pour enregistrer une méthode
#define REGISTER_METHOD(name, paramCount)                                                                  \
    object.setProperty(rt, #name,                                                                          \
                       jsi::Function::createFromHostFunction(                                              \
                           rt, jsi::PropNameID::forAscii(rt, #name), static_cast<unsigned int>(paramCount), \
                           [module](jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args,      \
                                    size_t count) -> jsi::Value {                                          \
                               if (paramCount == 0) {                                                      \
                                   return module->name(runtime);                                           \
                               } else if (paramCount == 1) {                                              \
                                   return module->name(runtime, args[0]);                                  \
                               } else if (paramCount == 2) {                                              \
                                   return module->name(runtime, args[0], args[1]);                         \
                               } else if (paramCount == 3) {                                              \
                                   return module->name(runtime, args[0], args[1], args[2]);                \
                               } else if (paramCount == 4) {                                              \
                                   return module->name(runtime, args[0], args[1], args[2], args[3]);       \
                               } else if (paramCount == 5) {                                              \
                                   return module->name(runtime, args[0], args[1], args[2], args[3], args[4]); \
                               }                                                                           \
                               return jsi::Value::undefined();                                             \
                           }))

    // Enregistrer les méthodes
    REGISTER_METHOD(initialize, 0);
    REGISTER_METHOD(isInitialized, 0);
    REGISTER_METHOD(dispose, 0);
    REGISTER_METHOD(getState, 0);
    REGISTER_METHOD(getErrorString, 1);

    // Égaliseur
    REGISTER_METHOD(equalizerInitialize, 1);
    REGISTER_METHOD(equalizerIsInitialized, 0);
    REGISTER_METHOD(equalizerRelease, 0);
    REGISTER_METHOD(equalizerSetMasterGain, 1);
    REGISTER_METHOD(equalizerSetBypass, 1);
    REGISTER_METHOD(equalizerSetSampleRate, 1);
    REGISTER_METHOD(equalizerSetBand, 2);
    REGISTER_METHOD(equalizerGetBand, 1);
    REGISTER_METHOD(equalizerSetBandGain, 2);
    REGISTER_METHOD(equalizerSetBandFrequency, 2);
    REGISTER_METHOD(equalizerSetBandQ, 2);
    REGISTER_METHOD(equalizerSetBandType, 2);
    REGISTER_METHOD(equalizerSetBandEnabled, 2);
    REGISTER_METHOD(equalizerGetInfo, 0);
    REGISTER_METHOD(equalizerGetNumBands, 0);
    REGISTER_METHOD(equalizerProcessMono, 1);
    REGISTER_METHOD(equalizerProcessStereo, 2);
    REGISTER_METHOD(equalizerLoadPreset, 1);
    REGISTER_METHOD(equalizerSavePreset, 1);
    REGISTER_METHOD(equalizerResetAllBands, 0);

    // Filtres
    REGISTER_METHOD(filterCreate, 0);
    REGISTER_METHOD(filterDestroy, 1);
    REGISTER_METHOD(filterSetConfig, 2);
    REGISTER_METHOD(filterGetConfig, 1);
    REGISTER_METHOD(filterSetLowpass, 4);
    REGISTER_METHOD(filterSetHighpass, 4);
    REGISTER_METHOD(filterSetBandpass, 4);
    REGISTER_METHOD(filterSetNotch, 4);
    REGISTER_METHOD(filterSetPeaking, 5);
    REGISTER_METHOD(filterSetLowShelf, 5);
    REGISTER_METHOD(filterSetHighShelf, 5);
    REGISTER_METHOD(filterSetAllpass, 4);
    REGISTER_METHOD(filterProcessMono, 2);
    REGISTER_METHOD(filterProcessStereo, 3);
    REGISTER_METHOD(filterGetInfo, 1);
    REGISTER_METHOD(filterReset, 1);

    // Utilitaires
    REGISTER_METHOD(dbToLinear, 1);
    REGISTER_METHOD(linearToDb, 1);
    REGISTER_METHOD(validateFrequency, 2);
    REGISTER_METHOD(validateQ, 1);
    REGISTER_METHOD(validateGainDB, 1);

#undef REGISTER_METHOD

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
