import SwiftUI
import ServiceManagement

struct MenuView: View {
    @EnvironmentObject var settings: Settings
    @EnvironmentObject var engine: WallpaperEngine

    @State private var birthDate: Date = Date()
    @State private var goalDate: Date = Date().addingTimeInterval(30 * 86400)

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("TimePassed Wallpaper")
                .font(.headline)

            // Template
            Picker("Template", selection: $settings.template) {
                ForEach(Settings.templates, id: \.0) { id, label in
                    Text(label).tag(id)
                }
            }
            .pickerStyle(.segmented)

            // Accent
            HStack {
                Text("Accent").frame(width: 60, alignment: .leading)
                Picker("", selection: $settings.accent) {
                    ForEach(Settings.accents, id: \.0) { hex, label in
                        Text(label).tag(hex)
                    }
                }
                .labelsHidden()
            }

            // Theme
            HStack {
                Text("Theme").frame(width: 60, alignment: .leading)
                Picker("", selection: $settings.theme) {
                    ForEach(Settings.themes, id: \.0) { id, label in
                        Text(label).tag(id)
                    }
                }
                .labelsHidden()
                .pickerStyle(.segmented)
            }

            // Life unit (only for life template)
            if settings.template == "life" {
                Divider()
                HStack {
                    Text("Life as").frame(width: 60, alignment: .leading)
                    Picker("", selection: $settings.lifeUnit) {
                        ForEach(Settings.lifeUnits, id: \.0) { id, label in
                            Text(label).tag(id)
                        }
                    }
                    .labelsHidden()
                    .pickerStyle(.segmented)
                }
                DatePicker("Birth date", selection: $birthDate, displayedComponents: .date)
                    .onChange(of: birthDate) { _, newValue in
                        let f = ISO8601DateFormatter()
                        f.formatOptions = [.withInternetDateTime]
                        settings.birthDateIso = f.string(from: newValue)
                    }
            }

            // Goal (only for goal template)
            if settings.template == "goal" {
                Divider()
                TextField("Goal title", text: $settings.goalTitle)
                DatePicker("Target date", selection: $goalDate, displayedComponents: .date)
                    .onChange(of: goalDate) { _, newValue in
                        let f = ISO8601DateFormatter()
                        f.formatOptions = [.withInternetDateTime]
                        settings.goalDateIso = f.string(from: newValue)
                    }
            }

            Divider()

            HStack {
                Button {
                    Task { await engine.refresh() }
                } label: {
                    Label("Refresh now", systemImage: "arrow.clockwise")
                }
                Spacer()
                if isBundledApp {
                    Toggle("Open at login", isOn: Binding(
                        get: { SMAppService.mainApp.status == .enabled },
                        set: { setLoginItem(enabled: $0) }
                    ))
                    .toggleStyle(.switch)
                    .controlSize(.small)
                }
            }

            if !isBundledApp {
                Text("Run from /Applications to enable Open at login.")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            Text(engine.status)
                .font(.caption)
                .foregroundStyle(.secondary)

            Divider()

            Button("Quit") { NSApp.terminate(nil) }
                .keyboardShortcut("q")
        }
        .padding(14)
        .frame(width: 320)
        .onAppear {
            if let d = settings.birthDate { birthDate = d }
            if let d = settings.goalDate { goalDate = d }
        }
    }

    private func setLoginItem(enabled: Bool) {
        do {
            if enabled {
                try SMAppService.mainApp.register()
            } else {
                try SMAppService.mainApp.unregister()
            }
        } catch {
            print("Login item toggle failed: \(error)")
        }
    }

    /// `SMAppService.mainApp` only works when the binary is inside a proper
    /// `.app` bundle (i.e. installed in /Applications). Running with
    /// `swift run` puts the binary in `.build/.../debug/` which Apple
    /// rejects with `SMAppServiceErrorDomain Code=22`.
    private var isBundledApp: Bool {
        Bundle.main.bundlePath.hasSuffix(".app")
    }
}
