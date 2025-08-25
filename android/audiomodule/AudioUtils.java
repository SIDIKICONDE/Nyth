package com.audiomodule;

import android.media.MediaMetadataRetriever;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * Utilitaires pour le traitement audio
 */
public class AudioUtils {
    private static final String TAG = "AudioUtils";
    
    /**
     * Calcule le niveau audio à partir d'un buffer PCM
     * @param buffer Buffer de données audio
     * @param size Taille des données valides dans le buffer
     * @return Niveau en décibels
     */
    public static float calculateAudioLevel(byte[] buffer, int size) {
        if (buffer == null || size <= 0) {
            return -160f;
        }
        
        // Calcule la valeur RMS (Root Mean Square)
        long sum = 0;
        for (int i = 0; i < size; i += 2) {
            // Convertit les bytes en short (PCM 16-bit)
            short sample = (short) ((buffer[i] & 0xFF) | (buffer[i + 1] << 8));
            sum += sample * sample;
        }
        
        double rms = Math.sqrt(sum / (size / 2.0));
        
        // Convertit en décibels
        if (rms > 0) {
            return (float) (20 * Math.log10(rms / 32768.0));
        } else {
            return -160f; // Silence
        }
    }
    
    /**
     * Obtient la durée d'un fichier audio en millisecondes
     * @param audioFile Fichier audio
     * @return Durée en millisecondes, ou 0 en cas d'erreur
     */
    public static long getAudioDuration(File audioFile) {
        if (audioFile == null || !audioFile.exists()) {
            return 0;
        }
        
        MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        try {
            retriever.setDataSource(audioFile.getAbsolutePath());
            String durationStr = retriever.extractMetadata(
                MediaMetadataRetriever.METADATA_KEY_DURATION);
            
            if (durationStr != null) {
                return Long.parseLong(durationStr);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to get audio duration", e);
        } finally {
            try {
                retriever.release();
            } catch (Exception e) {
                // Ignore
            }
        }
        
        return 0;
    }
    
    /**
     * Écrit l'en-tête WAV pour un fichier PCM
     * @param outputStream Stream de sortie
     * @param config Configuration audio
     */
    public static void writeWavHeader(FileOutputStream outputStream, 
                                     AudioConfiguration config) throws IOException {
        int sampleRate = config.sampleRate;
        int channels = config.channels;
        int bitsPerSample = getBitsPerSample(config.audioFormat);
        
        // Calcule les paramètres WAV
        int byteRate = sampleRate * channels * bitsPerSample / 8;
        int blockAlign = channels * bitsPerSample / 8;
        
        // Taille initiale (sera mise à jour plus tard)
        int dataSize = 0;
        int totalSize = 36 + dataSize;
        
        // Écrit l'en-tête WAV
        outputStream.write(new byte[] {
            // RIFF header
            'R', 'I', 'F', 'F',
            (byte) (totalSize & 0xff),
            (byte) ((totalSize >> 8) & 0xff),
            (byte) ((totalSize >> 16) & 0xff),
            (byte) ((totalSize >> 24) & 0xff),
            // WAVE header
            'W', 'A', 'V', 'E',
            // fmt subchunk
            'f', 'm', 't', ' ',
            16, 0, 0, 0, // Subchunk1Size (16 for PCM)
            1, 0, // AudioFormat (1 for PCM)
            (byte) channels, 0,
            (byte) (sampleRate & 0xff),
            (byte) ((sampleRate >> 8) & 0xff),
            (byte) ((sampleRate >> 16) & 0xff),
            (byte) ((sampleRate >> 24) & 0xff),
            (byte) (byteRate & 0xff),
            (byte) ((byteRate >> 8) & 0xff),
            (byte) ((byteRate >> 16) & 0xff),
            (byte) ((byteRate >> 24) & 0xff),
            (byte) blockAlign, 0,
            (byte) bitsPerSample, 0,
            // data subchunk
            'd', 'a', 't', 'a',
            (byte) (dataSize & 0xff),
            (byte) ((dataSize >> 8) & 0xff),
            (byte) ((dataSize >> 16) & 0xff),
            (byte) ((dataSize >> 24) & 0xff)
        });
    }
    
    /**
     * Met à jour l'en-tête WAV avec la taille finale
     * @param wavFile Fichier WAV
     */
    public static void updateWavHeader(File wavFile) throws IOException {
        RandomAccessFile randomAccessFile = null;
        try {
            randomAccessFile = new RandomAccessFile(wavFile, "rw");
            
            // Taille du fichier
            long fileSize = randomAccessFile.length();
            long dataSize = fileSize - 44; // Taille des données audio
            
            // Met à jour la taille totale (position 4)
            randomAccessFile.seek(4);
            randomAccessFile.write(intToByteArray((int) (fileSize - 8)));
            
            // Met à jour la taille des données (position 40)
            randomAccessFile.seek(40);
            randomAccessFile.write(intToByteArray((int) dataSize));
            
        } finally {
            if (randomAccessFile != null) {
                randomAccessFile.close();
            }
        }
    }
    
    /**
     * Obtient le nombre de bits par échantillon
     */
    private static int getBitsPerSample(int audioFormat) {
        switch (audioFormat) {
            case android.media.AudioFormat.ENCODING_PCM_8BIT:
                return 8;
            case android.media.AudioFormat.ENCODING_PCM_16BIT:
                return 16;
            case android.media.AudioFormat.ENCODING_PCM_FLOAT:
                return 32;
            default:
                return 16;
        }
    }
    
    /**
     * Convertit un entier en tableau de bytes (little-endian)
     */
    private static byte[] intToByteArray(int value) {
        return new byte[] {
            (byte) (value & 0xff),
            (byte) ((value >> 8) & 0xff),
            (byte) ((value >> 16) & 0xff),
            (byte) ((value >> 24) & 0xff)
        };
    }
    
    /**
     * Formate la durée en millisecondes en chaîne lisible
     * @param durationMs Durée en millisecondes
     * @return Chaîne formatée (ex: "1:23")
     */
    public static String formatDuration(long durationMs) {
        long seconds = durationMs / 1000;
        long minutes = seconds / 60;
        seconds = seconds % 60;
        
        if (minutes > 0) {
            return String.format("%d:%02d", minutes, seconds);
        } else {
            return String.format("0:%02d", seconds);
        }
    }
    
    /**
     * Vérifie si un format audio est supporté sur cette version d'Android
     */
    public static boolean isFormatSupported(AudioFormatType format) {
        switch (format) {
            case AAC:
            case AMR_NB:
            case AMR_WB:
            case PCM_16BIT:
            case PCM_8BIT:
                return true;
                
            case AAC_ELD:
            case HE_AAC:
                return android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.JELLY_BEAN;
                
            case VORBIS:
            case PCM_FLOAT:
                return android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP;
                
            case OPUS:
                return android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q;
                
            default:
                return false;
        }
    }
    
    /**
     * Obtient la liste des formats supportés sur cet appareil
     */
    public static AudioFormatType[] getSupportedFormats() {
        return java.util.Arrays.stream(AudioFormatType.values())
            .filter(AudioUtils::isFormatSupported)
            .toArray(AudioFormatType[]::new);
    }
}