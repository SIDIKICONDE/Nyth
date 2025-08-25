package com.audiomodule;

/**
 * Énumérations pour le module audio Android
 */

/**
 * Types de formats audio supportés
 */
public enum AudioFormatType {
    // Formats compressés
    AAC,            // Advanced Audio Coding
    AAC_ELD,        // AAC Enhanced Low Delay (Android 4.1+)
    HE_AAC,         // High Efficiency AAC (Android 4.1+)
    AMR_NB,         // Adaptive Multi-Rate Narrowband
    AMR_WB,         // Adaptive Multi-Rate Wideband
    OPUS,           // Opus (Android 10+)
    VORBIS,         // Vorbis (Android 5.0+)
    
    // Formats non compressés
    PCM_16BIT,      // PCM 16-bit
    PCM_8BIT,       // PCM 8-bit
    PCM_FLOAT       // PCM Float (Android 5.0+)
}

/**
 * Qualité d'enregistrement
 */
public enum AudioQuality {
    LOW(0),         // Basse qualité, petite taille
    MEDIUM(1),      // Qualité moyenne
    HIGH(2),        // Haute qualité
    MAXIMUM(3);     // Qualité maximale
    
    private final int value;
    
    AudioQuality(int value) {
        this.value = value;
    }
    
    public int getValue() {
        return value;
    }
}

/**
 * Presets prédéfinis pour différents usages
 */
public enum AudioPreset {
    VOICE_NOTE,     // Notes vocales
    VOICE_CALL,     // Appels VoIP
    MUSIC_HIGH,     // Musique haute qualité
    MUSIC_STANDARD, // Musique qualité standard
    PROFESSIONAL,   // Enregistrement professionnel
    COMPACT,        // Fichiers compacts
    STREAMING       // Optimisé pour le streaming
}

/**
 * Erreurs de l'enregistreur audio
 */
public enum AudioRecorderError {
    PERMISSION_DENIED("Microphone permission denied"),
    ALREADY_RECORDING("Already recording"),
    NOT_RECORDING("Not currently recording"),
    INVALID_STATE("Invalid recorder state"),
    START_FAILED("Failed to start recording"),
    STOP_FAILED("Failed to stop recording"),
    PAUSE_FAILED("Failed to pause recording"),
    RESUME_FAILED("Failed to resume recording"),
    PAUSE_NOT_SUPPORTED("Pause not supported on this device"),
    RESUME_NOT_SUPPORTED("Resume not supported on this device"),
    NOT_PAUSED("Not currently paused"),
    WRITE_FAILED("Failed to write audio data"),
    CONFIGURATION_FAILED("Invalid audio configuration"),
    FILE_ERROR("File operation failed");
    
    private final String message;
    
    AudioRecorderError(String message) {
        this.message = message;
    }
    
    public String getMessage() {
        return message;
    }
    
    public int getCode() {
        return ordinal();
    }
}