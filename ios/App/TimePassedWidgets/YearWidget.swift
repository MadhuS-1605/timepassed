import WidgetKit
import SwiftUI

struct YearEntry: TimelineEntry {
    let date: Date
}

struct YearProvider: TimelineProvider {
    func placeholder(in context: Context) -> YearEntry { YearEntry(date: Date()) }
    func getSnapshot(in context: Context, completion: @escaping (YearEntry) -> Void) {
        completion(YearEntry(date: Date()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<YearEntry>) -> Void) {
        // refresh every hour
        let now = Date()
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: now) ?? now
        completion(Timeline(entries: [YearEntry(date: now)], policy: .after(next)))
    }
}

struct YearWidgetView: View {
    let entry: YearEntry

    var stats: (year: Int, dayOfYear: Int, totalDays: Int, percentage: Double) {
        let cal = Calendar.current
        let year = cal.component(.year, from: entry.date)
        let start = cal.date(from: DateComponents(year: year, month: 1, day: 1))!
        let end = cal.date(from: DateComponents(year: year + 1, month: 1, day: 1))!
        let totalDays = cal.dateComponents([.day], from: start, to: end).day ?? 365
        let dayOfYear = (cal.dateComponents([.day], from: start, to: entry.date).day ?? 0) + 1
        let pct = Double(entry.date.timeIntervalSince(start) / end.timeIntervalSince(start)) * 100
        return (year, min(dayOfYear, totalDays), totalDays, pct)
    }

    var body: some View {
        let s = stats
        ZStack {
            WidgetBackground()
            VStack(alignment: .leading, spacing: 4) {
                Text("\(String(s.year))")
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundColor(WidgetTheme.textPrimary)
                Text("YEAR PROGRESS")
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(2)
                    .foregroundColor(WidgetTheme.textSecondary)
                Spacer()
                Text(String(format: "%.4f%%", s.percentage))
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundColor(WidgetTheme.accent)
                    .minimumScaleFactor(0.6)
                Text("\(s.dayOfYear) / \(s.totalDays) days")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(WidgetTheme.textSecondary)
                ProgressBar(value: s.percentage / 100)
                    .frame(height: 5)
            }
            .padding(14)
        }
    }
}

struct ProgressBar: View {
    let value: Double
    var body: some View {
        GeometryReader { g in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.08))
                Capsule().fill(WidgetTheme.accent)
                    .frame(width: g.size.width * CGFloat(min(max(value, 0), 1)))
            }
        }
    }
}

struct YearWidget: Widget {
    let kind: String = "YearWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: YearProvider()) { entry in
            YearWidgetView(entry: entry)
        }
        .configurationDisplayName("Year Progress")
        .description("How much of the year has passed.")
        .supportedFamilies([.systemSmall, .systemMedium])
        .containerBackgroundRemovable(false)
    }
}
