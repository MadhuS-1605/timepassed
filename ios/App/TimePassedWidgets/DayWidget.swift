import WidgetKit
import SwiftUI

struct DayEntry: TimelineEntry {
    let date: Date
}

struct DayProvider: TimelineProvider {
    func placeholder(in context: Context) -> DayEntry { DayEntry(date: Date()) }
    func getSnapshot(in context: Context, completion: @escaping (DayEntry) -> Void) {
        completion(DayEntry(date: Date()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<DayEntry>) -> Void) {
        let now = Date()
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: now) ?? now
        completion(Timeline(entries: [DayEntry(date: now)], policy: .after(next)))
    }
}

struct DayWidgetView: View {
    let entry: DayEntry

    var body: some View {
        let cal = Calendar.current
        let hour = cal.component(.hour, from: entry.date)
        let minute = cal.component(.minute, from: entry.date)
        let frac = Double(hour) + Double(minute) / 60.0
        let pct = frac / 24.0 * 100

        ZStack {
            WidgetBackground()
            VStack(alignment: .leading, spacing: 6) {
                Text("TODAY")
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(2)
                    .foregroundColor(WidgetTheme.textSecondary)
                Text(entry.date, style: .date)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(WidgetTheme.textPrimary)
                Spacer()
                HourGrid(currentHour: hour)
                    .frame(maxWidth: .infinity)
                Spacer()
                Text(String(format: "%.1f%%", pct))
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundColor(WidgetTheme.accent)
                Text("\(24 - hour - (minute > 0 ? 1 : 0)) hrs left")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(WidgetTheme.textSecondary)
            }
            .padding(14)
        }
    }
}

struct HourGrid: View {
    let currentHour: Int
    let cols = 6
    let rows = 4

    var body: some View {
        VStack(spacing: 5) {
            ForEach(0..<rows, id: \.self) { r in
                HStack(spacing: 5) {
                    ForEach(0..<cols, id: \.self) { c in
                        let i = r * cols + c
                        Circle()
                            .fill(i == currentHour
                                  ? WidgetTheme.accent
                                  : (i < currentHour ? WidgetTheme.accent : WidgetTheme.emptyDot))
                            .frame(width: i == currentHour ? 9 : 7,
                                   height: i == currentHour ? 9 : 7)
                    }
                }
            }
        }
    }
}

struct DayWidget: Widget {
    let kind: String = "DayWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DayProvider()) { entry in
            DayWidgetView(entry: entry)
        }
        .configurationDisplayName("Today")
        .description("24-hour day progress at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
        .containerBackgroundRemovable(false)
    }
}
