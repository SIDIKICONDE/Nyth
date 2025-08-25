package com.audiomodule;

import android.media.AudioFormat;
import android.media.MediaRecorder;
import android.os.Build;

import androidx.annotation.NonNull;

/**
 * Configuration audio pour l'enregistrement
 */
public class AudioConfiguration {
    
    // Source audio
    public int audioSource = MediaRecorder.AudioSource.MIC;
    
    // Format de sortie
    public int outputFormat = MediaRecorder.OutputFormat.MPEG_4;
    
    // Encodeur audio
    public int audioEncoder = MediaRecorder.AudioEncoder.AAC;
    
    // Paramètres audio
    public int sampleRate = 44100;
    public int channels = 1;
    public int bitRate = 128000;
    
    // Pour AudioRecord (PCM)
    public int channelConfig = AudioFormat.CHANNEL_IN_MONO;
    public int audioFormat = AudioFormat.ENCODING_PCM_16BIT;
    
    // Options
    public boolean useMediaRecorder = true;
    public boolean enableLevelMonitoring = true;
    
    // Qualité
    public AudioQuality quality = AudioQuality.HIGH;
    
    /**
     * Constructeur par défaut
     */
    public AudioConfiguration() {
    }
    
    /**
     * Constructeur avec format
     */
    public AudioConfiguration(@NonNull AudioFormatType format, @NonNull AudioQuality quality) {
        this.quality = quality;
        applyFormat(format);
    }
    
    /**
     * Obtient la configuration par défaut
     */
    public static AudioConfiguration getDefault() {
        return new AudioConfiguration();
    }
    
    /**
     * Crée une configuration à partir d'un preset
     */
    public static AudioConfiguration fromPreset(@NonNull AudioPreset preset) {
        AudioConfiguration config = new AudioConfiguration();
        
        switch (preset) {
            case VOICE_NOTE:
                config.applyFormat(AudioFormatType.AAC);
                config.quality = AudioQuality.MEDIUM;
                config.sampleRate = 44100;
                config.channels = 1;
                config.bitRate = 96000;
                break;
                
            case VOICE_CALL:
                config.applyFormat(AudioFormatType.AMR_NB);
                config.quality = AudioQuality.LOW;
                config.sampleRate = 8000;
                config.channels = 1;
                break;
                
            case MUSIC_HIGH:
                config.applyFormat(AudioFormatType.AAC);
                config.quality = AudioQuality.MAXIMUM;
                config.sampleRate = 48000;
                config.channels = 2;
                config.bitRate = 256000;
                break;
                
            case MUSIC_STANDARD:
                config.applyFormat(AudioFormatType.AAC);
                config.quality = AudioQuality.HIGH;
                config.sampleRate = 44100;
                config.channels = 2;
                config.bitRate = 192000;
                break;
                
            case PROFESSIONAL:
                config.applyFormat(AudioFormatType.PCM_16BIT);
                config.quality = AudioQuality.MAXIMUM;
                config.sampleRate = 48000;
                config.channels = 2;
                config.useMediaRecorder = false;
                break;
                
            case COMPACT:
                config.applyFormat(AudioFormatType.AAC);
                config.quality = AudioQuality.LOW;
                config.sampleRate = 22050;
                config.channels = 1;
                config.bitRate = 64000;
                break;
                
            case STREAMING:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    config.applyFormat(AudioFormatType.OPUS);
                } else {
                    config.applyFormat(AudioFormatType.AAC);
                }
                config.quality = AudioQuality.HIGH;
                config.sampleRate = 48000;
                config.channels = 2;
                config.bitRate = 128000;
                break;
        }
        
        return config;
    }
    
    /**
     * Applique un format audio
     */
    private void applyFormat(@NonNull AudioFormatType format) {
        switch (format) {
            case AAC:
                outputFormat = MediaRecorder.OutputFormat.MPEG_4;
                audioEncoder = MediaRecorder.AudioEncoder.AAC;
                useMediaRecorder = true;
                break;
                
            case AAC_ELD:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
                    outputFormat = MediaRecorder.OutputFormat.MPEG_4;
                    audioEncoder = MediaRecorder.AudioEncoder.AAC_ELD;
                } else {
                    // Fallback to AAC
                    audioEncoder = MediaRecorder.AudioEncoder.AAC;
                }
                useMediaRecorder = true;
                break;
                
            case HE_AAC:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
                    outputFormat = MediaRecorder.OutputFormat.MPEG_4;
                    audioEncoder = MediaRecorder.AudioEncoder.HE_AAC;
                } else {
                    audioEncoder = MediaRecorder.AudioEncoder.AAC;
                }
                useMediaRecorder = true;
                break;
                
            case AMR_NB:
                outputFormat = MediaRecorder.OutputFormat.THREE_GPP;
                audioEncoder = MediaRecorder.AudioEncoder.AMR_NB;
                sampleRate = 8000;
                channels = 1;
                useMediaRecorder = true;
                break;
                
            case AMR_WB:
                outputFormat = MediaRecorder.OutputFormat.THREE_GPP;
                audioEncoder = MediaRecorder.AudioEncoder.AMR_WB;
                sampleRate = 16000;
                channels = 1;
                useMediaRecorder = true;
                break;
                
            case OPUS:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    outputFormat = MediaRecorder.OutputFormat.OGG;
                    audioEncoder = MediaRecorder.AudioEncoder.OPUS;
                } else {
                    // Fallback to AAC
                    outputFormat = MediaRecorder.OutputFormat.MPEG_4;
                    audioEncoder = MediaRecorder.AudioEncoder.AAC;
                }
                useMediaRecorder = true;
                break;
                
            case VORBIS:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    outputFormat = MediaRecorder.OutputFormat.WEBM;
                    audioEncoder = MediaRecorder.AudioEncoder.VORBIS;
                } else {
                    // Fallback to AAC
                    outputFormat = MediaRecorder.OutputFormat.MPEG_4;
                    audioEncoder = MediaRecorder.AudioEncoder.AAC;
                }
                useMediaRecorder = true;
                break;
                
            case PCM_16BIT:
                outputFormat = MediaRecorder.OutputFormat.DEFAULT;
                audioFormat = AudioFormat.ENCODING_PCM_16BIT;
                useMediaRecorder = false;
                break;
                
            case PCM_8BIT:
                outputFormat = MediaRecorder.OutputFormat.DEFAULT;
                audioFormat = AudioFormat.ENCODING_PCM_8BIT;
                useMediaRecorder = false;
                break;
                
            case PCM_FLOAT:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    outputFormat = MediaRecorder.OutputFormat.DEFAULT;
                    audioFormat = AudioFormat.ENCODING_PCM_FLOAT;
                    useMediaRecorder = false;
                } else {
                    // Fallback to PCM 16-bit
                    audioFormat = AudioFormat.ENCODING_PCM_16BIT;
                    useMediaRecorder = false;
                }
                break;
        }
        
        // Ajuste le canal pour AudioRecord
        channelConfig = (channels == 2) ? 
            AudioFormat.CHANNEL_IN_STEREO : AudioFormat.CHANNEL_IN_MONO;
    }
    
    /**
     * Obtient l'extension de fichier appropriée
     */
    public String getFileExtension() {
        if (!useMediaRecorder) {
            return ".wav";
        }
        
        switch (outputFormat) {
            case MediaRecorder.OutputFormat.MPEG_4:
                return ".m4a";
            case MediaRecorder.OutputFormat.THREE_GPP:
                return ".3gp";
            case MediaRecorder.OutputFormat.WEBM:
                return ".webm";
            case MediaRecorder.OutputFormat.OGG:
                return ".ogg";
            default:
                return ".m4a";
        }
    }
    
    /**
     * Calcule la taille estimée par minute (en MB)
     */
    public double getEstimatedSizePerMinute() {
        if (!useMediaRecorder) {
            // PCM non compressé
            double bytesPerSecond = sampleRate * channels * (audioFormat == AudioFormat.ENCODING_PCM_16BIT ? 2 : 
                                   audioFormat == AudioFormat.ENCODING_PCM_8BIT ? 1 : 4);
            return (bytesPerSecond * 60) / (1024 * 1024);
        } else {
            // Formats compressés
            return (bitRate * 60.0) / (8 * 1024 * 1024);
        }
    }
    
    /**
     * Obtient une description lisible de la configuration
     */
    public String getDescription() {
        StringBuilder sb = new StringBuilder();
        
        if (useMediaRecorder) {
            switch (audioEncoder) {
                case MediaRecorder.AudioEncoder.AAC:
                    sb.append("AAC");
                    break;
                case MediaRecorder.AudioEncoder.AAC_ELD:
                    sb.append("AAC-ELD");
                    break;
                case MediaRecorder.AudioEncoder.HE_AAC:
                    sb.append("HE-AAC");
                    break;
                case MediaRecorder.AudioEncoder.AMR_NB:
                    sb.append("AMR-NB");
                    break;
                case MediaRecorder.AudioEncoder.AMR_WB:
                    sb.append("AMR-WB");
                    break;
                case MediaRecorder.AudioEncoder.OPUS:
                    sb.append("Opus");
                    break;
                case MediaRecorder.AudioEncoder.VORBIS:
                    sb.append("Vorbis");
                    break;
            }
        } else {
            sb.append("PCM");
        }
        
        sb.append(" - ").append(sampleRate).append("Hz");
        sb.append(" - ").append(channels == 1 ? "Mono" : "Stereo");
        
        if (useMediaRecorder) {
            sb.append(" - ").append(bitRate / 1000).append("kbps");
        }
        
        return sb.toString();
    }
}