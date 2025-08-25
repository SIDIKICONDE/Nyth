package com.audiomodule;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * AudioRecorder - Module natif Android pour la capture audio
 * Conçu pour être intégré dans un TurboModule JSI React Native
 */
public class AudioRecorder {
    private static final String TAG = "AudioRecorder";
    
    // États de l'enregistreur
    public enum RecorderState {
        IDLE,
        INITIALIZED,
        RECORDING,
        PAUSED,
        STOPPED,
        ERROR
    }
    
    // Configuration audio par défaut
    private static final int DEFAULT_SAMPLE_RATE = 44100;
    private static final int DEFAULT_CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int DEFAULT_AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;
    
    // Membres
    private final Context context;
    private MediaRecorder mediaRecorder;
    private AudioRecord audioRecord;
    private RecorderState currentState = RecorderState.IDLE;
    private AudioConfiguration audioConfig;
    private File currentRecordingFile;
    private final Handler mainHandler;
    private final ExecutorService executorService;
    private final AtomicBoolean isRecording = new AtomicBoolean(false);
    
    // Callbacks
    private AudioRecorderCallback callback;
    
    // Monitoring du niveau audio
    private AudioLevelMonitor audioLevelMonitor;
    private final AtomicBoolean isMonitoringLevel = new AtomicBoolean(false);
    
    /**
     * Interface de callback pour les événements de l'enregistreur
     */
    public interface AudioRecorderCallback {
        void onRecordingStarted();
        void onRecordingStopped(String filePath, long duration);
        void onRecordingPaused();
        void onRecordingResumed();
        void onAudioLevel(float level);
        void onError(AudioRecorderError error);
    }
    
    /**
     * Constructeur
     * @param context Context Android
     */
    public AudioRecorder(@NonNull Context context) {
        this.context = context.getApplicationContext();
        this.mainHandler = new Handler(Looper.getMainLooper());
        this.executorService = Executors.newSingleThreadExecutor();
        this.audioConfig = AudioConfiguration.getDefault();
        this.audioLevelMonitor = new AudioLevelMonitor();
    }
    
    /**
     * Configure le callback pour les événements
     */
    public void setCallback(@Nullable AudioRecorderCallback callback) {
        this.callback = callback;
    }
    
    /**
     * Configure les paramètres audio
     */
    public void setAudioConfiguration(@NonNull AudioConfiguration config) {
        if (currentState != RecorderState.IDLE) {
            notifyError(AudioRecorderError.INVALID_STATE);
            return;
        }
        this.audioConfig = config;
    }
    
    /**
     * Utilise un preset de configuration prédéfini
     */
    public void usePreset(@NonNull AudioPreset preset) {
        setAudioConfiguration(AudioConfiguration.fromPreset(preset));
    }
    
    /**
     * Vérifie si l'appareil a la permission d'enregistrer
     */
    public boolean hasRecordPermission() {
        return ActivityCompat.checkSelfPermission(context, 
            Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }
    
    /**
     * Démarre l'enregistrement
     * @param outputFile Fichier de sortie (null pour utiliser un nom par défaut)
     */
    public void startRecording(@Nullable File outputFile) {
        if (!hasRecordPermission()) {
            notifyError(AudioRecorderError.PERMISSION_DENIED);
            return;
        }
        
        if (currentState == RecorderState.RECORDING) {
            notifyError(AudioRecorderError.ALREADY_RECORDING);
            return;
        }
        
        executorService.execute(() -> {
            try {
                // Prépare le fichier de sortie
                currentRecordingFile = outputFile != null ? outputFile : generateDefaultFile();
                
                // Configure et démarre l'enregistrement selon le mode
                if (audioConfig.useMediaRecorder) {
                    startMediaRecorder();
                } else {
                    startAudioRecord();
                }
                
                currentState = RecorderState.RECORDING;
                isRecording.set(true);
                
                // Démarre le monitoring du niveau audio si nécessaire
                if (audioConfig.enableLevelMonitoring) {
                    startAudioLevelMonitoring();
                }
                
                notifyRecordingStarted();
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to start recording", e);
                currentState = RecorderState.ERROR;
                notifyError(AudioRecorderError.START_FAILED);
            }
        });
    }
    
    /**
     * Arrête l'enregistrement
     */
    public void stopRecording() {
        if (currentState != RecorderState.RECORDING && currentState != RecorderState.PAUSED) {
            notifyError(AudioRecorderError.NOT_RECORDING);
            return;
        }
        
        executorService.execute(() -> {
            try {
                isRecording.set(false);
                stopAudioLevelMonitoring();
                
                long duration = 0;
                
                if (mediaRecorder != null) {
                    mediaRecorder.stop();
                    mediaRecorder.release();
                    mediaRecorder = null;
                } else if (audioRecord != null) {
                    audioRecord.stop();
                    audioRecord.release();
                    audioRecord = null;
                }
                
                currentState = RecorderState.STOPPED;
                
                // Calcule la durée si possible
                if (currentRecordingFile != null && currentRecordingFile.exists()) {
                    duration = AudioUtils.getAudioDuration(currentRecordingFile);
                }
                
                final String filePath = currentRecordingFile != null ? 
                    currentRecordingFile.getAbsolutePath() : "";
                final long finalDuration = duration;
                
                mainHandler.post(() -> {
                    if (callback != null) {
                        callback.onRecordingStopped(filePath, finalDuration);
                    }
                });
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to stop recording", e);
                notifyError(AudioRecorderError.STOP_FAILED);
            }
        });
    }
    
    /**
     * Met en pause l'enregistrement (Android N+)
     */
    public void pauseRecording() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            notifyError(AudioRecorderError.PAUSE_NOT_SUPPORTED);
            return;
        }
        
        if (currentState != RecorderState.RECORDING) {
            notifyError(AudioRecorderError.NOT_RECORDING);
            return;
        }
        
        executorService.execute(() -> {
            try {
                if (mediaRecorder != null) {
                    mediaRecorder.pause();
                    currentState = RecorderState.PAUSED;
                    stopAudioLevelMonitoring();
                    notifyRecordingPaused();
                } else {
                    // AudioRecord ne supporte pas la pause native
                    notifyError(AudioRecorderError.PAUSE_NOT_SUPPORTED);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to pause recording", e);
                notifyError(AudioRecorderError.PAUSE_FAILED);
            }
        });
    }
    
    /**
     * Reprend l'enregistrement après une pause
     */
    public void resumeRecording() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            notifyError(AudioRecorderError.RESUME_NOT_SUPPORTED);
            return;
        }
        
        if (currentState != RecorderState.PAUSED) {
            notifyError(AudioRecorderError.NOT_PAUSED);
            return;
        }
        
        executorService.execute(() -> {
            try {
                if (mediaRecorder != null) {
                    mediaRecorder.resume();
                    currentState = RecorderState.RECORDING;
                    
                    if (audioConfig.enableLevelMonitoring) {
                        startAudioLevelMonitoring();
                    }
                    
                    notifyRecordingResumed();
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to resume recording", e);
                notifyError(AudioRecorderError.RESUME_FAILED);
            }
        });
    }
    
    /**
     * Obtient l'état actuel de l'enregistreur
     */
    public RecorderState getState() {
        return currentState;
    }
    
    /**
     * Obtient le chemin du fichier en cours d'enregistrement
     */
    @Nullable
    public String getCurrentRecordingPath() {
        return currentRecordingFile != null ? currentRecordingFile.getAbsolutePath() : null;
    }
    
    /**
     * Libère les ressources
     */
    public void release() {
        if (isRecording.get()) {
            stopRecording();
        }
        
        executorService.shutdown();
        
        if (mediaRecorder != null) {
            mediaRecorder.release();
            mediaRecorder = null;
        }
        
        if (audioRecord != null) {
            audioRecord.release();
            audioRecord = null;
        }
    }
    
    // Méthodes privées
    
    private void startMediaRecorder() throws IOException {
        mediaRecorder = new MediaRecorder();
        
        // Configure la source audio
        mediaRecorder.setAudioSource(audioConfig.audioSource);
        
        // Configure le format de sortie
        mediaRecorder.setOutputFormat(audioConfig.outputFormat);
        
        // Configure l'encodeur
        mediaRecorder.setAudioEncoder(audioConfig.audioEncoder);
        
        // Configure les paramètres audio
        mediaRecorder.setAudioSamplingRate(audioConfig.sampleRate);
        mediaRecorder.setAudioChannels(audioConfig.channels);
        mediaRecorder.setAudioEncodingBitRate(audioConfig.bitRate);
        
        // Configure le fichier de sortie
        mediaRecorder.setOutputFile(currentRecordingFile.getAbsolutePath());
        
        // Prépare et démarre
        mediaRecorder.prepare();
        mediaRecorder.start();
    }
    
    private void startAudioRecord() {
        // Calcule la taille du buffer
        int bufferSize = AudioRecord.getMinBufferSize(
            audioConfig.sampleRate,
            audioConfig.channelConfig,
            audioConfig.audioFormat
        );
        
        if (bufferSize == AudioRecord.ERROR || bufferSize == AudioRecord.ERROR_BAD_VALUE) {
            throw new IllegalStateException("Invalid buffer size");
        }
        
        // Augmente la taille du buffer pour plus de stabilité
        bufferSize *= 2;
        
        // Crée l'instance AudioRecord
        audioRecord = new AudioRecord(
            audioConfig.audioSource,
            audioConfig.sampleRate,
            audioConfig.channelConfig,
            audioConfig.audioFormat,
            bufferSize
        );
        
        if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
            throw new IllegalStateException("AudioRecord initialization failed");
        }
        
        // Démarre l'enregistrement dans un thread séparé
        audioRecord.startRecording();
        
        // Lance le thread d'écriture
        executorService.execute(new AudioRecordWriteTask(audioRecord, currentRecordingFile, bufferSize));
    }
    
    private void startAudioLevelMonitoring() {
        if (isMonitoringLevel.compareAndSet(false, true)) {
            audioLevelMonitor.start();
        }
    }
    
    private void stopAudioLevelMonitoring() {
        if (isMonitoringLevel.compareAndSet(true, false)) {
            audioLevelMonitor.stop();
        }
    }
    
    private File generateDefaultFile() {
        File recordingsDir = new File(context.getExternalFilesDir(null), "Recordings");
        if (!recordingsDir.exists()) {
            recordingsDir.mkdirs();
        }
        
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd-HH-mm-ss", Locale.US);
        String fileName = "recording-" + formatter.format(new Date()) + 
            audioConfig.getFileExtension();
        
        return new File(recordingsDir, fileName);
    }
    
    // Notifications
    
    private void notifyRecordingStarted() {
        mainHandler.post(() -> {
            if (callback != null) {
                callback.onRecordingStarted();
            }
        });
    }
    
    private void notifyRecordingPaused() {
        mainHandler.post(() -> {
            if (callback != null) {
                callback.onRecordingPaused();
            }
        });
    }
    
    private void notifyRecordingResumed() {
        mainHandler.post(() -> {
            if (callback != null) {
                callback.onRecordingResumed();
            }
        });
    }
    
    private void notifyAudioLevel(float level) {
        mainHandler.post(() -> {
            if (callback != null) {
                callback.onAudioLevel(level);
            }
        });
    }
    
    private void notifyError(AudioRecorderError error) {
        mainHandler.post(() -> {
            if (callback != null) {
                callback.onError(error);
            }
        });
    }
    
    /**
     * Classe interne pour le monitoring du niveau audio
     */
    private class AudioLevelMonitor {
        private static final int MONITORING_INTERVAL_MS = 100;
        private final Handler handler = new Handler(Looper.getMainLooper());
        private final Runnable monitoringTask = new Runnable() {
            @Override
            public void run() {
                if (isMonitoringLevel.get() && mediaRecorder != null) {
                    try {
                        int amplitude = mediaRecorder.getMaxAmplitude();
                        if (amplitude > 0) {
                            // Convertit en décibels
                            float db = 20 * (float) Math.log10(amplitude / 32768.0);
                            notifyAudioLevel(db);
                        }
                    } catch (Exception e) {
                        Log.w(TAG, "Error getting audio level", e);
                    }
                    
                    handler.postDelayed(this, MONITORING_INTERVAL_MS);
                }
            }
        };
        
        void start() {
            handler.post(monitoringTask);
        }
        
        void stop() {
            handler.removeCallbacks(monitoringTask);
        }
    }
    
    /**
     * Tâche d'écriture pour AudioRecord
     */
    private class AudioRecordWriteTask implements Runnable {
        private final AudioRecord recorder;
        private final File outputFile;
        private final int bufferSize;
        
        AudioRecordWriteTask(AudioRecord recorder, File outputFile, int bufferSize) {
            this.recorder = recorder;
            this.outputFile = outputFile;
            this.bufferSize = bufferSize;
        }
        
        @Override
        public void run() {
            FileOutputStream outputStream = null;
            byte[] buffer = new byte[bufferSize];
            
            try {
                outputStream = new FileOutputStream(outputFile);
                
                // Écrit l'en-tête WAV si nécessaire
                if (audioConfig.outputFormat == MediaRecorder.OutputFormat.DEFAULT) {
                    AudioUtils.writeWavHeader(outputStream, audioConfig);
                }
                
                while (isRecording.get()) {
                    int read = recorder.read(buffer, 0, bufferSize);
                    if (read > 0) {
                        outputStream.write(buffer, 0, read);
                        
                        // Calcule le niveau audio si nécessaire
                        if (audioConfig.enableLevelMonitoring && isMonitoringLevel.get()) {
                            float level = AudioUtils.calculateAudioLevel(buffer, read);
                            notifyAudioLevel(level);
                        }
                    }
                }
                
                // Met à jour l'en-tête WAV avec la taille finale
                if (audioConfig.outputFormat == MediaRecorder.OutputFormat.DEFAULT) {
                    AudioUtils.updateWavHeader(outputFile);
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Error writing audio data", e);
                notifyError(AudioRecorderError.WRITE_FAILED);
            } finally {
                if (outputStream != null) {
                    try {
                        outputStream.close();
                    } catch (IOException e) {
                        Log.w(TAG, "Error closing output stream", e);
                    }
                }
            }
        }
    }
}