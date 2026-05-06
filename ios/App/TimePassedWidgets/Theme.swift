import SwiftUI

enum WidgetTheme {
    static var bg: Color { Color(red: 0.02, green: 0.02, blue: 0.02) }
    static var bgSoft: Color { Color(white: 0.06) }
    static var textPrimary: Color { Color.white }
    static var textSecondary: Color { Color(white: 0.63) }
    static var emptyDot: Color { Color.white.opacity(0.10) }

    static var accent: Color {
        let hex = SharedData.accentHex()
        let (r, g, b) = hex.rgbComponents()
        return Color(red: r, green: g, blue: b)
    }
}

/// Background that mirrors the static + live wallpaper renderers:
/// solid bg + soft accent radial gradient in the upper right.
struct WidgetBackground: View {
    var body: some View {
        ZStack {
            WidgetTheme.bg
            RadialGradient(
                gradient: Gradient(colors: [
                    WidgetTheme.accent.opacity(0.25),
                    WidgetTheme.bg.opacity(0)
                ]),
                center: UnitPoint(x: 0.85, y: 0.10),
                startRadius: 0,
                endRadius: 220
            )
        }
    }
}
