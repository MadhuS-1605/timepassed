import WidgetKit
import SwiftUI

struct LifeEntry: TimelineEntry {
    let date: Date
    let birth: Date?
}

struct LifeProvider: TimelineProvider {
    func placeholder(in context: Context) -> LifeEntry {
        LifeEntry(date: Date(), birth: nil)
    }
    func getSnapshot(in context: Context, completion: @escaping (LifeEntry) -> Void) {
        completion(LifeEntry(date: Date(), birth: SharedData.birthDate()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<LifeEntry>) -> Void) {
        let now = Date()
        let entry = LifeEntry(date: now, birth: SharedData.birthDate())
        // refresh once a day
        let next = Calendar.current.date(byAdding: .hour, value: 6, to: now) ?? now
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

struct LifeWidgetView: View {
    let entry: LifeEntry
    let lifeExpectancy = 80

    var body: some View {
        ZStack {
            WidgetBackground()
            if let birth = entry.birth {
                let totalWeeks = lifeExpectancy * 52
                let weeksLived = max(0, min(totalWeeks,
                    Int(entry.date.timeIntervalSince(birth) / (7 * 86400))))
                let pct = Double(weeksLived) / Double(totalWeeks) * 100

                VStack(alignment: .leading, spacing: 4) {
                    Text("LIFE")
                        .font(.system(size: 9, weight: .semibold))
                        .tracking(3)
                        .foregroundColor(WidgetTheme.textSecondary)
                    Text("\(weeksLived) / \(totalWeeks) weeks")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(WidgetTheme.textPrimary)
                    LifeGrid(filled: weeksLived, total: totalWeeks)
                        .padding(.vertical, 4)
                    Spacer()
                    Text(String(format: "%.1f%%", pct))
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundColor(WidgetTheme.accent)
                }
                .padding(14)
            } else {
                VStack(spacing: 6) {
                    Text("Set your birth date")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(WidgetTheme.textPrimary)
                        .multilineTextAlignment(.center)
                    Text("Open TimePassed → Life")
                        .font(.system(size: 11))
                        .foregroundColor(WidgetTheme.textSecondary)
                }
                .padding(14)
            }
        }
    }
}

struct LifeGrid: View {
    let filled: Int
    let total: Int
    let cols = 52

    var body: some View {
        let rows = Int(ceil(Double(total) / Double(cols)))
        GeometryReader { g in
            let cellW = g.size.width / CGFloat(cols)
            let cellH = g.size.height / CGFloat(rows)
            let size = min(cellW, cellH)
            let dot = size * 0.6
            VStack(spacing: cellH - dot) {
                ForEach(0..<rows, id: \.self) { r in
                    HStack(spacing: cellW - dot) {
                        ForEach(0..<cols, id: \.self) { c in
                            let i = r * cols + c
                            Circle()
                                .fill(i < filled ? WidgetTheme.accent : WidgetTheme.emptyDot)
                                .frame(width: dot, height: dot)
                        }
                    }
                }
            }
        }
    }
}

struct LifeWidget: Widget {
    let kind: String = "LifeWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LifeProvider()) { entry in
            LifeWidgetView(entry: entry)
        }
        .configurationDisplayName("Life Calendar")
        .description("Your life in weeks. Memento mori.")
        .supportedFamilies([.systemMedium, .systemLarge])
        .containerBackgroundRemovable(false)
    }
}
