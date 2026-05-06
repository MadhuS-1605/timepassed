import AppKit
import Combine

@MainActor
final class WallpaperEngine: ObservableObject {
    private let settings: Settings
    private var timer: AnyCancellable?
    private var settingsCancellable: AnyCancellable?
    @Published var lastUpdate: Date?
    @Published var status: String = "Ready"

    init(settings: Settings) {
        self.settings = settings
        startTimer()
        // re-render when any setting changes
        settingsCancellable = settings.objectWillChange.sink { [weak self] _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                Task { await self?.refresh() }
            }
        }
    }

    func startTimer() {
        timer?.cancel()
        timer = Timer.publish(every: 60, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                Task { await self?.refresh() }
            }
        Task { await refresh() }
    }

    func refresh() async {
        let renderer = WallpaperRenderer(settings: settings)
        guard let image = renderer.render() else {
            status = "Render failed"
            return
        }
        guard let url = save(image: image) else {
            status = "Save failed"
            return
        }
        for screen in NSScreen.screens {
            do {
                try NSWorkspace.shared.setDesktopImageURL(url, for: screen, options: [:])
            } catch {
                status = "Set wallpaper failed: \(error.localizedDescription)"
                return
            }
        }
        lastUpdate = Date()
        let f = DateFormatter()
        f.dateStyle = .none
        f.timeStyle = .short
        status = "Updated at \(f.string(from: Date()))"
    }

    private func save(image: NSImage) -> URL? {
        guard let tiff = image.tiffRepresentation,
              let rep = NSBitmapImageRep(data: tiff),
              let png = rep.representation(using: .png, properties: [:]) else {
            return nil
        }
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let dir = support.appendingPathComponent("TimePassed")
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        // fresh filename each time so macOS bypasses its image cache
        let url = dir.appendingPathComponent("wallpaper-\(Int(Date().timeIntervalSince1970)).png")
        do {
            try png.write(to: url)
            cleanOld(in: dir, except: url)
            return url
        } catch {
            return nil
        }
    }

    private func cleanOld(in dir: URL, except: URL) {
        guard let urls = try? FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil) else { return }
        for u in urls where u != except && u.lastPathComponent.hasPrefix("wallpaper-") {
            try? FileManager.default.removeItem(at: u)
        }
    }
}
