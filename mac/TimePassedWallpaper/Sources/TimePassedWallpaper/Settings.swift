import SwiftUI
import Combine

final class Settings: ObservableObject {
    @AppStorage("template") var template: String = "year"
    @AppStorage("accent") var accent: String = "#22C55E"
    @AppStorage("theme") var theme: String = "dark"
    @AppStorage("lifeUnit") var lifeUnit: String = "weeks"
    @AppStorage("birthDateIso") var birthDateIso: String = ""
    @AppStorage("goalTitle") var goalTitle: String = ""
    @AppStorage("goalDateIso") var goalDateIso: String = ""

    static let templates = [
        ("year", "Year"),
        ("life", "Life"),
        ("day", "Day"),
        ("goal", "Goal"),
    ]

    static let accents = [
        ("#22C55E", "Green"),
        ("#FBBF24", "Amber"),
        ("#3B82F6", "Blue"),
        ("#8B5CF6", "Purple"),
        ("#F43F5E", "Rose"),
    ]

    static let themes = [
        ("dark", "Dark"),
        ("light", "Light"),
    ]

    static let lifeUnits = [
        ("years", "Years"),
        ("months", "Months"),
        ("weeks", "Weeks"),
    ]

    var birthDate: Date? {
        guard !birthDateIso.isEmpty else { return nil }
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f.date(from: birthDateIso) ?? ISO8601DateFormatter().date(from: birthDateIso)
    }

    var goalDate: Date? {
        guard !goalDateIso.isEmpty else { return nil }
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f.date(from: goalDateIso) ?? ISO8601DateFormatter().date(from: goalDateIso)
    }
}
