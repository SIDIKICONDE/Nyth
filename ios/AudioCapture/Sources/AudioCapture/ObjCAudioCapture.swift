import Foundation
#if canImport(AVFoundation) && os(iOS)
import AVFoundation

@objc public protocol ObjCAudioCaptureDelegate: AnyObject {
    @objc optional func audioCaptureDidStart(_ capture: ObjCAudioCapture, fileURL: NSURL?)
    @objc optional func audioCapture(_ capture: ObjCAudioCapture, didFailWithError error: NSError)
    @objc optional func audioCapture(_ capture: ObjCAudioCapture, didFinishRecordingTo fileURL: NSURL)
}

@objcMembers
public final class ObjCAudioCapture: NSObject, AudioCaptureDelegate {
    private let capture = AudioCapture()
    public weak var delegate: ObjCAudioCaptureDelegate?

    public override init() {
        super.init()
        capture.delegate = self
    }

    public var isRecording: Bool { capture.isRecording }
    public var currentFileURL: NSURL? { capture.currentFileURL as NSURL? }

    public func requestRecordPermission(_ completion: @escaping (Bool) -> Void) {
        capture.requestRecordPermission(completion: completion)
    }

    public func startWithOptions(_ options: [String: Any]?, completion: ((Bool, NSError?) -> Void)? = nil) {
        let config = Self.makeConfig(from: options)
        capture.start(config: config, outputFileURL: optionsFileURL(options)) { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let url):
                completion?(true, nil)
                self.delegate?.audioCaptureDidStart?(self, fileURL: url as NSURL?)
            case .failure(let error):
                completion?(false, error as NSError)
                self.delegate?.audioCapture?(self, didFailWithError: error as NSError)
            }
        }
    }

    public func stop() {
        capture.stop()
    }

    // MARK: - AudioCaptureDelegate
    public func audioCapture(_ capture: AudioCapture, didFinishRecordingTo fileURL: URL) {
        delegate?.audioCapture?(self, didFinishRecordingTo: fileURL as NSURL)
    }

    public func audioCapture(_ capture: AudioCapture, didFail error: Error) {
        delegate?.audioCapture?(self, didFailWithError: error as NSError)
    }

    // Optional buffer callback not bridged for simplicity
    public func audioCapture(_ capture: AudioCapture, didCapture buffer: AVAudioPCMBuffer, at time: AVAudioTime) {}
    public func audioCaptureWasInterrupted(_ capture: AudioCapture) {}
    public func audioCaptureInterruptionEnded(_ capture: AudioCapture, shouldResume: Bool) {}

    private static func makeConfig(from options: [String: Any]?) -> AudioCaptureConfig {
        var config = AudioCaptureConfig()
        if let o = options {
            if let sr = o["sampleRate"] as? Double { config.preferredSampleRate = sr }
            if let ch = o["channels"] as? Int { config.channelCount = AVAudioChannelCount(ch) }
            if let write = o["writeToFile"] as? Bool { config.writeToFile = write }
            if let format = o["fileFormat"] as? String {
                switch format.lowercased() {
                case "wav": config.fileFormat = .wavPCM16
                case "m4a", "aac": config.fileFormat = .m4aAAC
                default: config.fileFormat = .cafPCM16
                }
            }
            var opts: AVAudioSession.CategoryOptions = [.defaultToSpeaker]
            if let allowBT = o["allowBluetooth"] as? Bool, allowBT { opts.insert(.allowBluetooth) }
            if let allowA2DP = o["allowBluetoothA2DP"] as? Bool, allowA2DP { opts.insert(.allowBluetoothA2DP) }
            if let mix = o["mixWithOthers"] as? Bool, mix { opts.insert(.mixWithOthers) }
            config.options = opts
        }
        return config
    }

    private func optionsFileURL(_ options: [String: Any]?) -> URL? {
        guard let o = options, let path = o["outputPath"] as? String else { return nil }
        return URL(fileURLWithPath: path)
    }
}
#else
import Foundation
@objcMembers
public final class ObjCAudioCapture: NSObject {}
#endif

