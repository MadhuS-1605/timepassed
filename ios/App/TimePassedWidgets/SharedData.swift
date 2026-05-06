import Foundation

/// Tiny helper to read App Group UserDefaults from any widget.
/// Update `appGroup` if you ever rename the group in Xcode.
enum SharedData {
    static let appGroup = "group.com.timepassed.app"

    static var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroup)
    }

    static func string(_ key: String) -> String? {
        defaults?.string(forKey: key)
    }

    static func json(_ key: String) -> [String: Any]? {
        guard let raw = string(key) else { return nil }
        // Capacitor often stores values JSON-encoded with surrounding quotes.
        // Try parsing as a JSON object first; if that fails, return nil.
        guard let data = raw.data(using: .utf8) else { return nil }
        return try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    }

    static func unwrappedString(_ key: String) -> String? {
        guard let raw = string(key) else { return nil }
        // Capacitor JSON-encodes strings as `"value"` — strip the quotes.
        if raw.hasPrefix("\"") && raw.hasSuffix("\"") && raw.count >= 2 {
            return String(raw.dropFirst().dropLast())
        }
        return raw
    }

    static func birthDate() -> Date? {
        guard let iso = unwrappedString("widget_birth_date") else { return nil }
        let f1 = ISO8601DateFormatter()
        f1.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f1.date(from: iso) { return d }
        let f2 = ISO8601DateFormatter()
        if let d = f2.date(from: iso) { return d }
        return nil
    }

    static func accentHex() -> String {
        unwrappedString("widget_year_accent") ?? "#22C55E"
    }
}

extension String {
    /// Convert "#RRGGBB" to (r, g, b) 0..1 floats for SwiftUI Color.
    func rgbComponents() -> (Double, Double, Double) {
        var hex = self.trimmingCharacters(in: .whitespacesAndNewlines)
        if hex.hasPrefix("#") { hex.removeFirst() }
        guard hex.count == 6, let value = UInt32(hex, radix: 16) else {
            return (0.13, 0.77, 0.37) // default green
        }
        let r = Double((value >> 16) & 0xFF) / 255.0
        let g = Double((value >> 8) & 0xFF) / 255.0
        let b = Double(value & 0xFF) / 255.0
        return (r, g, b)
    }
}
