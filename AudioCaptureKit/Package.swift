// swift-tools-version:5.7
import PackageDescription

let package = Package(
    name: "AudioCaptureKit",
    platforms: [
        .iOS(.v13)
    ],
    products: [
        .library(
            name: "AudioCaptureKit",
            targets: ["AudioCaptureKit"]
        )
    ],
    targets: [
        .target(
            name: "AudioCaptureKit",
            path: "Sources/AudioCaptureKit"
        ),
        .testTarget(
            name: "AudioCaptureKitTests",
            dependencies: ["AudioCaptureKit"],
            path: "Tests/AudioCaptureKitTests"
        )
    ]
)

