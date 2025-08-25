import Foundation

final class WAVFileWriter {
    enum WAVError: Error {
        case createFailed
        case ioFailure
    }

    private let handle: FileHandle
    private let sampleRate: UInt32
    private let channels: UInt16
    private let bitsPerSample: UInt16
    private let audioFormatCode: UInt16 // 1 = PCM, 3 = IEEE float
    private var dataBytesWritten: UInt32 = 0

    init(url: URL, sampleRate: UInt32, channels: UInt16, format: AudioSampleFormat) throws {
        self.sampleRate = sampleRate
        self.channels = channels
        switch format {
        case .int16:
            self.bitsPerSample = 16
            self.audioFormatCode = 1
        case .float32:
            self.bitsPerSample = 32
            self.audioFormatCode = 3
        }

        let dir = url.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        FileManager.default.createFile(atPath: url.path, contents: nil)
        guard let h = FileHandle(forWritingAtPath: url.path) else { throw WAVError.createFailed }
        self.handle = h
        try writeHeaderPlaceholder()
    }

    func append(data: Data) {
        do {
            try handle.write(contentsOf: data)
            dataBytesWritten &+= UInt32(data.count)
        } catch {
            // best-effort; cannot throw on realtime path
        }
    }

    func finish() {
        do {
            try finalizeHeader()
            try handle.synchronize()
            try handle.close()
        } catch {
            // ignore
        }
    }

    private func writeHeaderPlaceholder() throws {
        let byteRate = sampleRate * UInt32(channels) * UInt32(bitsPerSample / 8)
        let blockAlign = UInt16(channels) * UInt16(bitsPerSample / 8)

        var header = Data()
        header.append(contentsOf: Array("RIFF".utf8))
        header.append(UInt32(0).littleEndianData) // file size - 8 (placeholder)
        header.append(contentsOf: Array("WAVE".utf8))

        header.append(contentsOf: Array("fmt ".utf8))
        header.append(UInt32(16).littleEndianData) // PCM fmt chunk size
        header.append(audioFormatCode.littleEndianData)
        header.append(channels.littleEndianData)
        header.append(sampleRate.littleEndianData)
        header.append(byteRate.littleEndianData)
        header.append(blockAlign.littleEndianData)
        header.append(bitsPerSample.littleEndianData)

        header.append(contentsOf: Array("data".utf8))
        header.append(UInt32(0).littleEndianData) // data chunk size placeholder

        try handle.write(contentsOf: header)
    }

    private func finalizeHeader() throws {
        let dataChunkSize = dataBytesWritten
        let riffSize = 36 + dataChunkSize // file size - 8

        try handle.seek(toOffset: 4)
        try handle.write(contentsOf: riffSize.littleEndianData)

        try handle.seek(toOffset: 40)
        try handle.write(contentsOf: dataChunkSize.littleEndianData)
    }
}

private extension FixedWidthInteger {
    var littleEndianData: Data {
        var le = self.littleEndian
        return Data(bytes: &le, count: MemoryLayout<Self>.size)
    }
}

