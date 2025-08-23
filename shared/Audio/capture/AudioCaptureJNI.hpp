#pragma once

#ifdef __ANDROID__

#include <jni.h>
#include <string>
#include <functional>

namespace Nyth {
namespace Audio {
namespace JNI {

// === Gestion des permissions audio Android ===

/**
 * Vérifie si la permission RECORD_AUDIO est accordée
 * @param env Environnement JNI
 * @param context Contexte Android (Activity ou Application)
 * @return true si la permission est accordée, false sinon
 */
bool hasAudioPermission(JNIEnv* env, jobject context);

/**
 * Demande la permission RECORD_AUDIO
 * @param env Environnement JNI
 * @param activity Activité Android pour demander la permission
 * @param callback Callback appelé avec le résultat (true = accordé, false = refusé)
 */
void requestAudioPermission(JNIEnv* env, jobject activity, std::function<void(bool)> callback);

// === Gestion des périphériques audio Android ===

/**
 * Liste les périphériques audio disponibles
 * @param env Environnement JNI
 * @param context Contexte Android
 * @return Vecteur des informations sur les périphériques
 */
std::vector<std::string> getAvailableAudioDevices(JNIEnv* env, jobject context);

/**
 * Obtient le périphérique audio par défaut
 * @param env Environnement JNI
 * @param context Contexte Android
 * @return ID du périphérique par défaut
 */
std::string getDefaultAudioDevice(JNIEnv* env, jobject context);

// === Gestion de la session audio Android ===

/**
 * Configure la session audio Android
 * @param env Environnement JNI
 * @param context Contexte Android
 * @param sampleRate Taux d'échantillonnage souhaité
 * @param channelCount Nombre de canaux
 * @return true si la configuration a réussi
 */
bool configureAudioSession(JNIEnv* env, jobject context, int sampleRate, int channelCount);

/**
 * Obtient les informations sur la session audio actuelle
 * @param env Environnement JNI
 * @param context Contexte Android
 * @return Informations sur la session audio
 */
struct AudioSessionInfo {
    int sampleRate;
    int channelCount;
    int bufferSize;
    bool isLowLatency;
};

AudioSessionInfo getAudioSessionInfo(JNIEnv* env, jobject context);

// === Utilitaires JNI ===

/**
 * Initialise les références JNI globales
 * @param env Environnement JNI
 * @param context Contexte Android
 * @return true si l'initialisation a réussi
 */
bool initializeJNI(JNIEnv* env, jobject context);

/**
 * Nettoie les références JNI globales
 * @param env Environnement JNI
 */
void cleanupJNI(JNIEnv* env);

/**
 * Vérifie si une exception JNI s'est produite
 * @param env Environnement JNI
 * @return true si une exception est en cours
 */
bool checkJNIException(JNIEnv* env);

/**
 * Obtient le message d'une exception JNI
 * @param env Environnement JNI
 * @return Message de l'exception
 */
std::string getJNIExceptionMessage(JNIEnv* env);

} // namespace JNI
} // namespace Audio
} // namespace Nyth

#endif // __ANDROID__
