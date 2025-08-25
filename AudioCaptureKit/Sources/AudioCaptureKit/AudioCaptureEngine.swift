import Foundation
import AVFoundation

protocol AudioCaptureEngineDelegate: AnyObject {
    func engine(didOutput buffer: AVAudioPCMBuffer, at time: AVAudioTime)
    func engine(didFail error: Error)
}

final class AudioCaptureEngine {
    enum EngineError: Error {
        case couldNotStart
        case invalidFormat
    }

    weak var delegate: AudioCaptureEngineDelegate?
    var byteHandler: ByteChunkHandler?

    private let engine = AVAudioEngine()
    private var config: AudioCaptureConfig = AudioCaptureConfig()
    private var desiredTapFormat: AVAudioFormat?
    private var tapInstalled: Bool = false
    private var observers: [NSObjectProtocol] = []
    private var writer: WAVFileWriter?
    private let writerQueue = DispatchQueue(label: "AudioCaptureKit.WAVWriter")

    var isRunning: Bool { engine.isRunning }

    func start(with config: AudioCaptureConfig) throws {
        self.config = config

        let input = engine.inputNode
        let hwFormat = input.inputFormat(forBus: 0)

        // Use float32 non-interleaved for tap for predictable conversion
        guard let tapFormat = AVAudioFormat(
            commonFormat: .pcmFormatFloat32,
            sampleRate: config.sampleRate > 0 ? config.sampleRate : hwFormat.sampleRate,
            channels: AVAudioChannelCount(config.channelCount),
            interleaved: false
        ) else {
            throw EngineError.invalidFormat
        }
        self.desiredTapFormat = tapFormat

        if tapInstalled {
            input.removeTap(onBus: 0)
            tapInstalled = false
        }

        let bufferSize: AVAudioFrameCount = config.framesPerBuffer.map { AVAudioFrameCount($0) } ?? 1024

        input.installTap(onBus: 0, bufferSize: bufferSize, format: tapFormat) { [weak self] buffer, time in
            guard let self else { return }

            self.delegate?.engine(didOutput: buffer, at: time)

            // Convert to requested format and interleaving
            let targetChannels = Int(self.config.channelCount)
            let data: Data
            switch self.config.sampleFormat {
            case .float32:
                data = PCMConverter.interleavedBytes(from: buffer, targetChannels: targetChannels, as: .float32)
            case .int16:
                data = PCMConverter.interleavedBytes(from: buffer, targetChannels: targetChannels, as: .int16)
            }

            // Timestamp in nanoseconds
            let hostTime = time.hostTime
            let seconds: Double
            if hostTime != 0 {
                seconds = AVAudioTime.seconds(forHostTime: hostTime)
            } else if let sampleRate = self.desiredTapFormat?.sampleRate, time.sampleTime != 0 {
                seconds = Double(time.sampleTime) / sampleRate
            } else {
                seconds = CACurrentMediaTime()
            }
            let timestampNs = UInt64(seconds * 1_000_000_000)

            data.withUnsafeBytes { rawBuf in
                guard let base = rawBuf.baseAddress else { return }
                self.byteHandler?(base.assumingMemoryBound(to: UInt8.self), rawBuf.count, timestampNs)
            }

            if let writer = self.writer {
                let copy = data // copy to extend lifetime off realtime thread
                self.writerQueue.async {
                    writer.append(data: copy)
                }
            }
        }
        tapInstalled = true

        if let url = config.outputURL {
            writer = try? WAVFileWriter(
                url: url,
                sampleRate: UInt32(tapFormat.sampleRate.rounded()),
                channels: UInt16(config.channelCount),
                format: config.sampleFormat
            )
        } else {
            writer = nil
        }

        addObservers()

        engine.prepare()
        do {
            try engine.start()
        } catch {
            removeObservers()
            input.removeTap(onBus: 0)
            tapInstalled = false
            throw EngineError.couldNotStart
        }
    }

    func stop() {
        if tapInstalled {
            engine.inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }
        engine.stop()
        writerQueue.sync { [writer] in
            writer?.finish()
        }
        writer = nil
        removeObservers()
    }

    private func addObservers() {
        let center = NotificationCenter.default
        let intObs = center.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: nil,
            queue: .main
        ) { [weak self] note in
            self?.handleInterruption(note: note)
        }
        let routeObs = center.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] note in
            self?.handleRouteChange(note: note)
        }
        observers = [intObs, routeObs]
    }

    private func removeObservers() {
        for obs in observers { NotificationCenter.default.removeObserver(obs) }
        observers.removeAll()
    }

    private func handleInterruption(note: Notification) {
        guard let info = note.userInfo,
              let typeVal = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeVal) else { return }

        switch type {
        case .began:
            engine.pause()
        case .ended:
            let optsVal = info[AVAudioSessionInterruptionOptionKey] as? UInt
            let opts = AVAudioSession.InterruptionOptions(rawValue: optsVal ?? 0)
            if opts.contains(.shouldResume) {
                do { try engine.start() } catch { delegate?.engine(didFail: error) }
            }
        @unknown default:
            break
        }
    }

    private func handleRouteChange(note: Notification) {
        guard let info = note.userInfo,
              let reasonVal = info[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonVal) else { return }
        switch reason {
        case .oldDeviceUnavailable, .newDeviceAvailable, .categoryChange:
            // Restart engine to adapt to new route
            engine.pause()
            do { try engine.start() } catch { delegate?.engine(didFail: error) }
        default:
            break
        }
    }
}

