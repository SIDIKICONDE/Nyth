package com.audiomodule;

import android.content.Context;
import android.media.MediaRecorder;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.io.File;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour AudioRecorder
 */
@RunWith(MockitoJUnitRunner.class)
public class AudioRecorderTest {
    
    @Mock
    private Context mockContext;
    
    @Mock
    private AudioRecorder.AudioRecorderCallback mockCallback;
    
    private AudioRecorder audioRecorder;
    
    @Before
    public void setUp() {
        when(mockContext.getApplicationContext()).thenReturn(mockContext);
        when(mockContext.getExternalFilesDir(null)).thenReturn(new File("/test"));
        
        audioRecorder = new AudioRecorder(mockContext);
        audioRecorder.setCallback(mockCallback);
    }
    
    @Test
    public void testInitialState() {
        assertEquals(AudioRecorder.RecorderState.IDLE, audioRecorder.getState());
        assertNull(audioRecorder.getCurrentRecordingPath());
    }
    
    @Test
    public void testSetAudioConfiguration() {
        AudioConfiguration config = new AudioConfiguration();
        config.sampleRate = 48000;
        config.channels = 2;
        
        audioRecorder.setAudioConfiguration(config);
        
        // La configuration devrait être acceptée en état IDLE
        assertEquals(AudioRecorder.RecorderState.IDLE, audioRecorder.getState());
    }
    
    @Test
    public void testUsePreset() {
        audioRecorder.usePreset(AudioPreset.VOICE_NOTE);
        
        // Le preset devrait être appliqué sans erreur
        assertEquals(AudioRecorder.RecorderState.IDLE, audioRecorder.getState());
    }
    
    @Test
    public void testStartRecordingWithoutPermission() {
        // Simuler absence de permission
        when(mockContext.checkSelfPermission(anyString()))
            .thenReturn(android.content.pm.PackageManager.PERMISSION_DENIED);
        
        audioRecorder.startRecording(null);
        
        // Devrait notifier l'erreur de permission
        verify(mockCallback, timeout(1000)).onError(AudioRecorderError.PERMISSION_DENIED);
    }
    
    @Test
    public void testStopRecordingWhenNotRecording() {
        audioRecorder.stopRecording();
        
        // Devrait notifier l'erreur
        verify(mockCallback, timeout(1000)).onError(AudioRecorderError.NOT_RECORDING);
    }
    
    @Test
    public void testAudioConfigurationDefaults() {
        AudioConfiguration config = AudioConfiguration.getDefault();
        
        assertEquals(MediaRecorder.AudioSource.MIC, config.audioSource);
        assertEquals(MediaRecorder.OutputFormat.MPEG_4, config.outputFormat);
        assertEquals(MediaRecorder.AudioEncoder.AAC, config.audioEncoder);
        assertEquals(44100, config.sampleRate);
        assertEquals(1, config.channels);
        assertEquals(128000, config.bitRate);
    }
    
    @Test
    public void testAudioConfigurationPresets() {
        // Test Voice Note preset
        AudioConfiguration voiceNote = AudioConfiguration.fromPreset(AudioPreset.VOICE_NOTE);
        assertEquals(AudioQuality.MEDIUM, voiceNote.quality);
        assertEquals(1, voiceNote.channels);
        
        // Test Music High preset
        AudioConfiguration musicHigh = AudioConfiguration.fromPreset(AudioPreset.MUSIC_HIGH);
        assertEquals(AudioQuality.MAXIMUM, musicHigh.quality);
        assertEquals(2, musicHigh.channels);
        assertEquals(48000, musicHigh.sampleRate);
        
        // Test Professional preset
        AudioConfiguration professional = AudioConfiguration.fromPreset(AudioPreset.PROFESSIONAL);
        assertFalse(professional.useMediaRecorder);
        assertEquals(48000, professional.sampleRate);
    }
    
    @Test
    public void testFileExtensions() {
        AudioConfiguration config = new AudioConfiguration();
        
        // AAC -> .m4a
        config.outputFormat = MediaRecorder.OutputFormat.MPEG_4;
        assertEquals(".m4a", config.getFileExtension());
        
        // AMR -> .3gp
        config.outputFormat = MediaRecorder.OutputFormat.THREE_GPP;
        assertEquals(".3gp", config.getFileExtension());
        
        // PCM -> .wav
        config.useMediaRecorder = false;
        assertEquals(".wav", config.getFileExtension());
    }
    
    @Test
    public void testEstimatedFileSize() {
        AudioConfiguration config = new AudioConfiguration();
        
        // Format compressé (AAC 128kbps)
        config.bitRate = 128000;
        config.useMediaRecorder = true;
        double compressedSize = config.getEstimatedSizePerMinute();
        assertTrue(compressedSize > 0.9 && compressedSize < 1.1); // ~1 MB/min
        
        // Format non compressé (PCM 16-bit, 44.1kHz, mono)
        config.useMediaRecorder = false;
        config.sampleRate = 44100;
        config.channels = 1;
        config.audioFormat = android.media.AudioFormat.ENCODING_PCM_16BIT;
        double uncompressedSize = config.getEstimatedSizePerMinute();
        assertTrue(uncompressedSize > 5 && uncompressedSize < 6); // ~5.3 MB/min
    }
    
    @Test
    public void testAudioLevelCalculation() {
        // Test avec silence
        byte[] silentBuffer = new byte[1024];
        float silentLevel = AudioUtils.calculateAudioLevel(silentBuffer, 1024);
        assertEquals(-160f, silentLevel, 0.1f);
        
        // Test avec signal
        byte[] signalBuffer = new byte[1024];
        for (int i = 0; i < signalBuffer.length; i += 2) {
            signalBuffer[i] = 0;
            signalBuffer[i + 1] = 50; // Signal moyen
        }
        float signalLevel = AudioUtils.calculateAudioLevel(signalBuffer, 1024);
        assertTrue(signalLevel > -160f && signalLevel < 0f);
    }
    
    @Test
    public void testFormatSupport() {
        // Formats toujours supportés
        assertTrue(AudioUtils.isFormatSupported(AudioFormatType.AAC));
        assertTrue(AudioUtils.isFormatSupported(AudioFormatType.AMR_NB));
        assertTrue(AudioUtils.isFormatSupported(AudioFormatType.PCM_16BIT));
        
        // Note: Les autres formats dépendent de la version d'Android
        // et ne peuvent pas être testés de manière fiable dans les tests unitaires
    }
    
    @Test
    public void testErrorMessages() {
        assertEquals("Microphone permission denied", 
            AudioRecorderError.PERMISSION_DENIED.getMessage());
        assertEquals("Already recording", 
            AudioRecorderError.ALREADY_RECORDING.getMessage());
        assertEquals("Not currently recording", 
            AudioRecorderError.NOT_RECORDING.getMessage());
    }
}

/**
 * Tests d'intégration pour AudioRecorderModule
 */
@RunWith(MockitoJUnitRunner.class)
public class AudioRecorderModuleTest {
    
    @Mock
    private ReactApplicationContext mockReactContext;
    
    @Mock
    private Promise mockPromise;
    
    private AudioRecorderModule module;
    
    @Before
    public void setUp() {
        when(mockReactContext.getApplicationContext()).thenReturn(mockReactContext);
        module = new AudioRecorderModule(mockReactContext);
    }
    
    @Test
    public void testModuleName() {
        assertEquals("AudioRecorderModule", module.getName());
    }
    
    @Test
    public void testGetConstants() {
        Map<String, Object> constants = module.getConstants();
        
        assertNotNull(constants);
        assertTrue(constants.containsKey("FORMATS"));
        assertTrue(constants.containsKey("PRESETS"));
    }
    
    @Test
    public void testGetRecordingStatus() {
        WritableMap status = module.getRecordingStatus();
        
        assertNotNull(status);
        // État initial : pas d'enregistrement
        assertEquals(false, status.getBoolean("isRecording"));
        assertEquals(false, status.getBoolean("isPaused"));
    }
}