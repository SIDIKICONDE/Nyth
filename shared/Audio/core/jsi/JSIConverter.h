#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <vector>
#include "../../common/config/AudioConfig.h"

namespace facebook {
namespace react {

/**
 * @brief Classe utilitaire pour la conversion entre types JavaScript (JSI) et types C++ natifs
 * 
 * Cette classe fournit des méthodes statiques pour convertir les objets JavaScript
 * en structures C++ et vice-versa, spécifiquement pour le module Audio Core.
 */
class JSIConverter {
public:
    // === Conversion AudioConfig ===
    /**
     * @brief Convertit un objet JavaScript en AudioConfig natif
     * @param rt Runtime JSI
     * @param jsConfig Objet JavaScript contenant la configuration
     * @return Configuration audio native
     */
    static Nyth::Audio::AudioConfig jsToAudioConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    
    /**
     * @brief Convertit une AudioConfig native en objet JavaScript
     * @param rt Runtime JSI
     * @param config Configuration audio native
     * @return Objet JavaScript représentant la configuration
     */
    static jsi::Object audioConfigToJS(jsi::Runtime& rt, const Nyth::Audio::AudioConfig& config);

    // === Conversion des arrays audio ===
    /**
     * @brief Convertit un Float32Array JavaScript en vector C++
     * @param rt Runtime JSI
     * @param jsArray Array JavaScript (peut être un Array normal ou TypedArray)
     * @return Vector de floats
     */
    static std::vector<float> jsArrayToFloatVector(jsi::Runtime& rt, const jsi::Value& jsArray);
    
    /**
     * @brief Convertit un vector C++ en Float32Array JavaScript
     * @param rt Runtime JSI
     * @param data Vector de floats
     * @return Float32Array JavaScript
     */
    static jsi::Value floatVectorToJSArray(jsi::Runtime& rt, const std::vector<float>& data);
    
    /**
     * @brief Convertit des données audio brutes en JavaScript Array (optimisé)
     * @param rt Runtime JSI
     * @param data Pointeur vers les données audio
     * @param length Nombre d'échantillons
     * @return Array JavaScript
     */
    static jsi::Value floatArrayToJSArray(jsi::Runtime& rt, const float* data, size_t length);

    // === Conversion des paramètres de filtre ===
    /**
     * @brief Convertit un type de filtre string en enum
     * @param filterType String représentant le type ("lowpass", "highpass", etc.)
     * @return Valeur enum du type de filtre
     */
    static int stringToFilterType(const std::string& filterType);
    
    /**
     * @brief Convertit un enum de type de filtre en string
     * @param type Valeur enum du type de filtre
     * @return String représentant le type
     */
    static std::string filterTypeToString(int type);

    // === Conversion des configurations de bande EQ ===
    /**
     * @brief Structure représentant une bande d'égaliseur
     */
    struct EQBandConfig {
        double frequency;
        double gainDB;
        double q;
        int type;
        bool enabled;
    };
    
    /**
     * @brief Convertit un objet JavaScript en configuration de bande EQ
     * @param rt Runtime JSI
     * @param jsBand Objet JavaScript contenant la configuration de bande
     * @return Configuration de bande native
     */
    static EQBandConfig jsToEQBandConfig(jsi::Runtime& rt, const jsi::Object& jsBand);
    
    /**
     * @brief Convertit une configuration de bande EQ en objet JavaScript
     * @param rt Runtime JSI
     * @param band Configuration de bande native
     * @return Objet JavaScript représentant la bande
     */
    static jsi::Object eqBandConfigToJS(jsi::Runtime& rt, const EQBandConfig& band);

    // === Utilitaires de validation ===
    /**
     * @brief Vérifie si une valeur JavaScript est un TypedArray
     * @param rt Runtime JSI
     * @param value Valeur à vérifier
     * @return true si c'est un TypedArray, false sinon
     */
    static bool isTypedArray(jsi::Runtime& rt, const jsi::Value& value);
    
    /**
     * @brief Obtient les données brutes d'un TypedArray si possible
     * @param rt Runtime JSI
     * @param array Array JavaScript
     * @param outData Pointeur vers le buffer de sortie
     * @param outLength Taille du buffer
     * @return true si la conversion a réussi, false sinon
     */
    static bool getTypedArrayData(jsi::Runtime& rt, const jsi::Object& array, 
                                  float** outData, size_t* outLength);

private:
    // Empêcher l'instanciation
    JSIConverter() = delete;
    ~JSIConverter() = delete;
};

} // namespace react
} // namespace facebook