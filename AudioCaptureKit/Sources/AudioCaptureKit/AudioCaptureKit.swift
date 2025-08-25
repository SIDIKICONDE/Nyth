import Foundation
import AVFoundation

public protocol AudioCaptureDelegate: AnyObject {
    func audioCaptureDidStart()
    func audioCaptureDidStop()
    func audioCapture(didOutput buffer: AVAudioPCMBuffer, at time: AVAudioTime)
    func audioCapture(didFail error: Error)
}

public typealias ByteChunkHandler = (_ bytes: UnsafePointer<UInt8>, _ length: Int, _ timestampNs: UInt64) -> Void

public final class AudioCapture {
    public enum CaptureError: Error {
        case permissionDenied
        case engineFailure
        case alreadyRunning
        case notRunning
    }

    private let sessionManager = AudioSessionManager()
    private let engine = AudioCaptureEngine()
    private var config: AudioCaptureConfig = AudioCaptureConfig()

    public weak var delegate: AudioCaptureDelegate?
    private var byteHandler: ByteChunkHandler?

    public init() {}

    public var isRunning: Bool { engine.isRunning }

    public func start(
        config: AudioCaptureConfig = AudioCaptureConfig(),
        byteHandler: ByteChunkHandler? = nil,
        completion: @escaping (Result<Void, Error>) -> Void
    ) {
        if engine.isRunning {
            completion(.failure(CaptureError.alreadyRunning))
            return
        }

        self.config = config
        self.byteHandler = byteHandler

        sessionManager.requestRecordPermission { [weak self] granted in
            guard let self else { return }
            guard granted else {
                completion(.failure(CaptureError.permissionDenied))
                return
            }
            do {
                try self.sessionManager.configure(with: config)
                try self.sessionManager.activate()
            } catch {
                completion(.failure(error))
                return
            }

            self.engine.delegate = self
            self.engine.byteHandler = byteHandler
            do {
                try self.engine.start(with: config)
                self.delegate?.audioCaptureDidStart()
                completion(.success(()))
            } catch {
                completion(.failure(error))
            }
        }
    }

    public func stop() {
        guard engine.isRunning else { return }
        engine.stop()
        sessionManager.deactivate()
        delegate?.audioCaptureDidStop()
    }
}

extension AudioCapture: AudioCaptureEngineDelegate {
    func engine(didOutput buffer: AVAudioPCMBuffer, at time: AVAudioTime) {
        delegate?.audioCapture(didOutput: buffer, at: time)
    }

    func engine(didFail error: Error) {
        delegate?.audioCapture(didFail: error)
    }
}

