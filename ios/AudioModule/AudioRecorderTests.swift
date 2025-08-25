import XCTest
import AVFoundation
@testable import AudioModule

/// Tests unitaires pour AudioRecorder
class AudioRecorderTests: XCTestCase {
    
    var audioRecorder: AudioRecorder!
    var mockDelegate: MockAudioRecorderDelegate!
    
    override func setUp() {
        super.setUp()
        audioRecorder = AudioRecorder()
        mockDelegate = MockAudioRecorderDelegate()
        audioRecorder.delegate = mockDelegate
    }
    
    override func tearDown() {
        audioRecorder.stopRecording()
        audioRecorder = nil
        mockDelegate = nil
        super.tearDown()
    }
    
    // MARK: - Tests d'initialisation
    
    func testInitialization() {
        XCTAssertNotNil(audioRecorder)
        XCTAssertFalse(audioRecorder.isRecording)
        XCTAssertFalse(audioRecorder.isPaused)
    }
    
    // MARK: - Tests de configuration
    
    func testConfigureAudioSession() throws {
        // Test de configuration réussie
        XCTAssertNoThrow(try audioRecorder.configureAudioSession())
        
        // Vérifie que le delegate est notifié
        XCTAssertTrue(mockDelegate.didConfigureSession)
    }
    
    // MARK: - Tests des permissions
    
    func testRequestMicrophonePermission() {
        let expectation = XCTestExpectation(description: "Permission callback")
        
        audioRecorder.requestMicrophonePermission { granted in
            // Le résultat dépend de l'état du simulateur/appareil
            // On vérifie juste que le callback est appelé
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 5.0)
    }
    
    // MARK: - Tests d'état
    
    func testRecordingStatus() {
        let status = audioRecorder.getRecordingStatus()
        
        XCTAssertEqual(status["isRecording"] as? Bool, false)
        XCTAssertEqual(status["isPaused"] as? Bool, false)
        XCTAssertTrue(status["currentFilePath"] is NSNull)
    }
    
    // MARK: - Tests de l'API TurboModule
    
    func testStartRecordingWithOptions() {
        let expectation = XCTestExpectation(description: "Start recording")
        
        let options: [String: Any] = [
            "fileName": "test-recording.m4a",
            "sampleRate": 44100.0,
            "channels": 1
        ]
        
        audioRecorder.startRecordingWithOptions(options,
            resolver: { result in
                // Vérifie le résultat
                if let resultDict = result as? [String: Any] {
                    XCTAssertEqual(resultDict["status"] as? String, "started")
                    XCTAssertNotNil(resultDict["filePath"])
                }
                expectation.fulfill()
            },
            rejecter: { code, message, error in
                // Sur simulateur, on s'attend à une erreur de permission
                XCTAssertEqual(code, "PERMISSION_DENIED")
                expectation.fulfill()
            }
        )
        
        wait(for: [expectation], timeout: 5.0)
    }
    
    func testStopRecordingWhenNotRecording() {
        let expectation = XCTestExpectation(description: "Stop recording")
        
        audioRecorder.stopRecordingWithResolver(
            { _ in
                XCTFail("Should not succeed when not recording")
                expectation.fulfill()
            },
            rejecter: { code, message, error in
                XCTAssertEqual(code, "NOT_RECORDING")
                expectation.fulfill()
            }
        )
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testConfigureAudioOptions() {
        let expectation = XCTestExpectation(description: "Configure audio")
        
        let options: [String: Any] = [
            "category": "playAndRecord",
            "mode": "default",
            "sampleRate": 48000.0
        ]
        
        audioRecorder.configureAudioOptions(options,
            resolver: { result in
                if let resultDict = result as? [String: Any] {
                    XCTAssertEqual(resultDict["status"] as? String, "configured")
                }
                expectation.fulfill()
            },
            rejecter: { _, _, _ in
                // Configuration peut échouer sur simulateur
                expectation.fulfill()
            }
        )
        
        wait(for: [expectation], timeout: 5.0)
    }
    
    // MARK: - Tests des erreurs
    
    func testAudioRecorderErrors() {
        // Test des descriptions d'erreur
        XCTAssertEqual(AudioRecorderError.permissionDenied.localizedDescription, 
                      "Microphone permission denied")
        XCTAssertEqual(AudioRecorderError.alreadyRecording.localizedDescription, 
                      "Already recording")
        XCTAssertEqual(AudioRecorderError.notRecording.localizedDescription, 
                      "Not currently recording")
    }
    
    // MARK: - Tests des événements
    
    func testAudioRecorderEvents() {
        // Test de création d'événements
        let startEvent = AudioRecorderEvent.recordingStarted()
        XCTAssertEqual(startEvent.name, "recordingStarted")
        
        let stopEvent = AudioRecorderEvent.recordingStopped(filePath: "/test/path.m4a", duration: 10.5)
        XCTAssertEqual(stopEvent.name, "recordingStopped")
        XCTAssertEqual(stopEvent.body["filePath"] as? String, "/test/path.m4a")
        XCTAssertEqual(stopEvent.body["duration"] as? Double, 10.5)
        
        let levelEvent = AudioRecorderEvent.audioLevel(-20.0)
        XCTAssertEqual(levelEvent.name, "audioLevel")
        XCTAssertEqual(levelEvent.body["level"] as? Float, -20.0)
    }
}

// MARK: - Mock Delegate

class MockAudioRecorderDelegate: NSObject, AudioRecorderDelegate {
    
    var didConfigureSession = false
    var didStartRecording = false
    var didPauseRecording = false
    var didResumeRecording = false
    var didFinishRecording = false
    var lastRecordingURL: URL?
    var lastAudioLevel: Float?
    var lastError: AudioRecorderError?
    
    func audioRecorderDidConfigureSession(_ recorder: AudioRecorder) {
        didConfigureSession = true
    }
    
    func audioRecorderDidStartRecording(_ recorder: AudioRecorder) {
        didStartRecording = true
    }
    
    func audioRecorderDidPauseRecording(_ recorder: AudioRecorder) {
        didPauseRecording = true
    }
    
    func audioRecorderDidResumeRecording(_ recorder: AudioRecorder) {
        didResumeRecording = true
    }
    
    func audioRecorder(_ recorder: AudioRecorder, didFinishRecordingToURL url: URL) {
        didFinishRecording = true
        lastRecordingURL = url
    }
    
    func audioRecorder(_ recorder: AudioRecorder, didUpdateAudioLevel level: Float) {
        lastAudioLevel = level
    }
    
    func audioRecorder(_ recorder: AudioRecorder, didFailWithError error: AudioRecorderError) {
        lastError = error
    }
}