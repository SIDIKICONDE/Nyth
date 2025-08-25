package com.audiomodule.example;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.audiomodule.AudioPreset;
import com.audiomodule.AudioRecorder;
import com.audiomodule.AudioRecorderError;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Exemple d'utilisation du module AudioRecorder
 */
public class AudioRecorderExample extends AppCompatActivity implements AudioRecorder.AudioRecorderCallback {
    
    private static final String TAG = "AudioRecorderExample";
    private static final int PERMISSION_REQUEST_CODE = 100;
    
    private AudioRecorder audioRecorder;
    
    // UI Elements
    private Button recordButton;
    private Button pauseButton;
    private TextView statusText;
    private TextView filePathText;
    private ProgressBar levelMeter;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_audio_recorder);
        
        // Initialise l'AudioRecorder
        audioRecorder = new AudioRecorder(this);
        audioRecorder.setCallback(this);
        
        // Initialise l'UI
        setupUI();
        
        // Vérifie les permissions
        checkAndRequestPermissions();
    }
    
    private void setupUI() {
        recordButton = findViewById(R.id.recordButton);
        pauseButton = findViewById(R.id.pauseButton);
        statusText = findViewById(R.id.statusText);
        filePathText = findViewById(R.id.filePathText);
        levelMeter = findViewById(R.id.levelMeter);
        
        recordButton.setOnClickListener(v -> toggleRecording());
        pauseButton.setOnClickListener(v -> togglePause());
        
        pauseButton.setEnabled(false);
        updateStatus("Prêt à enregistrer");
    }
    
    private void toggleRecording() {
        if (audioRecorder.getState() == AudioRecorder.RecorderState.RECORDING ||
            audioRecorder.getState() == AudioRecorder.RecorderState.PAUSED) {
            // Arrêter l'enregistrement
            audioRecorder.stopRecording();
            recordButton.setText("Démarrer");
            pauseButton.setEnabled(false);
        } else {
            // Démarrer l'enregistrement
            startRecording();
        }
    }
    
    private void startRecording() {
        // Sélectionne un preset selon le choix de l'utilisateur
        // Pour cet exemple, on utilise VOICE_NOTE
        audioRecorder.usePreset(AudioPreset.VOICE_NOTE);
        
        // Ou configuration personnalisée :
        /*
        AudioConfiguration config = new AudioConfiguration();
        config.applyFormat(AudioFormatType.AAC);
        config.quality = AudioQuality.HIGH;
        config.sampleRate = 44100;
        config.channels = 1;
        audioRecorder.setAudioConfiguration(config);
        */
        
        // Démarre l'enregistrement
        audioRecorder.startRecording(null); // null = nom de fichier automatique
        
        recordButton.setText("Arrêter");
        pauseButton.setEnabled(true);
    }
    
    private void togglePause() {
        if (audioRecorder.getState() == AudioRecorder.RecorderState.PAUSED) {
            audioRecorder.resumeRecording();
            pauseButton.setText("Pause");
        } else if (audioRecorder.getState() == AudioRecorder.RecorderState.RECORDING) {
            audioRecorder.pauseRecording();
            pauseButton.setText("Reprendre");
        }
    }
    
    private void checkAndRequestPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    PERMISSION_REQUEST_CODE);
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                         @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                updateStatus("Permission accordée");
            } else {
                updateStatus("Permission refusée");
                recordButton.setEnabled(false);
            }
        }
    }
    
    // Callbacks AudioRecorder
    
    @Override
    public void onRecordingStarted() {
        updateStatus("Enregistrement en cours...");
        levelMeter.setVisibility(View.VISIBLE);
    }
    
    @Override
    public void onRecordingStopped(String filePath, long duration) {
        updateStatus("Enregistrement terminé");
        filePathText.setText("Fichier: " + new File(filePath).getName() + 
                           "\nDurée: " + formatDuration(duration));
        levelMeter.setVisibility(View.GONE);
        levelMeter.setProgress(0);
    }
    
    @Override
    public void onRecordingPaused() {
        updateStatus("Enregistrement en pause");
    }
    
    @Override
    public void onRecordingResumed() {
        updateStatus("Enregistrement repris");
    }
    
    @Override
    public void onAudioLevel(float level) {
        // Convertit le niveau en dB (-160 à 0) en pourcentage (0 à 100)
        int progress = (int) ((level + 160) / 160 * 100);
        levelMeter.setProgress(Math.max(0, Math.min(100, progress)));
    }
    
    @Override
    public void onError(AudioRecorderError error) {
        updateStatus("Erreur: " + error.getMessage());
        Toast.makeText(this, error.getMessage(), Toast.LENGTH_LONG).show();
        
        // Réinitialise l'UI
        recordButton.setText("Démarrer");
        recordButton.setEnabled(true);
        pauseButton.setEnabled(false);
        levelMeter.setVisibility(View.GONE);
    }
    
    // Utilitaires
    
    private void updateStatus(String status) {
        runOnUiThread(() -> statusText.setText(status));
    }
    
    private String formatDuration(long milliseconds) {
        long seconds = milliseconds / 1000;
        long minutes = seconds / 60;
        seconds = seconds % 60;
        return String.format(Locale.US, "%d:%02d", minutes, seconds);
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (audioRecorder != null) {
            audioRecorder.release();
        }
    }
}

/**
 * Exemple d'intégration dans une Activity simple
 */
class SimpleAudioRecorderUsage {
    
    private AudioRecorder recorder;
    
    public void example(Context context) {
        // Créer l'instance
        recorder = new AudioRecorder(context);
        
        // Configuration simple avec preset
        recorder.usePreset(AudioPreset.VOICE_NOTE);
        
        // Ou configuration personnalisée
        AudioConfiguration config = new AudioConfiguration();
        config.applyFormat(AudioFormatType.AAC);
        config.quality = AudioQuality.HIGH;
        config.sampleRate = 44100;
        config.channels = 2;
        config.bitRate = 192000;
        recorder.setAudioConfiguration(config);
        
        // Définir le callback
        recorder.setCallback(new AudioRecorder.AudioRecorderCallback() {
            @Override
            public void onRecordingStarted() {
                Log.d("Audio", "Enregistrement démarré");
            }
            
            @Override
            public void onRecordingStopped(String filePath, long duration) {
                Log.d("Audio", "Enregistrement terminé: " + filePath);
                Log.d("Audio", "Durée: " + duration + "ms");
            }
            
            @Override
            public void onRecordingPaused() {
                Log.d("Audio", "En pause");
            }
            
            @Override
            public void onRecordingResumed() {
                Log.d("Audio", "Repris");
            }
            
            @Override
            public void onAudioLevel(float level) {
                // Niveau audio en dB
            }
            
            @Override
            public void onError(AudioRecorderError error) {
                Log.e("Audio", "Erreur: " + error.getMessage());
            }
        });
        
        // Démarrer l'enregistrement
        File outputFile = new File(context.getExternalFilesDir(null), "test.m4a");
        recorder.startRecording(outputFile);
        
        // Plus tard...
        recorder.pauseRecording();
        recorder.resumeRecording();
        recorder.stopRecording();
        
        // Libérer les ressources
        recorder.release();
    }
}