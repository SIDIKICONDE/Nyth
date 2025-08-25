#pragma once

#include <jsi/jsi.h>
#include <string>
#include <vector>

#include "../../common/jsi/JSICallbackManager.h"
#include "../config/SpectrumConfig.h"

namespace facebook {
namespace react {

// === Convertisseur JSI pour le module d'analyse spectrale ===

class SpectrumJSIConverter {
public:
    // === Conversion JSI vers native ===

    // Configuration
    static Nyth::Audio::SpectrumConfig jsiToSpectrumConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);

    // Données audio
    static std::vector<float> jsiArrayToFloatVector(jsi::Runtime& rt, const jsi::Array& jsArray);
    static void floatVectorToJSIArray(jsi::Runtime& rt, const std::vector<float>& data, jsi::Array& jsArray);

    // === Conversion native vers JSI ===

    // Configuration
    static jsi::Object spectrumConfigToJSI(jsi::Runtime& rt, const Nyth::Audio::SpectrumConfig& config);

    // Données spectrales
    static jsi::Object spectrumDataToJSI(jsi::Runtime& rt, const Nyth::Audio::SpectrumData& data);
    static jsi::Object spectrumStatisticsToJSI(jsi::Runtime& rt, const Nyth::Audio::SpectrumStatistics& stats);

    // Données audio
    static jsi::Array floatVectorToJSIArray(jsi::Runtime& rt, const std::vector<float>& data);

    // === Utilitaires ===

    // Validation
    static bool validateJSIConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static std::string getJSIConfigValidationError(jsi::Runtime& rt, const jsi::Object& jsConfig);

    // Extraction de propriétés avec valeurs par défaut
    static double getJSIDouble(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                               double defaultValue = 0.0);
    static int getJSIInt(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop, int defaultValue = 0);
    static uint32_t getJSIUint32(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                 uint32_t defaultValue = 0);
    static size_t getJSISize(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                             size_t defaultValue = 0);
    static bool getJSIBool(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                           bool defaultValue = false);
    static std::string getJSIString(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                    const std::string& defaultValue = "");

    // Vérification d'existence de propriétés
    static bool hasProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);
    static bool isPropertyObject(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);
    static bool isPropertyArray(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);
    static bool isPropertyNumber(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);
    static bool isPropertyBool(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);
    static bool isPropertyString(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);

        // === Méthodes template pour validation de type ===
    template <typename T>
    static bool isPropertyType(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);

    template <typename T>
    static T getPropertyWithDefault(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop, T defaultValue);

    // === Constantes ===

    // Noms des propriétés JavaScript
    static constexpr auto PROP_FFT_SIZE = "fftSize";
    static constexpr auto PROP_SAMPLE_RATE = "sampleRate";
    static constexpr auto PROP_MIN_FREQ = "minFreq";
    static constexpr auto PROP_MAX_FREQ = "maxFreq";
    static constexpr auto PROP_NUM_BANDS = "numBands";
    static constexpr auto PROP_USE_WINDOWING = "useWindowing";
    static constexpr auto PROP_USE_SIMD = "useSIMD";
    static constexpr auto PROP_OVERLAP = "overlap";
    static constexpr auto PROP_ENABLE_MEMORY_POOL = "enableMemoryPool";
    static constexpr auto PROP_MEMORY_POOL_SIZE = "memoryPoolSize";

    // Données spectrales
    static constexpr auto PROP_NUM_BANDS_DATA = "numBands";
    static constexpr auto PROP_TIMESTAMP = "timestamp";
    static constexpr auto PROP_MAGNITUDES = "magnitudes";
    static constexpr auto PROP_FREQUENCIES = "frequencies";

    // Statistiques
    static constexpr auto PROP_AVERAGE_MAGNITUDE = "averageMagnitude";
    static constexpr auto PROP_PEAK_MAGNITUDE = "peakMagnitude";
    static constexpr auto PROP_CENTROID = "centroid";
    static constexpr auto PROP_SPREAD = "spread";
    static constexpr auto PROP_FLATNESS = "flatness";
    static constexpr auto PROP_ROLLOFF = "rolloff";
    static constexpr auto PROP_TOTAL_FRAMES = "totalFrames";
    static constexpr auto PROP_AVG_PROCESSING_TIME = "averageProcessingTimeMs";
    static constexpr auto PROP_MAX_PROCESSING_TIME = "maxProcessingTimeMs";

private:
    // Fonctions auxiliaires privées
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, double value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, int value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, uint32_t value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, size_t value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, bool value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, const std::string& value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, const jsi::Object& value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, const jsi::Array& value);
};

} // namespace react
} // namespace facebook
