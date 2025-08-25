// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AudioCapture",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v13)
    ],
    products: [
        .library(
            name: "AudioCapture",
            targets: ["AudioCapture"]
        )
    ],
    targets: [
        .target(
            name: "AudioCapture",
            path: "Sources/AudioCapture",
            linkerSettings: [
                .linkedFramework("AVFoundation"),
                .linkedFramework("AudioToolbox")
            ]
        ),
        .testTarget(
            name: "AudioCaptureTests",
            dependencies: ["AudioCapture"],
            path: "Tests/AudioCaptureTests"
        )
    ]
)

