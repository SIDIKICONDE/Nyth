#include "AudioCaptureJNI.hpp"
#include "../../AudioCaptureImpl.hpp"
#include <android/log.h>

#define LOG_TAG "AudioCaptureJNI"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace Nyth {
namespace Audio {
namespace JNI {

// Variables globales pour stocker les références JNI
static JavaVM* gJavaVM = nullptr;
static jclass gContextClass = nullptr;
static jmethodID gCheckPermissionMethod = nullptr;
static jmethodID gRequestPermissionsMethod = nullptr;

// Classe helper pour gérer les références JNI globales
class JNIHelper {
public:
    static bool initializeJNI(JNIEnv* env, jobject context) {
        if (gJavaVM != nullptr) {
            return true; // Déjà initialisé
        }

        // Obtenir la JavaVM
        if (env->GetJavaVM(&gJavaVM) != JNI_OK) {
            LOGE("Failed to get JavaVM");
            return false;
        }

        // Obtenir les références aux classes et méthodes
        jclass contextClass = env->FindClass("android/content/Context");
        if (contextClass == nullptr) {
            LOGE("Failed to find Context class");
            return false;
        }

        // Garder une référence globale à la classe Context
        gContextClass = static_cast<jclass>(env->NewGlobalRef(contextClass));
        env->DeleteLocalRef(contextClass);

        // Méthode checkSelfPermission
        gCheckPermissionMethod = env->GetMethodID(gContextClass, "checkSelfPermission",
                                                  "(Ljava/lang/String;)I");
        if (gCheckPermissionMethod == nullptr) {
            LOGE("Failed to find checkSelfPermission method");
            return false;
        }

        // Classe Activity pour requestPermissions
        jclass activityClass = env->FindClass("android/app/Activity");
        if (activityClass != nullptr) {
            gRequestPermissionsMethod = env->GetMethodID(activityClass, "requestPermissions",
                                                         "([Ljava/lang/String;I)V");
            env->DeleteLocalRef(activityClass);
        }

        LOGD("JNI initialized successfully");
        return true;
    }

    static void cleanupJNI(JNIEnv* env) {
        if (gContextClass != nullptr) {
            env->DeleteGlobalRef(gContextClass);
            gContextClass = nullptr;
        }
        gJavaVM = nullptr;
        gCheckPermissionMethod = nullptr;
        gRequestPermissionsMethod = nullptr;
        LOGD("JNI cleaned up");
    }

    static JNIEnv* getEnv() {
        JNIEnv* env = nullptr;
        if (gJavaVM != nullptr) {
            int status = gJavaVM->GetEnv((void**)&env, JNI_VERSION_1_6);
            if (status == JNI_EDETACHED) {
                // Attacher le thread actuel à la JVM
                status = gJavaVM->AttachCurrentThread(&env, nullptr);
                if (status != JNI_OK) {
                    LOGE("Failed to attach current thread to JVM");
                    return nullptr;
                }
            }
        }
        return env;
    }

    static bool checkJNIException(JNIEnv* env) {
        if (env->ExceptionCheck()) {
            env->ExceptionDescribe();
            env->ExceptionClear();
            return true;
        }
        return false;
    }

    static std::string getJNIExceptionMessage(JNIEnv* env) {
        if (!env->ExceptionCheck()) {
            return "";
        }

        jthrowable exception = env->ExceptionOccurred();
        env->ExceptionClear();

        // Obtenir la classe de l'exception
        jclass exceptionClass = env->GetObjectClass(exception);
        jmethodID toStringMethod = env->GetMethodID(exceptionClass, "toString", "()Ljava/lang/String;");

        if (toStringMethod != nullptr) {
            jstring message = static_cast<jstring>(env->CallObjectMethod(exception, toStringMethod));
            if (message != nullptr) {
                const char* utfChars = env->GetStringUTFChars(message, nullptr);
                std::string result(utfChars);
                env->ReleaseStringUTFChars(message, utfChars);
                env->DeleteLocalRef(message);
                return result;
            }
        }

        env->DeleteLocalRef(exception);
        env->DeleteLocalRef(exceptionClass);
        return "Unknown JNI exception";
    }
};

// Implémentation des fonctions JNI pour les permissions
bool hasAudioPermission(JNIEnv* env, jobject context) {
    if (!initializeJNI(env, context)) {
        LOGE("Failed to initialize JNI");
        return false;
    }

    if (gContextClass == nullptr || gCheckPermissionMethod == nullptr) {
        LOGE("JNI not properly initialized");
        return false;
    }

    // Créer la string de permission
    jstring permissionString = env->NewStringUTF("android.permission.RECORD_AUDIO");
    if (permissionString == nullptr) {
        LOGE("Failed to create permission string");
        return false;
    }

    // Vérifier la permission
    jint result = env->CallIntMethod(context, gCheckPermissionMethod, permissionString);
    bool granted = (result == 0); // 0 = PERMISSION_GRANTED

    // Nettoyer
    env->DeleteLocalRef(permissionString);

    if (JNIHelper::checkJNIException(env)) {
        LOGE("Exception during permission check: %s", JNIHelper::getJNIExceptionMessage(env).c_str());
        return false;
    }

    LOGD("Audio permission check result: %s", granted ? "granted" : "denied");
    return granted;
}

void requestAudioPermission(JNIEnv* env, jobject activity, std::function<void(bool)> callback) {
    if (!initializeJNI(env, activity)) {
        LOGE("Failed to initialize JNI");
        if (callback) callback(false);
        return;
    }

    if (gRequestPermissionsMethod == nullptr) {
        LOGE("requestPermissions method not available");
        if (callback) callback(false);
        return;
    }

    // Créer le tableau de permissions
    jclass stringClass = env->FindClass("java/lang/String");
    if (stringClass == nullptr) {
        LOGE("Failed to find String class");
        if (callback) callback(false);
        return;
    }

    jobjectArray permissionArray = env->NewObjectArray(1, stringClass, nullptr);
    jstring permissionString = env->NewStringUTF("android.permission.RECORD_AUDIO");

    env->SetObjectArrayElement(permissionArray, 0, permissionString);

    // Demander la permission
    const int PERMISSION_REQUEST_CODE = 200;
    env->CallVoidMethod(activity, gRequestPermissionsMethod, permissionArray, PERMISSION_REQUEST_CODE);

    // Nettoyer
    env->DeleteLocalRef(permissionString);
    env->DeleteLocalRef(permissionArray);
    env->DeleteLocalRef(stringClass);

    if (JNIHelper::checkJNIException(env)) {
        LOGE("Exception during permission request: %s", JNIHelper::getJNIExceptionMessage(env).c_str());
        if (callback) callback(false);
        return;
    }

    // Note: Le callback sera appelé depuis onRequestPermissionsResult côté Java
    // Pour l'instant, on appelle le callback avec le résultat actuel
    bool currentPermission = hasAudioPermission(env, activity);
    if (callback) {
        callback(currentPermission);
    }

    LOGD("Audio permission requested");
}

// Implémentation des fonctions JNI pour les périphériques audio
std::vector<std::string> getAvailableAudioDevices(JNIEnv* env, jobject context) {
    std::vector<std::string> devices;

    // Pour l'instant, retourner un périphérique par défaut
    // Dans une implémentation complète, utiliser AudioManager pour lister les périphériques
    devices.push_back("default");

    LOGD("Available audio devices: %zu", devices.size());
    return devices;
}

std::string getDefaultAudioDevice(JNIEnv* env, jobject context) {
    return "default";
}

// Implémentation des fonctions JNI pour la session audio
bool configureAudioSession(JNIEnv* env, jobject context, int sampleRate, int channelCount) {
    // Configuration basique de la session audio Android
    // Dans une implémentation complète, utiliser AudioManager.setMode() et setSpeakerphoneOn()

    LOGD("Audio session configured: sampleRate=%d, channels=%d", sampleRate, channelCount);
    return true;
}

AudioSessionInfo getAudioSessionInfo(JNIEnv* env, jobject context) {
    AudioSessionInfo info;
    info.sampleRate = 44100; // Valeur par défaut
    info.channelCount = 2;
    info.bufferSize = 1024; // Valeur par défaut
    info.isLowLatency = false; // À déterminer selon les capacités du device

    LOGD("Audio session info retrieved");
    return info;
}

// Fonctions utilitaires JNI
bool initializeJNI(JNIEnv* env, jobject context) {
    return JNIHelper::initializeJNI(env, context);
}

void cleanupJNI(JNIEnv* env) {
    JNIHelper::cleanupJNI(env);
}

bool checkJNIException(JNIEnv* env) {
    return JNIHelper::checkJNIException(env);
}

std::string getJNIExceptionMessage(JNIEnv* env) {
    return JNIHelper::getJNIExceptionMessage(env);
}

} // namespace JNI
} // namespace Audio
} // namespace Nyth

// === PONT JNI POUR AudioCaptureJNIBridge ===

extern "C" {

JNIEXPORT jlong JNICALL
Java_com_nyth_audio_AudioCaptureJNIBridge_nativeCreate(JNIEnv* env, jobject thiz) {
    try {
        // Créer une instance d'AudioCaptureAndroid
        auto capture = std::make_shared<Nyth::Audio::AudioCaptureAndroid>();
        if (!capture) {
            LOGE("Failed to create AudioCaptureAndroid instance");
            return 0;
        }

        // Retourner le pointeur comme jlong
        return reinterpret_cast<jlong>(capture.get());
    } catch (const std::exception& e) {
        LOGE("Exception in nativeCreate: %s", e.what());
        return 0;
    }
}

JNIEXPORT void JNICALL
Java_com_nyth_audio_AudioCaptureJNIBridge_nativeDestroy(JNIEnv* env, jobject thiz, jlong ptr) {
    if (ptr == 0) return;

    try {
        // Convertir le pointeur et libérer la mémoire
        auto capture = reinterpret_cast<Nyth::Audio::AudioCaptureAndroid*>(ptr);
        delete capture; // Si c'était un pointeur brut, mais normalement on utilise des shared_ptr
        LOGD("AudioCaptureAndroid instance destroyed");
    } catch (const std::exception& e) {
        LOGE("Exception in nativeDestroy: %s", e.what());
    }
}

JNIEXPORT void JNICALL
Java_com_nyth_audio_AudioCaptureJNIBridge_nativeSetAndroidContext(JNIEnv* env, jobject thiz, jlong ptr, jobject context) {
    if (ptr == 0 || context == nullptr) return;

    try {
        auto capture = reinterpret_cast<Nyth::Audio::AudioCaptureAndroid*>(ptr);

        // Stocker les références JNI dans l'instance
        capture->setJavaVM(env);
        capture->setAndroidContext(env, context);

        // Initialiser les utilitaires JNI
        Nyth::Audio::JNI::initializeJNI(env, context);

        LOGD("Android context set for AudioCaptureAndroid");
    } catch (const std::exception& e) {
        LOGE("Exception in nativeSetAndroidContext: %s", e.what());
    }
}

JNIEXPORT void JNICALL
Java_com_nyth_audio_AudioCaptureJNIBridge_nativeOnPermissionResult(JNIEnv* env, jobject thiz, jlong ptr, jboolean granted) {
    if (ptr == 0) return;

    try {
        auto capture = reinterpret_cast<Nyth::Audio::AudioCaptureAndroid*>(ptr);

        // Notifier l'instance du résultat de la permission
        capture->onPermissionResult(static_cast<bool>(granted));

        LOGD("Permission result notified: %s", granted ? "granted" : "denied");
    } catch (const std::exception& e) {
        LOGE("Exception in nativeOnPermissionResult: %s", e.what());
    }
}

} // extern "C"
