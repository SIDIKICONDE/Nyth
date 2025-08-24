#pragma once

// === Configuration du support des plateformes ===

namespace Nyth {
namespace Audio {
namespace Platform {

// === Plateformes supportées ===
#define NYTH_AUDIO_PLATFORM_ANDROID 1
#define NYTH_AUDIO_PLATFORM_IOS 1
#define NYTH_AUDIO_PLATFORM_DESKTOP 0 // ❌ Désactivé intentionnellement

// === Vérifications de compilation ===
#if !defined(__ANDROID__) && !TARGET_OS_IOS
#error "NativeAudioCaptureModule ne supporte que Android et iOS"
#endif

// === Configuration par plateforme ===

#ifdef __ANDROID__
// Android supporte plusieurs APIs avec fallback
#define NYTH_AUDIO_SUPPORT_OPENSLES 1
#define NYTH_AUDIO_SUPPORT_AAUDIO 1
#define NYTH_AUDIO_SUPPORT_OBOE 1
#endif

#ifdef __APPLE__
#if TARGET_OS_IOS
// iOS supporte AudioUnit
#define NYTH_AUDIO_SUPPORT_AUDIOUNIT 1
#endif
#endif

// === Fonctions utilitaires ===

inline const char* getCurrentPlatformName() {
#ifdef __ANDROID__
    return "Android";
#elif TARGET_OS_IOS
    return "iOS";
#else
    return "Unsupported";
#endif
}

inline bool isPlatformSupported() {
#ifdef __ANDROID__
    return true;
#elif TARGET_OS_IOS
    return true;
#else
    return false;
#endif
}

inline const char* getPlatformAudioAPI() {
#ifdef __ANDROID__
    return "OpenSL ES / AAudio / Oboe";
#elif TARGET_OS_IOS
    return "AudioUnit";
#else
    return "None";
#endif
}

} // namespace Platform
} // namespace Audio
} // namespace Nyth
