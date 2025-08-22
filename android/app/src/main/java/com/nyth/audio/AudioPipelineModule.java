package com.nyth.audio;

import android.util.Log;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Module React Native pour le pipeline audio intégré
 *
 * Ce module expose les fonctionnalités du pipeline audio C++ vers JavaScript
 * avec monitoring temps réel et contrôle complet.
 *
 * Architecture:
 * JS -> Java -> JNI -> AudioPipeline (C++)
 *
 * Fonctionnalités:
 * - Capture audio avec optimisations SIMD
 * - Pipeline de traitement complet (EQ, NR, Effects, Limiter)
 * - Monitoring temps réel (niveaux, clipping, latence)
 * - Enregistrement vers fichiers WAV
 * - Configuration dynamique
 */
public class AudioPipelineModule extends ReactContextBaseJavaModule {

    private static final String TAG = "AudioPipelineModule";
    private static final String EVENT_AUDIO_LEVELS = "AudioLevels";
    private static final String EVENT_AUDIO_ERROR = "AudioError";
    private static final String EVENT_RECORDING_STATUS = "RecordingStatus";

    // États du pipeline
    private boolean isInitialized = false;
    private boolean isRunning = false;
    private boolean isPaused = false;
    private boolean isRecording = false;

    // Configuration par défaut
    private static final int DEFAULT_SAMPLE_RATE = 44100;
    private static final int DEFAULT_CHANNEL_COUNT = 2;

    public AudioPipelineModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AudioPipeline";
    }

    /**
     * Initialise le pipeline audio
     *
     * @param config Configuration du pipeline
     * @param promise Promise pour le résultat
     */
    @ReactMethod
    public void initialize(ReadableMap config, Promise promise) {
        try {
            if (isInitialized) {
                promise.reject("ALREADY_INITIALIZED", "Pipeline already initialized");
                return;
            }

            // Configuration par défaut
            int sampleRate = DEFAULT_SAMPLE_RATE;
            boolean enableEQ = true;
            boolean enableNoiseReduction = false;
            boolean enableEffects = false;

            // Lecture de la configuration
            if (config != null) {
                sampleRate = config.hasKey("sampleRate") ?
                    config.getInt("sampleRate") : DEFAULT_SAMPLE_RATE;
                enableEQ = config.hasKey("enableEqualizer") ?
                    config.getBoolean("enableEqualizer") : true;
                enableNoiseReduction = config.hasKey("enableNoiseReduction") ?
                    config.getBoolean("enableNoiseReduction") : false;
                enableEffects = config.hasKey("enableEffects") ?
                    config.getBoolean("enableEffects") : false;
            }

            Log.i(TAG, "Initializing Audio Pipeline - SampleRate: " + sampleRate +
                  ", EQ: " + enableEQ + ", NR: " + enableNoiseReduction +
                  ", Effects: " + enableEffects);

            // Appel JNI pour initialisation
            boolean success = nativeInitialize(sampleRate, enableEQ,
                                             enableNoiseReduction, enableEffects);

            if (success) {
                isInitialized = true;
                promise.resolve("Pipeline initialized successfully");
                Log.i(TAG, "Audio Pipeline initialized successfully");
            } else {
                promise.reject("INITIALIZATION_FAILED", "Failed to initialize audio pipeline");
            }

        } catch (Exception e) {
            Log.e(TAG, "Error initializing pipeline", e);
            promise.reject("INITIALIZATION_ERROR", e.getMessage());
        }
    }

    /**
     * Démarre le pipeline audio
     */
    @ReactMethod
    public void start(Promise promise) {
        if (!isInitialized) {
            promise.reject("NOT_INITIALIZED", "Pipeline not initialized");
            return;
        }

        try {
            boolean success = nativeStart();
            if (success) {
                isRunning = true;
                isPaused = false;
                promise.resolve("Pipeline started");

                // Démarrer le monitoring des niveaux
                startLevelMonitoring();
            } else {
                promise.reject("START_FAILED", "Failed to start pipeline");
            }
        } catch (Exception e) {
            promise.reject("START_ERROR", e.getMessage());
        }
    }

    /**
     * Arrête le pipeline audio
     */
    @ReactMethod
    public void stop(Promise promise) {
        if (!isInitialized) {
            promise.reject("NOT_INITIALIZED", "Pipeline not initialized");
            return;
        }

        try {
            // Arrêter d'abord l'enregistrement si en cours
            if (isRecording) {
                nativeStopRecording();
                isRecording = false;
            }

            boolean success = nativeStop();
            if (success) {
                isRunning = false;
                isPaused = false;
                promise.resolve("Pipeline stopped");
            } else {
                promise.reject("STOP_FAILED", "Failed to stop pipeline");
            }
        } catch (Exception e) {
            promise.reject("STOP_ERROR", e.getMessage());
        }
    }

    /**
     * Met en pause le pipeline
     */
    @ReactMethod
    public void pause(Promise promise) {
        if (!isRunning) {
            promise.reject("NOT_RUNNING", "Pipeline not running");
            return;
        }

        try {
            boolean success = nativePause();
            if (success) {
                isPaused = true;
                promise.resolve("Pipeline paused");
            } else {
                promise.reject("PAUSE_FAILED", "Failed to pause pipeline");
            }
        } catch (Exception e) {
            promise.reject("PAUSE_ERROR", e.getMessage());
        }
    }

    /**
     * Reprend le pipeline
     */
    @ReactMethod
    public void resume(Promise promise) {
        if (!isPaused) {
            promise.reject("NOT_PAUSED", "Pipeline not paused");
            return;
        }

        try {
            boolean success = nativeResume();
            if (success) {
                isPaused = false;
                promise.resolve("Pipeline resumed");
            } else {
                promise.reject("RESUME_FAILED", "Failed to resume pipeline");
            }
        } catch (Exception e) {
            promise.reject("RESUME_ERROR", e.getMessage());
        }
    }

    /**
     * Configuration de l'equalizer
     */
    @ReactMethod
    public void setEqualizerEnabled(boolean enabled, Promise promise) {
        try {
            nativeSetEqualizerEnabled(enabled);
            promise.resolve("Equalizer " + (enabled ? "enabled" : "disabled"));
        } catch (Exception e) {
            promise.reject("EQ_CONFIG_ERROR", e.getMessage());
        }
    }

    /**
     * Configuration d'une bande d'equalizer
     */
    @ReactMethod
    public void setEqualizerBand(int band, double frequency, double gain, double q, Promise promise) {
        try {
            nativeSetEqualizerBand(band, (float)frequency, (float)gain, (float)q);
            promise.resolve("EQ band " + band + " configured");
        } catch (Exception e) {
            promise.reject("EQ_BAND_ERROR", e.getMessage());
        }
    }

    /**
     * Configuration de la réduction de bruit
     */
    @ReactMethod
    public void setNoiseReductionStrength(double strength, Promise promise) {
        try {
            nativeSetNoiseReductionStrength((float)strength);
            promise.resolve("Noise reduction strength set to " + strength);
        } catch (Exception e) {
            promise.reject("NR_CONFIG_ERROR", e.getMessage());
        }
    }

    /**
     * Obtient les métriques audio actuelles
     */
    @ReactMethod
    public void getMetrics(Promise promise) {
        try {
            WritableMap metrics = Arguments.createMap();

            metrics.putDouble("currentLevel", nativeGetCurrentLevel());
            metrics.putDouble("peakLevel", nativeGetPeakLevel());
            metrics.putBoolean("isClipping", nativeIsClipping());
            metrics.putDouble("latencyMs", nativeGetLatencyMs());

            // États du pipeline
            metrics.putBoolean("isRunning", isRunning);
            metrics.putBoolean("isPaused", isPaused);
            metrics.putBoolean("isRecording", isRecording);

            promise.resolve(metrics);
        } catch (Exception e) {
            promise.reject("METRICS_ERROR", e.getMessage());
        }
    }

    /**
     * Démarre l'enregistrement
     */
    @ReactMethod
    public void startRecording(String filename, Promise promise) {
        if (!isRunning) {
            promise.reject("NOT_RUNNING", "Pipeline must be running to record");
            return;
        }

        if (isRecording) {
            promise.reject("ALREADY_RECORDING", "Already recording");
            return;
        }

        try {
            boolean success = nativeStartRecording(filename);
            if (success) {
                isRecording = true;
                promise.resolve("Recording started: " + filename);
                emitRecordingStatus(true, filename);
            } else {
                promise.reject("RECORDING_START_FAILED", "Failed to start recording");
            }
        } catch (Exception e) {
            promise.reject("RECORDING_ERROR", e.getMessage());
        }
    }

    /**
     * Arrête l'enregistrement
     */
    @ReactMethod
    public void stopRecording(Promise promise) {
        if (!isRecording) {
            promise.reject("NOT_RECORDING", "Not currently recording");
            return;
        }

        try {
            boolean success = nativeStopRecording();
            if (success) {
                isRecording = false;
                promise.resolve("Recording stopped");
                emitRecordingStatus(false, null);
            } else {
                promise.reject("RECORDING_STOP_FAILED", "Failed to stop recording");
            }
        } catch (Exception e) {
            promise.reject("RECORDING_ERROR", e.getMessage());
        }
    }

    /**
     * Obtient l'état du pipeline
     */
    @ReactMethod
    public void getStatus(Promise promise) {
        try {
            WritableMap status = Arguments.createMap();
            status.putBoolean("initialized", isInitialized);
            status.putBoolean("running", isRunning);
            status.putBoolean("paused", isPaused);
            status.putBoolean("recording", isRecording);
            promise.resolve(status);
        } catch (Exception e) {
            promise.reject("STATUS_ERROR", e.getMessage());
        }
    }

    // Monitoring des niveaux audio
    private void startLevelMonitoring() {
        new Thread(() -> {
            while (isRunning && !isPaused) {
                try {
                    // Obtenir les niveaux toutes les 100ms
                    float currentLevel = nativeGetCurrentLevel();
                    float peakLevel = nativeGetPeakLevel();
                    boolean isClipping = nativeIsClipping();

                    // Convertir en dB pour affichage
                    double currentDb = 20.0 * Math.log10(Math.max(currentLevel, 1e-10));
                    double peakDb = 20.0 * Math.log10(Math.max(peakLevel, 1e-10));

                    // Émettre l'événement vers JS
                    WritableMap levels = Arguments.createMap();
                    levels.putDouble("currentLevel", currentDb);
                    levels.putDouble("peakLevel", peakDb);
                    levels.putBoolean("isClipping", isClipping);

                    emitEvent(EVENT_AUDIO_LEVELS, levels);

                    // Pause 100ms
                    Thread.sleep(100);

                } catch (InterruptedException e) {
                    Log.w(TAG, "Level monitoring interrupted", e);
                    break;
                } catch (Exception e) {
                    Log.e(TAG, "Error in level monitoring", e);
                    break;
                }
            }
        }).start();
    }

    // Émission d'événements vers React Native
    private void emitEvent(String eventName, WritableMap params) {
        ReactContext context = getReactApplicationContext();
        if (context != null && context.hasActiveCatalystInstance()) {
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                   .emit(eventName, params);
        }
    }

    private void emitRecordingStatus(boolean isRecording, String filename) {
        WritableMap status = Arguments.createMap();
        status.putBoolean("recording", isRecording);
        if (filename != null) {
            status.putString("filename", filename);
        }
        emitEvent(EVENT_RECORDING_STATUS, status);
    }

    // Méthodes natives JNI
    private native boolean nativeInitialize(int sampleRate, boolean enableEQ,
                                          boolean enableNoiseReduction, boolean enableEffects);
    private native boolean nativeStart();
    private native boolean nativeStop();
    private native boolean nativePause();
    private native boolean nativeResume();

    private native void nativeSetEqualizerEnabled(boolean enabled);
    private native void nativeSetEqualizerBand(int band, float frequency, float gain, float q);
    private native void nativeSetNoiseReductionStrength(float strength);

    private native float nativeGetCurrentLevel();
    private native float nativeGetPeakLevel();
    private native boolean nativeIsClipping();
    private native float nativeGetLatencyMs();

    private native boolean nativeStartRecording(String filename);
    private native boolean nativeStopRecording();
    private native boolean nativeIsRecording();

    private native boolean nativeIsRunning();
    private native boolean nativeIsPaused();

    // Chargement de la bibliothèque native
    static {
        try {
            System.loadLibrary("appmodules");
            Log.i(TAG, "Native library loaded successfully");
        } catch (UnsatisfiedLinkError e) {
            Log.e(TAG, "Failed to load native library", e);
        }
    }
}
