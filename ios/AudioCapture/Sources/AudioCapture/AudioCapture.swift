import Foundation
#if canImport(AVFoundation) && os(iOS)
import AVFoundation

public protocol AudioCaptureDelegate: AnyObject {
    func audioCapture(_ capture: AudioCapture, didCapture buffer: AVAudioPCMBuffer, at time: AVAudioTime)
    func audioCapture(_ capture: AudioCapture, didFinishRecordingTo fileURL: URL)
    func audioCapture(_ capture: AudioCapture, didFail error: Error)
    func audioCaptureWasInterrupted(_ capture: AudioCapture)
    func audioCaptureInterruptionEnded(_ capture: AudioCapture, shouldResume: Bool)
}

public extension AudioCaptureDelegate {
    func audioCapture(_ capture: AudioCapture, didCapture buffer: AVAudioPCMBuffer, at time: AVAudioTime) {}
    func audioCapture(_ capture: AudioCapture, didFinishRecordingTo fileURL: URL) {}
    func audioCapture(_ capture: AudioCapture, didFail error: Error) {}
    func audioCaptureWasInterrupted(_ capture: AudioCapture) {}
    func audioCaptureInterruptionEnded(_ capture: AudioCapture, shouldResume: Bool) {}
}

public enum AudioCaptureError: Error {
    case microphonePermissionDenied
    case engineStartFailed(underlying: Error?)
    case sessionConfigurationFailed(underlying: Error)
    case fileCreationFailed(underlying: Error)
    case notRecording
    case alreadyRecording
}

public enum AudioFileFormat {
    case cafPCM16
    case wavPCM16
    case m4aAAC
}

public struct AudioCaptureConfig {
    public var category: AVAudioSession.Category
    public var mode: AVAudioSession.Mode
    public var options: AVAudioSession.CategoryOptions
    public var preferredSampleRate: Double
    public var preferredIOBufferDuration: TimeInterval
    public var channelCount: AVAudioChannelCount
    public var writeToFile: Bool
    public var fileFormat: AudioFileFormat

    public init(
        category: AVAudioSession.Category = .playAndRecord,
        mode: AVAudioSession.Mode = .default,
        options: AVAudioSession.CategoryOptions = [.defaultToSpeaker, .allowBluetooth],
        preferredSampleRate: Double = 44100.0,
        preferredIOBufferDuration: TimeInterval = 0.005,
        channelCount: AVAudioChannelCount = 1,
        writeToFile: Bool = true,
        fileFormat: AudioFileFormat = .cafPCM16
    ) {
        self.category = category
        self.mode = mode
        self.options = options
        self.preferredSampleRate = preferredSampleRate
        self.preferredIOBufferDuration = preferredIOBufferDuration
        self.channelCount = channelCount
        self.writeToFile = writeToFile
        self.fileFormat = fileFormat
    }
}

public final class AudioCapture: NSObject {
    public weak var delegate: AudioCaptureDelegate?
    public private(set) var isRecording: Bool = false
    public private(set) var currentFileURL: URL?

    private let session: AVAudioSession = .sharedInstance()
    private let engine: AVAudioEngine = AVAudioEngine()
    private var audioFile: AVAudioFile?
    private var notificationObservers: [NSObjectProtocol] = []

    public override init() {
        super.init()
        observeNotifications()
    }

    deinit {
        stopObservingNotifications()
        engine.stop()
        engine.inputNode.removeTap(onBus: 0)
    }

    private func observeNotifications() {
        let nc = NotificationCenter.default
        notificationObservers.append(
            nc.addObserver(forName: AVAudioSession.interruptionNotification, object: session, queue: .main) { [weak self] note in
                self?.handleInterruption(note: note)
            }
        )
        notificationObservers.append(
            nc.addObserver(forName: AVAudioSession.routeChangeNotification, object: session, queue: .main) { [weak _] _ in
                // Route changes can be handled here if needed for UX
            }
        )
    }

    private func stopObservingNotifications() {
        let nc = NotificationCenter.default
        notificationObservers.forEach { nc.removeObserver($0) }
        notificationObservers.removeAll()
    }

    private func handleInterruption(note: Notification) {
        guard let info = note.userInfo,
              let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
        switch type {
        case .began:
            delegate?.audioCaptureWasInterrupted(self)
        case .ended:
            var shouldResume = false
            if let optionValue = info[AVAudioSessionInterruptionOptionKey] as? UInt {
                let options = AVAudioSession.InterruptionOptions(rawValue: optionValue)
                shouldResume = options.contains(.shouldResume)
            }
            delegate?.audioCaptureInterruptionEnded(self, shouldResume: shouldResume)
            if shouldResume, isRecording {
                try? engine.start()
            }
        @unknown default:
            break
        }
    }

    public func requestRecordPermission(completion: @escaping (Bool) -> Void) {
        session.requestRecordPermission { granted in
            DispatchQueue.main.async { completion(granted) }
        }
    }

    public func start(
        config: AudioCaptureConfig = AudioCaptureConfig(),
        outputFileURL: URL? = nil,
        completion: @escaping (Result<URL?, Error>) -> Void
    ) {
        guard !isRecording else {
            completion(.failure(AudioCaptureError.alreadyRecording))
            return
        }

        requestRecordPermission { [weak self] granted in
            guard let self = self else { return }
            guard granted else {
                completion(.failure(AudioCaptureError.microphonePermissionDenied))
                return
            }
            do {
                try self.configureSession(with: config)
                try self.startEngineAndTap(config: config, outputFileURL: outputFileURL)
                self.isRecording = true
                completion(.success(self.currentFileURL))
            } catch {
                self.cleanupAfterStop()
                completion(.failure(error))
            }
        }
    }

    public func stop() {
        guard isRecording else { return }
        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        sessionSetActive(false)
        if let file = audioFile {
            audioFile = nil
            delegate?.audioCapture(self, didFinishRecordingTo: file.url)
        }
        cleanupAfterStop()
    }

    private func cleanupAfterStop() {
        isRecording = false
        currentFileURL = nil
    }

    private func configureSession(with config: AudioCaptureConfig) throws {
        do {
            try session.setCategory(config.category, mode: config.mode, options: config.options)
            try session.setPreferredSampleRate(config.preferredSampleRate)
            try session.setPreferredIOBufferDuration(config.preferredIOBufferDuration)
            sessionSetActive(true)
        } catch {
            throw AudioCaptureError.sessionConfigurationFailed(underlying: error)
        }
    }

    private func sessionSetActive(_ active: Bool) {
        do {
            try session.setActive(active, options: [])
        } catch {
            // Intentionally ignore to keep UX smooth; engine start will surface errors
        }
    }

    private func startEngineAndTap(config: AudioCaptureConfig, outputFileURL: URL?) throws {
        let input = engine.inputNode
        let desiredSampleRate = config.preferredSampleRate
        let desiredChannelCount = config.channelCount
        let format = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: desiredSampleRate, channels: desiredChannelCount, interleaved: false)
            ?? input.inputFormat(forBus: 0)

        engine.connect(input, to: engine.mainMixerNode, format: format)

        if let url = resolvedOutputURL(for: outputFileURL, fileFormat: config.fileFormat), config.writeToFile {
            currentFileURL = url
            audioFile = try makeAudioFile(url: url, format: fileWriteFormat(from: format, fileFormat: config.fileFormat))
        } else {
            currentFileURL = nil
            audioFile = nil
        }

        input.installTap(onBus: 0, bufferSize: 2048, format: format) { [weak self] buffer, time in
            guard let self = self else { return }
            if let file = self.audioFile {
                do { try file.write(from: buffer) } catch {
                    DispatchQueue.main.async {
                        self.delegate?.audioCapture(self, didFail: AudioCaptureError.fileCreationFailed(underlying: error))
                    }
                }
            }
            if self.delegate != nil {
                DispatchQueue.main.async {
                    self.delegate?.audioCapture(self, didCapture: buffer, at: time)
                }
            }
        }

        do {
            try engine.start()
        } catch {
            throw AudioCaptureError.engineStartFailed(underlying: error)
        }
    }

    private func makeAudioFile(url: URL, format: AVAudioFormat) throws -> AVAudioFile {
        do { return try AVAudioFile(forWriting: url, settings: format.settings) } catch {
            throw AudioCaptureError.fileCreationFailed(underlying: error)
        }
    }

    private func resolvedOutputURL(for provided: URL?, fileFormat: AudioFileFormat) -> URL? {
        if let provided { return provided }
        let dir = FileManager.default.temporaryDirectory
        let filename = "recording-\(UUID().uuidString)"
        switch fileFormat {
        case .cafPCM16:
            return dir.appendingPathComponent("\(filename).caf")
        case .wavPCM16:
            return dir.appendingPathComponent("\(filename).wav")
        case .m4aAAC:
            return dir.appendingPathComponent("\(filename).m4a")
        }
    }

    private func fileWriteFormat(from captureFormat: AVAudioFormat, fileFormat: AudioFileFormat) -> AVAudioFormat {
        switch fileFormat {
        case .cafPCM16, .wavPCM16:
            let settings: [String: Any] = [
                AVFormatIDKey: kAudioFormatLinearPCM,
                AVSampleRateKey: captureFormat.sampleRate,
                AVNumberOfChannelsKey: Int(captureFormat.channelCount),
                AVLinearPCMBitDepthKey: 16,
                AVLinearPCMIsNonInterleavedKey: false,
                AVLinearPCMIsFloatKey: false,
                AVLinearPCMIsBigEndianKey: false
            ]
            return AVAudioFormat(settings: settings) ?? captureFormat
        case .m4aAAC:
            let settings: [String: Any] = [
                AVFormatIDKey: kAudioFormatMPEG4AAC,
                AVSampleRateKey: captureFormat.sampleRate,
                AVNumberOfChannelsKey: Int(captureFormat.channelCount),
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
            ]
            return AVAudioFormat(settings: settings) ?? captureFormat
        }
    }
}
#else
// Placeholder for non-iOS platforms to avoid build issues when indexed by tools.
public final class AudioCapture: NSObject {}
#endif

