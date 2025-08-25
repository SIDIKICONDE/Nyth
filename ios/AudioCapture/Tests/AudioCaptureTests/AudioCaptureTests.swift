import XCTest
@testable import AudioCapture

final class AudioCaptureTests: XCTestCase {
    func testInit() {
        _ = AudioCapture()
        XCTAssertTrue(true)
    }
}

