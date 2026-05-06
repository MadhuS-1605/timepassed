import SwiftUI

@main
struct TimePassedWallpaperApp: App {
    @StateObject private var settings = Settings()
    @StateObject private var engine: WallpaperEngine

    init() {
        let s = Settings()
        _settings = StateObject(wrappedValue: s)
        _engine = StateObject(wrappedValue: WallpaperEngine(settings: s))
    }

    var body: some Scene {
        MenuBarExtra("TimePassed", systemImage: "circle.grid.3x3.fill") {
            MenuView()
                .environmentObject(settings)
                .environmentObject(engine)
        }
        .menuBarExtraStyle(.window)
    }
}
