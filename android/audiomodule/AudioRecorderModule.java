package com.audiomodule;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

/**
 * Module React Native pour l'enregistrement audio
 * Conçu pour être compatible avec TurboModule JSI
 */
@ReactModule(name = AudioRecorderModule.MODULE_NAME)
public class AudioRecorderModule extends ReactContextBaseJavaModule implements AudioRecorder.AudioRecorderCallback {
    
    public static final String MODULE_NAME = "AudioRecorderModule";
    private static final String TAG = "AudioRecorderModule";
    private static final int RECORD_AUDIO_REQUEST_CODE = 101;
    
    private final ReactApplicationContext reactContext;
    private AudioRecorder audioRecorder;
    private Promise permissionPromise;
    
    // Events
    private static final String EVENT_RECORDING_STARTED = "recordingStarted";
    private static final String EVENT_RECORDING_STOPPED = "recordingStopped";
    private static final String EVENT_RECORDING_PAUSED = "recordingPaused";
    private static final String EVENT_RECORDING_RESUMED = "recordingResumed";
    private static final String EVENT_AUDIO_LEVEL = "audioLevel";
    private static final String EVENT_ERROR = "error";
    
    public AudioRecorderModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.audioRecorder = new AudioRecorder(reactContext);
        this.audioRecorder.setCallback(this);
    }
    
    @Override
    @NonNull
    public String getName() {
        return MODULE_NAME;
    }
    
    /**
     * Démarre l'enregistrement avec options
     */
    @ReactMethod
    public void startRecording(ReadableMap options, Promise promise) {
        // Vérifie les permissions
        if (!audioRecorder.hasRecordPermission()) {
            requestRecordPermission(new Promise() {
                @Override
                public void resolve(@Nullable Object value) {
                    Boolean granted = (Boolean) value;
                    if (granted) {
                        performStartRecording(options, promise);
                    } else {
                        promise.reject("PERMISSION_DENIED", "Microphone permission denied");
                    }
                }
                
                @Override
                public void reject(String code, String message) {
                    promise.reject(code, message);
                }
                
                @Override
                public void reject(String code, Throwable throwable) {
                    promise.reject(code, throwable);
                }
                
                @Override
                public void reject(String code, String message, Throwable throwable) {
                    promise.reject(code, message, throwable);
                }
                
                @Override
                public void reject(Throwable throwable) {
                    promise.reject(throwable);
                }
            });
            return;
        }
        
        performStartRecording(options, promise);
    }
    
    private void performStartRecording(ReadableMap options, Promise promise) {
        try {
            // Parse les options
            String fileName = options.hasKey("fileName") ? options.getString("fileName") : null;
            String format = options.hasKey("format") ? options.getString("format") : "aac";
            String quality = options.hasKey("quality") ? options.getString("quality") : "high";
            String preset = options.hasKey("preset") ? options.getString("preset") : null;
            int sampleRate = options.hasKey("sampleRate") ? options.getInt("sampleRate") : 44100;
            int channels = options.hasKey("channels") ? options.getInt("channels") : 1;
            
            // Configure selon le preset ou les options
            if (preset != null) {
                AudioPreset audioPreset = parsePreset(preset);
                audioRecorder.usePreset(audioPreset);
            } else {
                AudioConfiguration config = new AudioConfiguration();
                config.applyFormat(parseFormat(format));
                config.quality = parseQuality(quality);
                config.sampleRate = sampleRate;
                config.channels = channels;
                
                // Calcule le bitrate selon la qualité
                config.bitRate = calculateBitRate(config.quality, config.audioEncoder);
                
                audioRecorder.setAudioConfiguration(config);
            }
            
            // Prépare le fichier de sortie
            File outputFile = null;
            if (fileName != null) {
                File recordingsDir = new File(reactContext.getExternalFilesDir(null), "Recordings");
                if (!recordingsDir.exists()) {
                    recordingsDir.mkdirs();
                }
                outputFile = new File(recordingsDir, fileName);
            }
            
            // Démarre l'enregistrement
            audioRecorder.startRecording(outputFile);
            
            // Retourne le résultat
            WritableMap result = Arguments.createMap();
            result.putString("status", "started");
            result.putString("filePath", audioRecorder.getCurrentRecordingPath());
            result.putString("format", audioRecorder.getAudioConfiguration().getDescription());
            result.putDouble("estimatedSizePerMinute", 
                audioRecorder.getAudioConfiguration().getEstimatedSizePerMinute());
            
            promise.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to start recording", e);
            promise.reject("START_FAILED", e.getMessage(), e);
        }
    }
    
    /**
     * Arrête l'enregistrement
     */
    @ReactMethod
    public void stopRecording(Promise promise) {
        if (audioRecorder.getState() != AudioRecorder.RecorderState.RECORDING && 
            audioRecorder.getState() != AudioRecorder.RecorderState.PAUSED) {
            promise.reject("NOT_RECORDING", "Not currently recording");
            return;
        }
        
        // Sauvegarde le chemin avant l'arrêt
        String filePath = audioRecorder.getCurrentRecordingPath();
        
        // Promise sera résolue dans le callback onRecordingStopped
        this.stopPromise = promise;
        audioRecorder.stopRecording();
    }
    
    private Promise stopPromise;
    
    /**
     * Met en pause l'enregistrement
     */
    @ReactMethod
    public void pauseRecording(Promise promise) {
        try {
            audioRecorder.pauseRecording();
            promise.resolve(createStatusMap("paused"));
        } catch (Exception e) {
            promise.reject("PAUSE_FAILED", e.getMessage(), e);
        }
    }
    
    /**
     * Reprend l'enregistrement
     */
    @ReactMethod
    public void resumeRecording(Promise promise) {
        try {
            audioRecorder.resumeRecording();
            promise.resolve(createStatusMap("resumed"));
        } catch (Exception e) {
            promise.reject("RESUME_FAILED", e.getMessage(), e);
        }
    }
    
    /**
     * Obtient le statut de l'enregistrement
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    public WritableMap getRecordingStatus() {
        WritableMap status = Arguments.createMap();
        status.putBoolean("isRecording", 
            audioRecorder.getState() == AudioRecorder.RecorderState.RECORDING);
        status.putBoolean("isPaused", 
            audioRecorder.getState() == AudioRecorder.RecorderState.PAUSED);
        status.putString("currentFilePath", audioRecorder.getCurrentRecordingPath());
        return status;
    }
    
    /**
     * Configure les options audio
     */
    @ReactMethod
    public void configureAudioOptions(ReadableMap options, Promise promise) {
        try {
            AudioConfiguration config = new AudioConfiguration();
            
            if (options.hasKey("format")) {
                config.applyFormat(parseFormat(options.getString("format")));
            }
            if (options.hasKey("quality")) {
                config.quality = parseQuality(options.getString("quality"));
            }
            if (options.hasKey("sampleRate")) {
                config.sampleRate = options.getInt("sampleRate");
            }
            if (options.hasKey("channels")) {
                config.channels = options.getInt("channels");
            }
            if (options.hasKey("bitRate")) {
                config.bitRate = options.getInt("bitRate");
            }
            
            audioRecorder.setAudioConfiguration(config);
            promise.resolve(createStatusMap("configured"));
            
        } catch (Exception e) {
            promise.reject("CONFIGURATION_FAILED", e.getMessage(), e);
        }
    }
    
    /**
     * Obtient les formats supportés
     */
    @ReactMethod
    public void getSupportedFormats(Promise promise) {
        WritableArray formats = Arguments.createArray();
        
        for (AudioFormatType format : AudioUtils.getSupportedFormats()) {
            WritableMap formatInfo = Arguments.createMap();
            formatInfo.putString("format", format.name());
            formatInfo.putString("name", getFormatDisplayName(format));
            formatInfo.putBoolean("isSupported", AudioUtils.isFormatSupported(format));
            formats.pushMap(formatInfo);
        }
        
        promise.resolve(formats);
    }
    
    /**
     * Demande la permission d'enregistrer
     */
    @ReactMethod
    public void requestRecordPermission(Promise promise) {
        Context context = getReactApplicationContext();
        Activity activity = getCurrentActivity();
        
        if (ContextCompat.checkSelfPermission(context, 
            Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            promise.resolve(true);
            return;
        }
        
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }
        
        this.permissionPromise = promise;
        
        if (activity instanceof PermissionAwareActivity) {
            ((PermissionAwareActivity) activity).requestPermissions(
                new String[]{Manifest.permission.RECORD_AUDIO},
                RECORD_AUDIO_REQUEST_CODE,
                new PermissionListener() {
                    @Override
                    public boolean onRequestPermissionsResult(int requestCode, 
                                                            String[] permissions, 
                                                            int[] grantResults) {
                        if (requestCode == RECORD_AUDIO_REQUEST_CODE) {
                            boolean granted = grantResults.length > 0 && 
                                grantResults[0] == PackageManager.PERMISSION_GRANTED;
                            if (permissionPromise != null) {
                                permissionPromise.resolve(granted);
                                permissionPromise = null;
                            }
                            return true;
                        }
                        return false;
                    }
                }
            );
        } else {
            ActivityCompat.requestPermissions(activity,
                new String[]{Manifest.permission.RECORD_AUDIO},
                RECORD_AUDIO_REQUEST_CODE);
        }
    }
    
    // Callbacks AudioRecorder
    
    @Override
    public void onRecordingStarted() {
        sendEvent(EVENT_RECORDING_STARTED, null);
    }
    
    @Override
    public void onRecordingStopped(String filePath, long duration) {
        WritableMap params = Arguments.createMap();
        params.putString("filePath", filePath);
        params.putDouble("duration", duration / 1000.0); // Convertir en secondes
        sendEvent(EVENT_RECORDING_STOPPED, params);
        
        // Résout la promise de stopRecording si elle existe
        if (stopPromise != null) {
            WritableMap result = Arguments.createMap();
            result.putString("status", "stopped");
            result.putString("filePath", filePath);
            result.putDouble("duration", duration / 1000.0);
            stopPromise.resolve(result);
            stopPromise = null;
        }
    }
    
    @Override
    public void onRecordingPaused() {
        sendEvent(EVENT_RECORDING_PAUSED, null);
    }
    
    @Override
    public void onRecordingResumed() {
        sendEvent(EVENT_RECORDING_RESUMED, null);
    }
    
    @Override
    public void onAudioLevel(float level) {
        WritableMap params = Arguments.createMap();
        params.putDouble("level", level);
        sendEvent(EVENT_AUDIO_LEVEL, params);
    }
    
    @Override
    public void onError(AudioRecorderError error) {
        WritableMap params = Arguments.createMap();
        params.putInt("code", error.getCode());
        params.putString("message", error.getMessage());
        sendEvent(EVENT_ERROR, params);
    }
    
    // Méthodes utilitaires
    
    private void sendEvent(String eventName, @Nullable WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
    
    private WritableMap createStatusMap(String status) {
        WritableMap map = Arguments.createMap();
        map.putString("status", status);
        return map;
    }
    
    private AudioFormatType parseFormat(String format) {
        try {
            return AudioFormatType.valueOf(format.toUpperCase().replace("-", "_"));
        } catch (Exception e) {
            return AudioFormatType.AAC; // Par défaut
        }
    }
    
    private AudioQuality parseQuality(String quality) {
        try {
            return AudioQuality.valueOf(quality.toUpperCase());
        } catch (Exception e) {
            return AudioQuality.HIGH; // Par défaut
        }
    }
    
    private AudioPreset parsePreset(String preset) {
        try {
            return AudioPreset.valueOf(preset.toUpperCase().replace("_", ""));
        } catch (Exception e) {
            return AudioPreset.VOICE_NOTE; // Par défaut
        }
    }
    
    private int calculateBitRate(AudioQuality quality, int encoder) {
        // Bitrates recommandés selon le format et la qualité
        if (encoder == android.media.MediaRecorder.AudioEncoder.AAC ||
            encoder == android.media.MediaRecorder.AudioEncoder.AAC_ELD ||
            encoder == android.media.MediaRecorder.AudioEncoder.HE_AAC) {
            switch (quality) {
                case LOW: return 64000;
                case MEDIUM: return 128000;
                case HIGH: return 192000;
                case MAXIMUM: return 256000;
            }
        }
        return 128000; // Par défaut
    }
    
    private String getFormatDisplayName(AudioFormatType format) {
        switch (format) {
            case AAC: return "AAC (Advanced Audio Coding)";
            case AAC_ELD: return "AAC-ELD (Enhanced Low Delay)";
            case HE_AAC: return "HE-AAC (High Efficiency)";
            case AMR_NB: return "AMR Narrowband";
            case AMR_WB: return "AMR Wideband";
            case OPUS: return "Opus";
            case VORBIS: return "Vorbis";
            case PCM_16BIT: return "PCM 16-bit";
            case PCM_8BIT: return "PCM 8-bit";
            case PCM_FLOAT: return "PCM Float";
            default: return format.name();
        }
    }
    
    // Constants export
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        
        // Export formats
        WritableMap formats = Arguments.createMap();
        for (AudioFormatType format : AudioFormatType.values()) {
            formats.putBoolean(format.name(), AudioUtils.isFormatSupported(format));
        }
        constants.put("FORMATS", formats);
        
        // Export presets
        WritableArray presets = Arguments.createArray();
        for (AudioPreset preset : AudioPreset.values()) {
            presets.pushString(preset.name());
        }
        constants.put("PRESETS", presets);
        
        return constants;
    }
}