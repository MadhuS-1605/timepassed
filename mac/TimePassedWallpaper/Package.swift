// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "TimePassedWallpaper",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "TimePassedWallpaper", targets: ["TimePassedWallpaper"])
    ],
    targets: [
        .executableTarget(
            name: "TimePassedWallpaper",
            path: "Sources/TimePassedWallpaper"
        )
    ]
)
