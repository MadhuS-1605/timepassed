import WidgetKit
import SwiftUI

struct GoalEntry: TimelineEntry {
    let date: Date
    let title: String?
    let target: Date?
}

struct GoalProvider: TimelineProvider {
    func placeholder(in context: Context) -> GoalEntry {
        GoalEntry(date: Date(), title: "Goal", target: nil)
    }
    func getSnapshot(in context: Context, completion: @escaping (GoalEntry) -> Void) {
        completion(load(now: Date()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<GoalEntry>) -> Void) {
        let entry = load(now: Date())
        let next = Calendar.current.date(byAdding: .hour, value: 6, to: entry.date) ?? entry.date
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func load(now: Date) -> GoalEntry {
        guard let data = SharedData.json("widget_goal") else {
            return GoalEntry(date: now, title: nil, target: nil)
        }
        let title = data["title"] as? String
        let dateStr = data["date"] as? String
        var target: Date? = nil
        if let s = dateStr {
            let f1 = ISO8601DateFormatter()
            f1.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            target = f1.date(from: s)
            if target == nil {
                let f2 = ISO8601DateFormatter()
                target = f2.date(from: s)
            }
        }
        return GoalEntry(date: now, title: title, target: target)
    }
}

struct GoalWidgetView: View {
    let entry: GoalEntry

    var body: some View {
        ZStack {
            WidgetBackground()
            VStack(alignment: .leading, spacing: 4) {
                Text("GOAL")
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(2)
                    .foregroundColor(WidgetTheme.textSecondary)
                if let title = entry.title, let target = entry.target {
                    Text(title)
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundColor(WidgetTheme.textPrimary)
                        .lineLimit(1)
                    Text(target, style: .date)
                        .font(.system(size: 10))
                        .foregroundColor(WidgetTheme.textSecondary)
                    Spacer()
                    let days = max(0, Calendar.current.dateComponents([.day], from: entry.date, to: target).day ?? 0)
                    Text("\(days)")
                        .font(.system(size: 38, weight: .heavy))
                        .foregroundColor(WidgetTheme.accent)
                        .minimumScaleFactor(0.5)
                    Text(days == 1 ? "DAY TO GO" : "DAYS TO GO")
                        .font(.system(size: 9, weight: .bold))
                        .tracking(2)
                        .foregroundColor(WidgetTheme.textSecondary)
                } else {
                    Spacer()
                    Text("Pick a goal")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(WidgetTheme.textPrimary)
                    Text("Open TimePassed → Wallpaper → Goal")
                        .font(.system(size: 9))
                        .foregroundColor(WidgetTheme.textSecondary)
                    Spacer()
                }
            }
            .padding(14)
        }
    }
}

struct GoalWidget: Widget {
    let kind: String = "GoalWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GoalProvider()) { entry in
            GoalWidgetView(entry: entry)
        }
        .configurationDisplayName("Goal Countdown")
        .description("Days until your chosen event.")
        .supportedFamilies([.systemSmall, .systemMedium])
        .containerBackgroundRemovable(false)
    }
}
