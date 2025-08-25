//
//  AudioCaptureTests.swift
//  AudioCaptureTests
//
//  Tests unitaires pour le module AudioCapture
//

import XCTest
import AVFoundation
@testable import AudioCapture

class AudioCaptureTests: XCTestCase {
    
    var audioEngine: AudioCaptureEngine!
    var mockDelegate: MockAudioCaptureDelegate!
    
    override func setUp() {
        super.setUp()
        audioEngine = AudioCaptureEngine()
        mockDelegate = MockAudioCaptureDelegate()
        audioEngine.delegate = mockDelegate
    }
    
    override func tearDown() {
        audioEngine.stopRecording()
        audioEngine = nil
        mockDelegate = nil
        super.tearDown()
    }
    
    // MARK: - Configuration Tests
    
    func testDefaultConfiguration() {
        let config = AudioCaptureConfiguration()
        
        XCTAssertEqual(config.sampleRate, 44100.0)
        XCTAssertEqual(config.channelCount, 1)
        XCTAssertEqual(config.format, .pcmFloat32)
        XCTAssertEqual(config.bufferSize, 1024)
        XCTAssertTrue(config.enableLevelMeasurement)
        XCTAssertEqual(config.levelUpdateInterval, 0.1)
    }
    
    func testValidConfiguration() throws {
        let config = AudioCaptureConfiguration()
        config.sampleRate = 48000
        config.channelCount = 2
        config.format = .pcmInt16
        config.bufferSize = 2048
        
        XCTAssertNoThrow(try audioEngine.configure(with: config))
        XCTAssertEqual(audioEngine.configuration.sampleRate, 48000)
        XCTAssertEqual(audioEngine.configuration.channelCount, 2)
        XCTAssertEqual(audioEngine.configuration.format, .pcmInt16)
    }
    
    func testInvalidSampleRate() {
        let config = AudioCaptureConfiguration()
        config.sampleRate = 12345 // Taux non supporté
        
        XCTAssertThrowsError(try audioEngine.configure(with: config)) { error in
            XCTAssertTrue(error is AudioCaptureError)
            if case AudioCaptureError.invalidConfiguration(let message) = error {
                XCTAssertTrue(message.contains("taux d'échantillonnage"))
            }
        }
    }
    
    func testInvalidChannelCount() {
        let config = AudioCaptureConfiguration()
        config.channelCount = 5 // Plus de 2 canaux
        
        XCTAssertThrowsError(try audioEngine.configure(with: config)) { error in
            XCTAssertTrue(error is AudioCaptureError)
            if case AudioCaptureError.invalidConfiguration(let message) = error {
                XCTAssertTrue(message.contains("canaux"))
            }
        }
    }
    
    func testInvalidBufferSize() {
        let config = AudioCaptureConfiguration()
        config.bufferSize = 32 // Trop petit
        
        XCTAssertThrowsError(try audioEngine.configure(with: config)) { error in
            XCTAssertTrue(error is AudioCaptureError)
            if case AudioCaptureError.invalidConfiguration(let message) = error {
                XCTAssertTrue(message.contains("buffer"))
            }
        }
    }
    
    // MARK: - Recording State Tests
    
    func testInitialState() {
        XCTAssertFalse(audioEngine.isRecording)
    }
    
    func testStartRecordingWithoutConfiguration() {
        XCTAssertThrowsError(try audioEngine.startRecording()) { error in
            XCTAssertTrue(error is AudioCaptureError)
        }
    }
    
    func testStartStopRecording() throws {
        // Configure d'abord
        try audioEngine.configure(with: AudioCaptureConfiguration())
        
        // Simuler la permission accordée
        // Note: En vrai test, vous devriez mocker AVAudioSession
        
        // Démarrer l'enregistrement
        if audioEngine.isMicrophonePermissionGranted() {
            try audioEngine.startRecording()
            XCTAssertTrue(audioEngine.isRecording)
            
            // Attendre le callback
            let startExpectation = expectation(description: "Recording started")
            mockDelegate.onStart = {
                startExpectation.fulfill()
            }
            wait(for: [startExpectation], timeout: 1.0)
            
            // Arrêter l'enregistrement
            audioEngine.stopRecording()
            XCTAssertFalse(audioEngine.isRecording)
            
            // Attendre le callback d'arrêt
            let stopExpectation = expectation(description: "Recording stopped")
            mockDelegate.onStop = {
                stopExpectation.fulfill()
            }
            wait(for: [stopExpectation], timeout: 1.0)
        }
    }
    
    func testDoubleStart() throws {
        try audioEngine.configure(with: AudioCaptureConfiguration())
        
        if audioEngine.isMicrophonePermissionGranted() {
            try audioEngine.startRecording()
            
            // Essayer de démarrer à nouveau
            XCTAssertThrowsError(try audioEngine.startRecording()) { error in
                XCTAssertTrue(error is AudioCaptureError)
                if case AudioCaptureError.recordingAlreadyInProgress = error {
                    // Success
                } else {
                    XCTFail("Expected recordingAlreadyInProgress error")
                }
            }
        }
    }
    
    // MARK: - Manager Tests
    
    func testManagerSingleton() {
        let manager1 = AudioCaptureManager.shared
        let manager2 = AudioCaptureManager.shared
        
        XCTAssertTrue(manager1 === manager2)
    }
    
    func testManagerConfiguration() throws {
        let manager = AudioCaptureManager.shared
        
        XCTAssertNoThrow(try manager.configure(
            sampleRate: 44100,
            channels: 1,
            format: "float32"
        ))
    }
    
    func testManagerInvalidFormat() {
        let manager = AudioCaptureManager.shared
        
        XCTAssertThrowsError(try manager.configure(
            sampleRate: 44100,
            channels: 1,
            format: "invalid"
        )) { error in
            XCTAssertTrue(error is AudioCaptureError)
        }
    }
    
    func testDataConversion() {
        let manager = AudioCaptureManager.shared
        
        // Créer des données de test
        let floatArray: [Float] = [0.1, 0.2, 0.3, 0.4, 0.5]
        var data = Data()
        floatArray.withUnsafeBytes { bytes in
            data.append(contentsOf: bytes)
        }
        
        // Tester la conversion
        let convertedArray = manager.convertDataToFloatArray(data)
        XCTAssertEqual(convertedArray.count, floatArray.count)
        for i in 0..<floatArray.count {
            XCTAssertEqual(convertedArray[i], floatArray[i], accuracy: 0.0001)
        }
    }
    
    func testBase64Conversion() {
        let manager = AudioCaptureManager.shared
        
        let testData = "Hello Audio".data(using: .utf8)!
        let base64 = manager.convertDataToBase64(testData)
        
        // Vérifier que c'est du base64 valide
        XCTAssertNotNil(Data(base64Encoded: base64))
        XCTAssertEqual(Data(base64Encoded: base64), testData)
    }
    
    // MARK: - Audio Level Tests
    
    func testAudioLevelMeasurement() throws {
        let config = AudioCaptureConfiguration()
        config.enableLevelMeasurement = true
        config.levelUpdateInterval = 0.05
        
        try audioEngine.configure(with: config)
        
        if audioEngine.isMicrophonePermissionGranted() {
            try audioEngine.startRecording()
            
            // Attendre les mises à jour du niveau
            let levelExpectation = expectation(description: "Audio level updated")
            mockDelegate.onLevelUpdate = { level in
                XCTAssertGreaterThanOrEqual(level, 0.0)
                XCTAssertLessThanOrEqual(level, 1.0)
                levelExpectation.fulfill()
            }
            
            wait(for: [levelExpectation], timeout: 2.0)
            
            audioEngine.stopRecording()
        }
    }
    
    // MARK: - Permission Tests
    
    func testPermissionCheck() {
        let hasPermission = audioEngine.isMicrophonePermissionGranted()
        
        // Le résultat dépend de l'environnement de test
        // Mais la méthode ne doit pas crasher
        XCTAssertNotNil(hasPermission)
    }
    
    func testPermissionRequest() {
        let permissionExpectation = expectation(description: "Permission callback")
        
        audioEngine.requestMicrophonePermission { granted in
            // Le résultat dépend de l'environnement
            // Mais le callback doit être appelé
            XCTAssertNotNil(granted)
            permissionExpectation.fulfill()
        }
        
        wait(for: [permissionExpectation], timeout: 5.0)
    }
    
    // MARK: - Error Handling Tests
    
    func testErrorDescriptions() {
        let errors: [AudioCaptureError] = [
            .microphonePermissionDenied,
            .audioEngineNotInitialized,
            .audioFormatNotSupported,
            .bufferAllocationFailed,
            .recordingAlreadyInProgress,
            .noRecordingInProgress,
            .invalidConfiguration("test")
        ]
        
        for error in errors {
            XCTAssertNotNil(error.errorDescription)
            XCTAssertFalse(error.errorDescription!.isEmpty)
        }
    }
    
    // MARK: - Buffer Management Tests
    
    func testAudioBufferManagement() throws {
        let manager = AudioCaptureManager.shared
        
        // Simuler l'ajout de données
        let testData1 = Data(repeating: 1, count: 100)
        let testData2 = Data(repeating: 2, count: 100)
        
        manager.audioCapture(didReceiveAudioData: testData1)
        manager.audioCapture(didReceiveAudioData: testData2)
        
        // Récupérer et vider le buffer
        let buffer = manager.flushAudioBuffer()
        XCTAssertEqual(buffer.count, 2)
        
        // Vérifier que le buffer est vide après flush
        let emptyBuffer = manager.flushAudioBuffer()
        XCTAssertEqual(emptyBuffer.count, 0)
    }
}

// MARK: - Mock Delegate

class MockAudioCaptureDelegate: NSObject, AudioCaptureDelegate {
    var onData: ((Data) -> Void)?
    var onStart: (() -> Void)?
    var onStop: (() -> Void)?
    var onError: ((Error) -> Void)?
    var onLevelUpdate: ((Float) -> Void)?
    
    func audioCapture(didReceiveAudioData data: Data) {
        onData?(data)
    }
    
    func audioCaptureDidStart() {
        onStart?()
    }
    
    func audioCaptureDidStop() {
        onStop?()
    }
    
    func audioCapture(didFailWithError error: Error) {
        onError?(error)
    }
    
    func audioCapture(didUpdateAudioLevel level: Float) {
        onLevelUpdate?(level)
    }
}

// MARK: - Performance Tests

extension AudioCaptureTests {
    
    func testRecordingPerformance() throws {
        try audioEngine.configure(with: AudioCaptureConfiguration())
        
        measure {
            do {
                if audioEngine.isMicrophonePermissionGranted() {
                    try audioEngine.startRecording()
                    Thread.sleep(forTimeInterval: 0.1)
                    audioEngine.stopRecording()
                }
            } catch {
                XCTFail("Performance test failed: \(error)")
            }
        }
    }
    
    func testDataConversionPerformance() {
        let manager = AudioCaptureManager.shared
        
        // Créer un gros buffer de données
        let floatCount = 44100 // 1 seconde à 44.1kHz
        var floatArray = [Float](repeating: 0, count: floatCount)
        for i in 0..<floatCount {
            floatArray[i] = Float.random(in: -1.0...1.0)
        }
        
        var data = Data()
        floatArray.withUnsafeBytes { bytes in
            data.append(contentsOf: bytes)
        }
        
        measure {
            _ = manager.convertDataToFloatArray(data)
        }
    }
}