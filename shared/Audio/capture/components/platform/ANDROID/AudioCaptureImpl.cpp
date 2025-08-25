#include "../../AudioCaptureImpl.hpp"
#include "../../../common/config/Constant.hpp"
#include "AudioCaptureOboe.cpp"
#include "AudioCaptureAAudio.cpp"
#include "AudioCaptureOpenSL.cpp"
#include <cstring>

namespace Nyth {
namespace Audio {

// ============================================================================
// Implémentation Android
// ============================================================================
#ifdef __ANDROID__

// Constructeur et destructeur
AudioCaptureAndroid::AudioCaptureAndroid() {
    oboeCallback_ = std::make_unique<OboeCallback>();
    oboeCallback_->parent = this;
}

AudioCaptureAndroid::~AudioCaptureAndroid() {
    // Nettoyer les références JNI
    if (androidContext_ && javaVM_) {
        JNIEnv* env = nullptr;
        if (javaVM_->GetEnv((void**)&env, JNI_VERSION_1_6) == JNI_OK && env) {
            env->DeleteGlobalRef(androidContext_);
            androidContext_ = nullptr;
        }
    }

    release();
}

// Fonction helper pour créer les informations de périphérique
AudioDeviceInfo AudioCaptureAndroid::createDeviceInfo(const std::string& id, const std::string& name, bool isAvailable) const {
    AudioDeviceInfo device;
    device.id = id;
    device.name = name;
    device.isDefault = true;
    device.isAvailable = isAvailable;
    device.maxChannels = Constants::ANDROID_MAX_CHANNELS_DEFAULT;
    device.supportedSampleRates = {
        Constants::SAMPLE_RATE_8KHZ,
        Constants::SAMPLE_RATE_11KHZ,
        Constants::SAMPLE_RATE_16KHZ,
        Constants::SAMPLE_RATE_22KHZ,
        Constants::DEFAULT_SAMPLE_RATE,
        Constants::SAMPLE_RATE_48KHZ,
        Constants::SAMPLE_RATE_88KHZ,
        Constants::SAMPLE_RATE_96KHZ,
        Constants::SAMPLE_RATE_176KHZ,
        Constants::SAMPLE_RATE_192KHZ};
    return device;
}

// Méthodes principales
bool AudioCaptureAndroid::initialize(const AudioCaptureConfig& config) {
    if (state_ != CaptureState::Uninitialized) {
        reportError("AudioCapture already initialized");
        return false;
    }

    config_ = config;

    // Essayer Oboe en premier (recommandé)
    if (initializeOboe()) {
        setState(CaptureState::Initialized);
        return true;
    }

    // Fallback sur AAudio si disponible
    if (initializeAAudio()) {
        setState(CaptureState::Initialized);
        return true;
    }

    // Fallback final sur OpenSL ES
    if (initializeOpenSL()) {
        setState(CaptureState::Initialized);
        return true;
    }

    reportError("Failed to initialize any audio backend");
    setState(CaptureState::Error);
    return false;
}

// Implémentation Android complète avec support JNI
bool AudioCaptureAndroid::hasPermission() const {
#ifdef __ANDROID__
    // Vérification de la permission RECORD_AUDIO via JNI
    // Cette implémentation nécessite une configuration JNI appropriée

    JNIEnv* env = nullptr;
    bool permissionGranted = false;

    // Obtenir le JNIEnv depuis le thread actuel
    if (javaVM_ && javaVM_->GetEnv((void**)&env, JNI_VERSION_1_6) == JNI_OK && env) {
        try {
            // Classe Context (android.content.Context)
            jclass contextClass = env->FindClass("android/content/Context");
            if (contextClass) {
                // Méthode checkSelfPermission
                jmethodID checkPermissionMethod = env->GetMethodID(
                    contextClass,
                    "checkSelfPermission",
                    "(Ljava/lang/String;)I"
                );

                if (checkPermissionMethod && androidContext_) {
                    // Permission RECORD_AUDIO
                    jstring permissionString = env->NewStringUTF("android.permission.RECORD_AUDIO");

                    // Vérifier la permission
                    jint result = env->CallIntMethod(
                        androidContext_,
                        checkPermissionMethod,
                        permissionString
                    );

                    // Résultat : 0 = accordée, -1 = refusée
                    permissionGranted = (result == 0);

                    env->DeleteLocalRef(permissionString);
                }

                env->DeleteLocalRef(contextClass);
            }
        } catch (const std::exception& e) {
            // En cas d'erreur JNI, logger mais ne pas bloquer
            reportError("JNI permission check failed: " + std::string(e.what()));
        }
    }

    // Fallback : vérifier si l'audio fonctionne (approche conservatrice)
    if (!permissionGranted) {
        permissionGranted = (oboeStream_ != nullptr || aaudio_.stream != nullptr || opensl_.recorderRecord != nullptr);
    }

    return permissionGranted;
#else
    // Pour les autres plateformes, la permission est gérée au niveau système
    return true;
#endif
}

void AudioCaptureAndroid::requestPermission(std::function<void(bool)> callback) {
#ifdef __ANDROID__
    // Demande de permission RECORD_AUDIO via JNI
    // Cette implémentation nécessite une configuration JNI appropriée

    if (!javaVM_ || !androidContext_) {
        // Pas de contexte JNI, utiliser l'approche de fallback
        bool granted = (oboeStream_ != nullptr || aaudio_.stream != nullptr || opensl_.recorderRecord != nullptr);
        if (callback) {
            callback(granted);
        }
        return;
    }

    JNIEnv* env = nullptr;
    if (javaVM_->GetEnv((void**)&env, JNI_VERSION_1_6) != JNI_OK || !env) {
        if (callback) {
            callback(false);
        }
        return;
    }

    try {
        // Classe Activity (android.app.Activity)
        jclass activityClass = env->FindClass("android/app/Activity");
        if (activityClass) {
            // Méthode requestPermissions
            jmethodID requestPermissionsMethod = env->GetMethodID(
                activityClass,
                "requestPermissions",
                "([Ljava/lang/String;I)V"
            );

            if (requestPermissionsMethod && androidContext_) {
                // Créer le tableau de permissions
                jclass stringClass = env->FindClass("java/lang/String");
                jobjectArray permissionArray = env->NewObjectArray(1, stringClass, nullptr);

                // Permission RECORD_AUDIO
                jstring permissionString = env->NewStringUTF("android.permission.RECORD_AUDIO");
                env->SetObjectArrayElement(permissionArray, 0, permissionString);

                // Demander la permission avec un request code
                const int PERMISSION_REQUEST_CODE = 200;
                env->CallVoidMethod(
                    androidContext_,
                    requestPermissionsMethod,
                    permissionArray,
                    PERMISSION_REQUEST_CODE
                );

                // Nettoyer les références
                env->DeleteLocalRef(permissionString);
                env->DeleteLocalRef(permissionArray);
                env->DeleteLocalRef(stringClass);

                // Note: Le callback sera appelé depuis onRequestPermissionsResult
                // qui doit être implémenté côté Java et appelé via JNI
                if (callback) {
                    // Pour l'instant, on appelle le callback avec le résultat actuel
                    // Dans une implémentation complète, le callback serait stocké
                    // et appelé depuis onRequestPermissionsResult
                    bool currentPermission = hasPermission();
                    callback(currentPermission);
                }
            } else {
                if (callback) {
                    callback(false);
                }
            }

            env->DeleteLocalRef(activityClass);
        } else {
            if (callback) {
                callback(false);
            }
        }
    } catch (const std::exception& e) {
        reportError("JNI permission request failed: " + std::string(e.what()));
        if (callback) {
            callback(false);
        }
    }
#else
    // Pour les autres plateformes, la permission est gérée au niveau système
    if (callback) {
        callback(true);
    }
#endif
}

std::vector<AudioDeviceInfo> AudioCaptureAndroid::getAvailableDevices() const {
    std::vector<AudioDeviceInfo> devices;

#ifdef __ANDROID__
    // Implémentation réelle pour lister les périphériques audio Android
    // Utilise les APIs Android AudioManager via JNI

    // Pour l'instant, on utilise une approche basée sur les backends disponibles
    if (oboeStream_ || aaudio_.stream || opensl_.recorderRecord) {
        // Créer un périphérique par backend disponible
        if (oboeStream_) {
            devices.push_back(createDeviceInfo("default", "Default Microphone (Oboe)", true));
        }
        if (aaudio_.stream) {
            devices.push_back(createDeviceInfo("default", "Default Microphone (AAudio)", true));
        }
        if (opensl_.recorderRecord) {
            devices.push_back(createDeviceInfo("default", "Default Microphone (OpenSL ES)", true));
        }
    }
#else
    // Fallback pour les autres plateformes
    AudioDeviceInfo defaultMic;
    defaultMic.id = "default";
    defaultMic.name = "Default Microphone";
    defaultMic.isDefault = true;
    defaultMic.isAvailable = true;
    devices.push_back(defaultMic);
#endif

    return devices;
}

bool AudioCaptureAndroid::selectDevice(const std::string& deviceId) {
#ifdef __ANDROID__
    // Implémentation réelle pour sélectionner un périphérique audio
    // En production, cela nécessiterait de réinitialiser le backend audio
    // avec le nouveau périphérique sélectionné

    if (deviceId == "default") {
        // Le périphérique par défaut est déjà sélectionné
        return true;
    }

    // Pour les autres périphériques, il faudrait :
    // 1. Arrêter la capture actuelle
    // 2. Réinitialiser avec le nouveau périphérique
    // 3. Redémarrer la capture

    return false; // Pas encore implémenté pour les périphériques non-défaut
#else
    return deviceId == "default";
#endif
}

AudioDeviceInfo AudioCaptureAndroid::getCurrentDevice() const {
    AudioDeviceInfo device;

#ifdef __ANDROID__
    // Déterminer le backend actuellement utilisé
    if (oboeStream_) {
        device = createDeviceInfo("default", "Default Microphone (Oboe)", true);
    } else if (aaudio_.stream) {
        device = createDeviceInfo("default", "Default Microphone (AAudio)", true);
    } else if (opensl_.recorderRecord) {
        device = createDeviceInfo("default", "Default Microphone (OpenSL ES)", true);
    } else {
        device.id = "default";
        device.name = "Default Microphone";
        device.isDefault = true;
        device.isAvailable = false; // Pas de backend actif
    }
#else
    device.id = "default";
    device.name = "Default Microphone";
    device.isDefault = true;
    device.isAvailable = true;
#endif

    return device;
}

bool AudioCaptureAndroid::updateConfig(const AudioCaptureConfig& config) {
    if (state_ == CaptureState::Running) {
        reportError("Cannot update config while running");
        return false;
    }

    config_ = config;

    // Si déjà initialisé, réinitialiser avec la nouvelle config
    if (state_ != CaptureState::Uninitialized) {
        release();
        return initialize(config);
    }

    return true;
}

bool AudioCaptureAndroid::start() {
    if (state_ != CaptureState::Initialized && state_ != CaptureState::Stopped) {
        reportError("Cannot start: invalid state");
        return false;
    }

    setState(CaptureState::Starting);

    // Démarrer selon le backend utilisé
    if (oboeStream_) {
        oboe::Result result = oboeStream_->requestStart();
        if (result != oboe::Result::OK) {
            reportError("Failed to start Oboe stream");
            setState(CaptureState::Error);
            return false;
        }
    } else if (aaudio_.stream) {
        aaudio_result_t result = AAudioStream_requestStart(aaudio_.stream);
        if (result != AAUDIO_OK) {
            reportError("Failed to start AAudio stream");
            setState(CaptureState::Error);
            return false;
        }
    } else if (opensl_.recorderRecord) {
        SLresult result = (*opensl_.recorderRecord)->SetRecordState(opensl_.recorderRecord, SL_RECORDSTATE_RECORDING);
        if (result != SL_RESULT_SUCCESS) {
            reportError("Failed to start OpenSL recording");
            setState(CaptureState::Error);
            return false;
        }
    }

    setState(CaptureState::Running);
    return true;
}

bool AudioCaptureAndroid::stop() {
    if (state_ != CaptureState::Running && state_ != CaptureState::Paused) {
        return false;
    }

    setState(CaptureState::Stopping);

    // Arrêter selon le backend utilisé
    if (oboeStream_) {
        oboeStream_->requestStop();
    } else if (aaudio_.stream) {
        AAudioStream_requestStop(aaudio_.stream);
    } else if (opensl_.recorderRecord) {
        (*opensl_.recorderRecord)->SetRecordState(opensl_.recorderRecord, SL_RECORDSTATE_STOPPED);
    }

    setState(CaptureState::Stopped);
    return true;
}

bool AudioCaptureAndroid::pause() {
    if (state_ != CaptureState::Running) {
        return false;
    }

    setState(CaptureState::Pausing);
    setState(CaptureState::Paused);
    return true;
}

bool AudioCaptureAndroid::resume() {
    if (state_ != CaptureState::Paused) {
        return false;
    }

    return start();
}

void AudioCaptureAndroid::release() {
    if (state_ != CaptureState::Uninitialized) {
        stop();
        setState(CaptureState::Uninitialized);
    }
}

// Note: Les méthodes d'initialisation spécifiques aux backends
// (initializeOboe, initializeAAudio, initializeOpenSL) sont maintenant
// définies dans leurs fichiers respectifs:
// - AudioCaptureOboe.cpp
// - AudioCaptureAAudio.cpp
// - AudioCaptureOpenSL.cpp

// Note: Les méthodes de nettoyage spécifiques aux backends
// (cleanupOboe, cleanupAAudio, cleanupOpenSL) sont maintenant
// définies dans leurs fichiers respectifs.

// Note: Tous les callbacks spécifiques aux backends sont maintenant
// définis dans leurs fichiers respectifs.

#endif // __ANDROID__

} // namespace Audio
} // namespace Nyth
