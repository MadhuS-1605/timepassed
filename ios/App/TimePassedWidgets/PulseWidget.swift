import WidgetKit
import SwiftUI

struct PulseEntry: TimelineEntry {
    let date: Date
    let logged: Bool
    let skipped: Bool
    let emoji: String
    let label: String
    let streak: Int
    let moodHex: String
}

struct PulseProvider: TimelineProvider {
    func placeholder(in context: Context) -> PulseEntry {
        PulseEntry(date: Date(), logged: false, skipped: false,
                   emoji: "·", label: "LOG TODAY", streak: 0, moodHex: "#22C55E")
    }
    func getSnapshot(in context: Context, completion: @escaping (PulseEntry) -> Void) {
        completion(load(now: Date()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<PulseEntry>) -> Void) {
        let entry = load(now: Date())
        // mood doesn't change often; refresh every hour to pick up new logs
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: entry.date) ?? entry.date
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func load(now: Date) -> PulseEntry {
        guard let data = SharedData.json("widget_pulse") else {
            return PulseEntry(date: now, logged: false, skipped: false,
                              emoji: "·", label: "LOG TODAY", streak: 0,
                              moodHex: "#22C55E")
        }
        let logged = (data["logged"] as? Bool) ?? false
        let skipped = (data["skipped"] as? Bool) ?? false
        let streak = (data["streak"] as? Int) ?? 0
        let emoji = (data["emoji"] as? String) ?? ""
        let label = (data["label"] as? String) ?? ""
        let color = (data["color"] as? String) ?? "#22C55E"
        return PulseEntry(
            date: now,
            logged: logged,
            skipped: skipped,
            emoji: logged ? emoji : "·",
            label: skipped ? "SKIPPED" : (logged ? label.uppercased() : "LOG TODAY"),
            streak: streak,
            moodHex: color
        )
    }
}

struct PulseWidgetView: View {
    let entry: PulseEntry

    var moodColor: Color {
        let (r, g, b) = entry.moodHex.rgbComponents()
        return Color(red: r, green: g, blue: b)
    }

    var body: some View {
        ZStack {
            WidgetBackground()
            VStack(spacing: 6) {
                Text("DAILY PULSE")
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(2)
                    .foregroundColor(WidgetTheme.textSecondary)
                Text(entry.emoji)
                    .font(.system(size: 36))
                    .foregroundColor(entry.logged ? .black : WidgetTheme.textPrimary)
                    .padding(8)
                    .background(
                        Circle().fill(entry.logged ? moodColor : Color.white.opacity(0.06))
                    )
                Text(entry.label)
                    .font(.system(size: 12, weight: .heavy))
                    .tracking(1)
                    .foregroundColor(WidgetTheme.textPrimary)
                Spacer(minLength: 0)
                HStack(spacing: 12) {
                    HStack(spacing: 2) {
                        Text("🔥")
                        Text("\(entry.streak)")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color.orange)
                    }
                    Text("·").foregroundColor(WidgetTheme.textSecondary)
                    Text(yearPctString())
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(WidgetTheme.accent)
                }
            }
            .padding(14)
        }
    }

    private func yearPctString() -> String {
        let cal = Calendar.current
        let year = cal.component(.year, from: entry.date)
        let start = cal.date(from: DateComponents(year: year, month: 1, day: 1))!
        let end = cal.date(from: DateComponents(year: year + 1, month: 1, day: 1))!
        let pct = entry.date.timeIntervalSince(start) / end.timeIntervalSince(start) * 100
        return String(format: "%.1f%%", pct)
    }
}

struct PulseWidget: Widget {
    let kind: String = "PulseWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PulseProvider()) { entry in
            PulseWidgetView(entry: entry)
        }
        .configurationDisplayName("Daily Pulse")
        .description("Today's mood, streak, and year %.")
        .supportedFamilies([.systemSmall])
        .containerBackgroundRemovable(false)
    }
}
