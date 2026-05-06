import AppKit

/// Renders the dot-grid wallpaper templates to an NSImage.
/// Mirrors the logic in src/lib/wallpaperRenderers.js and YearWallpaperService.java.
struct WallpaperRenderer {
    let settings: Settings
    let width: CGFloat = 2880
    let height: CGFloat = 1800

    func render() -> NSImage? {
        let size = NSSize(width: width, height: height)
        let image = NSImage(size: size)
        image.lockFocus()
        defer { image.unlockFocus() }

        let isDark = settings.theme != "light"
        let bg = isDark
            ? NSColor(red: 0.020, green: 0.020, blue: 0.020, alpha: 1)
            : NSColor(red: 0.973, green: 0.980, blue: 0.988, alpha: 1)
        let textPrimary = isDark ? NSColor.white : NSColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1)
        let textSecondary = isDark ? NSColor(white: 0.63, alpha: 1) : NSColor(red: 0.28, green: 0.34, blue: 0.42, alpha: 1)
        let emptyDot = isDark ? NSColor.white.withAlphaComponent(0.08) : NSColor.black.withAlphaComponent(0.10)
        let accent = NSColor(hex: settings.accent) ?? NSColor(red: 0.13, green: 0.77, blue: 0.37, alpha: 1)

        bg.setFill()
        NSRect(origin: .zero, size: size).fill()

        // soft accent radial gradient in the upper right
        let grad = NSGradient(colors: [accent.withAlphaComponent(0.22), bg.withAlphaComponent(0)])
        grad?.draw(
            fromCenter: NSPoint(x: width * 0.85, y: height * 0.90),
            radius: 0,
            toCenter: NSPoint(x: width * 0.5, y: height * 0.5),
            radius: width * 0.7,
            options: []
        )

        switch settings.template {
        case "life":  drawLife(textPrimary: textPrimary, textSecondary: textSecondary, accent: accent, emptyDot: emptyDot)
        case "day":   drawDay(textPrimary: textPrimary, textSecondary: textSecondary, accent: accent, emptyDot: emptyDot)
        case "goal":  drawGoal(textPrimary: textPrimary, textSecondary: textSecondary, accent: accent, emptyDot: emptyDot)
        default:      drawYear(textPrimary: textPrimary, textSecondary: textSecondary, accent: accent, emptyDot: emptyDot)
        }

        drawText("TIMEPASSED", at: NSPoint(x: width / 2, y: 80), size: 28, color: textSecondary, weight: .bold, kerning: 14, align: .center)
        return image
    }

    // MARK: - Year

    private func drawYear(textPrimary: NSColor, textSecondary: NSColor, accent: NSColor, emptyDot: NSColor) {
        let cal = Calendar.current
        let now = Date()
        let year = cal.component(.year, from: now)
        let start = cal.date(from: DateComponents(year: year, month: 1, day: 1))!
        let end = cal.date(from: DateComponents(year: year + 1, month: 1, day: 1))!
        let totalDays = cal.dateComponents([.day], from: start, to: end).day ?? 365
        let dayOfYear = (cal.dateComponents([.day], from: start, to: now).day ?? 0) + 1
        let pct = now.timeIntervalSince(start) / end.timeIntervalSince(start) * 100

        drawText(String(year), at: NSPoint(x: width / 2, y: height * 0.85), size: 240, color: textPrimary, weight: .black, kerning: 8)
        drawText("YEAR PROGRESS", at: NSPoint(x: width / 2, y: height * 0.78), size: 36, color: textSecondary, weight: .semibold, kerning: 14)

        let cols = 19
        let rows = Int(ceil(Double(totalDays) / Double(cols)))
        let gridTop = height * 0.32
        let gridBottom = height * 0.66
        drawGrid(
            count: totalDays,
            filled: dayOfYear,
            cols: cols, rows: rows,
            top: gridTop, bottom: gridBottom,
            accent: accent, emptyDot: emptyDot,
            dotRatio: 0.34
        )

        drawText(String(format: "%.2f%%", pct), at: NSPoint(x: width / 2, y: height * 0.18), size: 180, color: accent, weight: .black)
        drawText("\(dayOfYear) of \(totalDays) days", at: NSPoint(x: width / 2, y: height * 0.12), size: 32, color: textSecondary, weight: .medium, kerning: 4)
    }

    // MARK: - Life

    private func drawLife(textPrimary: NSColor, textSecondary: NSColor, accent: NSColor, emptyDot: NSColor) {
        guard let birth = settings.birthDate else {
            drawText("Set your birth date", at: NSPoint(x: width / 2, y: height * 0.55), size: 80, color: textPrimary, weight: .bold)
            drawText("TimePassed → Open at Login → Birth Date", at: NSPoint(x: width / 2, y: height * 0.48), size: 36, color: textSecondary, weight: .regular)
            return
        }

        let lifeExp = 80
        let unit = settings.lifeUnit
        let now = Date()
        let cols: Int
        let perYear: Int
        let unitLabel: String
        let dotRatio: CGFloat
        let cellsLived: Int
        switch unit {
        case "years":
            cols = 10; perYear = 1; unitLabel = "years"; dotRatio = 0.42
            cellsLived = Int(now.timeIntervalSince(birth) / (365.25 * 86400))
        case "months":
            cols = 12; perYear = 12; unitLabel = "months"; dotRatio = 0.40
            let comps = Calendar.current.dateComponents([.month], from: birth, to: now)
            cellsLived = comps.month ?? 0
        default:
            cols = 52; perYear = 52; unitLabel = "weeks"; dotRatio = 0.36
            cellsLived = Int(now.timeIntervalSince(birth) / (7 * 86400))
        }
        let totalCells = lifeExp * perYear
        let lived = max(0, min(totalCells, cellsLived))
        let pct = Double(lived) / Double(totalCells) * 100
        let rows = Int(ceil(Double(totalCells) / Double(cols)))

        drawText("LIFE", at: NSPoint(x: width / 2, y: height * 0.88), size: 36, color: textSecondary, weight: .semibold, kerning: 14)
        drawText("\(lifeExp) years · \(totalCells) \(unitLabel)", at: NSPoint(x: width / 2, y: height * 0.83), size: 30, color: textSecondary, weight: .medium)

        drawGrid(
            count: totalCells, filled: lived,
            cols: cols, rows: rows,
            top: height * 0.30, bottom: height * 0.78,
            accent: accent, emptyDot: emptyDot,
            dotRatio: dotRatio
        )

        drawText(String(format: "%.1f%%", pct), at: NSPoint(x: width / 2, y: height * 0.18), size: 180, color: accent, weight: .black)
        drawText("\(lived) \(unitLabel.uppercased()) LIVED", at: NSPoint(x: width / 2, y: height * 0.12), size: 30, color: textSecondary, weight: .medium, kerning: 4)
    }

    // MARK: - Day

    private func drawDay(textPrimary: NSColor, textSecondary: NSColor, accent: NSColor, emptyDot: NSColor) {
        let cal = Calendar.current
        let now = Date()
        let hour = cal.component(.hour, from: now)
        let minute = cal.component(.minute, from: now)
        let pct = (Double(hour) + Double(minute) / 60) / 24 * 100

        drawText("TODAY", at: NSPoint(x: width / 2, y: height * 0.88), size: 36, color: textSecondary, weight: .semibold, kerning: 14)
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMM d"
        drawText(f.string(from: now).uppercased(), at: NSPoint(x: width / 2, y: height * 0.83), size: 36, color: textPrimary, weight: .bold, kerning: 4)

        let cols = 6
        let rows = 4
        let gridTop = height * 0.30
        let gridBottom = height * 0.72

        let gridHeight = gridBottom - gridTop
        let cellSize = min((width - 400) / CGFloat(cols), gridHeight / CGFloat(rows))
        let dotR = cellSize * 0.30
        let totalGridW = cellSize * CGFloat(cols)
        let totalGridH = cellSize * CGFloat(rows)
        let gridLeft = (width - totalGridW) / 2 + cellSize / 2
        let gridStartY = gridTop + (gridHeight - totalGridH) / 2 + cellSize / 2

        for i in 0..<24 {
            let r = i / cols
            let c = i % cols
            let cx = gridLeft + CGFloat(c) * cellSize
            let cy = gridStartY + CGFloat(rows - 1 - r) * cellSize
            if i == hour {
                accent.withAlphaComponent(0.35).setFill()
                NSBezierPath(ovalIn: NSRect(x: cx - dotR * 1.4, y: cy - dotR * 1.4, width: dotR * 2.8, height: dotR * 2.8)).fill()
                accent.setFill()
                NSBezierPath(ovalIn: NSRect(x: cx - dotR, y: cy - dotR, width: dotR * 2, height: dotR * 2)).fill()
                drawText(String(hour), at: NSPoint(x: cx, y: cy - dotR * 0.45), size: dotR * 0.85, color: .black, weight: .black)
            } else {
                let color = i < hour ? accent : emptyDot
                color.setFill()
                NSBezierPath(ovalIn: NSRect(x: cx - dotR, y: cy - dotR, width: dotR * 2, height: dotR * 2)).fill()
            }
        }

        drawText(String(format: "%.1f%%", pct), at: NSPoint(x: width / 2, y: height * 0.18), size: 180, color: accent, weight: .black)
        let hoursLeft = 24 - hour - (minute > 0 ? 1 : 0)
        drawText("\(hoursLeft) HOURS LEFT TODAY", at: NSPoint(x: width / 2, y: height * 0.12), size: 30, color: textSecondary, weight: .medium, kerning: 4)
    }

    // MARK: - Goal

    private func drawGoal(textPrimary: NSColor, textSecondary: NSColor, accent: NSColor, emptyDot: NSColor) {
        guard let target = settings.goalDate, !settings.goalTitle.isEmpty else {
            drawText("Pick a goal", at: NSPoint(x: width / 2, y: height * 0.55), size: 80, color: textPrimary, weight: .bold)
            drawText("Add a goal title and date in the menu", at: NSPoint(x: width / 2, y: height * 0.48), size: 34, color: textSecondary, weight: .regular)
            return
        }

        let now = Date()
        let secs = target.timeIntervalSince(now)

        drawText("GOAL", at: NSPoint(x: width / 2, y: height * 0.88), size: 36, color: textSecondary, weight: .semibold, kerning: 14)
        drawText(settings.goalTitle.uppercased(), at: NSPoint(x: width / 2, y: height * 0.83), size: 44, color: textPrimary, weight: .bold, kerning: 4)
        let f = DateFormatter()
        f.dateFormat = "MMM d, yyyy"
        drawText(f.string(from: target), at: NSPoint(x: width / 2, y: height * 0.78), size: 28, color: textSecondary, weight: .medium)

        if secs <= 0 {
            drawText("REACHED", at: NSPoint(x: width / 2, y: height * 0.50), size: 220, color: accent, weight: .black, kerning: 12)
            return
        }

        let daysUntil = Int(ceil(secs / 86400))
        let useWeeks = daysUntil > 365
        let totalCells = useWeeks ? Int(ceil(Double(daysUntil) / 7)) : daysUntil
        let unitLabel = useWeeks ? "WEEKS" : "DAYS"

        let gridTop = height * 0.28
        let gridBottom = height * 0.72
        let aspect = (width - 400) / (gridBottom - gridTop)
        var cols = max(1, Int(round(sqrt(Double(totalCells) * Double(aspect)))))
        if cols > totalCells { cols = totalCells }
        let rows = Int(ceil(Double(totalCells) / Double(cols)))
        drawGrid(
            count: totalCells, filled: 1,
            cols: cols, rows: rows,
            top: gridTop, bottom: gridBottom,
            accent: accent, emptyDot: emptyDot,
            dotRatio: cols < 12 ? 0.4 : 0.34
        )

        drawText("\(daysUntil)", at: NSPoint(x: width / 2, y: height * 0.18), size: 220, color: accent, weight: .black)
        drawText("\(unitLabel) TO GO", at: NSPoint(x: width / 2, y: height * 0.12), size: 32, color: textSecondary, weight: .semibold, kerning: 8)
    }

    // MARK: - Helpers

    private func drawGrid(
        count: Int, filled: Int,
        cols: Int, rows: Int,
        top: CGFloat, bottom: CGFloat,
        accent: NSColor, emptyDot: NSColor,
        dotRatio: CGFloat
    ) {
        let gridHeight = bottom - top
        let cellSize = min((width - 400) / CGFloat(cols), gridHeight / CGFloat(rows))
        let dotR = cellSize * dotRatio
        let totalGridW = cellSize * CGFloat(cols)
        let totalGridH = cellSize * CGFloat(rows)
        let gridLeft = (width - totalGridW) / 2 + cellSize / 2
        // top-down layout: row 0 at top of grid (NSImage is flipped origin = bottom-left)
        let gridStartY = top + (gridHeight - totalGridH) / 2 + cellSize / 2
        for i in 0..<count {
            let r = i / cols
            let c = i % cols
            let cx = gridLeft + CGFloat(c) * cellSize
            let cy = gridStartY + CGFloat(rows - 1 - r) * cellSize
            let color = i < filled ? accent : emptyDot
            color.setFill()
            NSBezierPath(ovalIn: NSRect(x: cx - dotR, y: cy - dotR, width: dotR * 2, height: dotR * 2)).fill()
        }
    }

    private func drawText(
        _ string: String,
        at point: NSPoint,
        size: CGFloat,
        color: NSColor,
        weight: NSFont.Weight,
        kerning: CGFloat = 0,
        align: NSTextAlignment = .center
    ) {
        let para = NSMutableParagraphStyle()
        para.alignment = align
        let attrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color,
            .kern: kerning,
            .paragraphStyle: para,
        ]
        let str = NSAttributedString(string: string, attributes: attrs)
        let strSize = str.size()
        // Center horizontally on `point.x`, baseline near `point.y`
        let rect = NSRect(
            x: point.x - strSize.width / 2,
            y: point.y - strSize.height / 2,
            width: strSize.width,
            height: strSize.height
        )
        str.draw(in: rect)
    }
}
