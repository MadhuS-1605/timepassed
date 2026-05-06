import ScreenSaver
import AppKit

/// macOS screen saver that draws a live, animated dot grid based on the
/// year-progress template (or pulled from the same `~/Library/Application
/// Support/TimePassed/screensaver-config.json` the menu-bar app writes).
///
/// Lives at `~/Library/Screen Savers/TimePassed.saver` after install.
public final class TimePassedScreenSaverView: ScreenSaverView {

    // Tunables
    private let cols = 19
    private var rows: Int { Int(ceil(Double(totalDays) / Double(cols))) }
    private var totalDays: Int { 365 }

    // Animation state
    private var phase: CGFloat = 0
    private var revealedFraction: CGFloat = 0  // 0..1, sweeps once on launch

    private let accent = NSColor(red: 0.13, green: 0.77, blue: 0.37, alpha: 1)
    private let bg = NSColor(red: 0.020, green: 0.020, blue: 0.020, alpha: 1)
    private let textPrimary = NSColor.white
    private let textSecondary = NSColor(white: 0.63, alpha: 1)
    private let emptyDot = NSColor.white.withAlphaComponent(0.06)

    public override init?(frame: NSRect, isPreview: Bool) {
        super.init(frame: frame, isPreview: isPreview)
        animationTimeInterval = 1.0 / 30.0   // 30 fps
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        animationTimeInterval = 1.0 / 30.0
    }

    public override func startAnimation() {
        super.startAnimation()
        revealedFraction = 0
        phase = 0
    }

    public override func animateOneFrame() {
        // Reveal animation runs ~3 seconds, then phase pulses gently
        if revealedFraction < 1 {
            revealedFraction = min(1, revealedFraction + 0.012)
        }
        phase += 0.02
        setNeedsDisplay(bounds)
    }

    public override var hasConfigureSheet: Bool { false }

    public override func draw(_ rect: NSRect) {
        let w = bounds.width
        let h = bounds.height

        // Background
        bg.setFill()
        rect.fill()

        // Soft accent radial gradient
        let grad = NSGradient(colors: [accent.withAlphaComponent(0.20), bg.withAlphaComponent(0)])
        grad?.draw(
            fromCenter: NSPoint(x: w * 0.85, y: h * 0.90),
            radius: 0,
            toCenter: NSPoint(x: w * 0.5, y: h * 0.5),
            radius: w * 0.65,
            options: []
        )

        let cal = Calendar.current
        let now = Date()
        let year = cal.component(.year, from: now)
        let start = cal.date(from: DateComponents(year: year, month: 1, day: 1))!
        let end = cal.date(from: DateComponents(year: year + 1, month: 1, day: 1))!
        let totalDays = cal.dateComponents([.day], from: start, to: end).day ?? 365
        let dayOfYear = (cal.dateComponents([.day], from: start, to: now).day ?? 0) + 1
        let pct = now.timeIntervalSince(start) / end.timeIntervalSince(start) * 100

        // Header
        drawText(String(year), at: NSPoint(x: w / 2, y: h * 0.85), size: w * 0.10, color: textPrimary, weight: .black, kerning: 6)
        drawText("YEAR PROGRESS", at: NSPoint(x: w / 2, y: h * 0.78), size: w * 0.018, color: textSecondary, weight: .semibold, kerning: 14)

        // Grid
        let rowsCount = Int(ceil(Double(totalDays) / Double(cols)))
        let gridTop = h * 0.30
        let gridBottom = h * 0.65
        let gridHeight = gridBottom - gridTop
        let cellSize = min((w - w * 0.16) / CGFloat(cols), gridHeight / CGFloat(rowsCount))
        let dotR = cellSize * 0.34
        let totalGridW = cellSize * CGFloat(cols)
        let totalGridH = cellSize * CGFloat(rowsCount)
        let gridLeft = (w - totalGridW) / 2 + cellSize / 2
        let gridStartY = gridTop + (gridHeight - totalGridH) / 2 + cellSize / 2

        // How many cells to actually fill, scaled by reveal animation
        let reveal = easeOut(revealedFraction)
        let revealedCount = Int(CGFloat(dayOfYear) * reveal)

        for i in 0..<totalDays {
            let r = i / cols
            let c = i % cols
            let cx = gridLeft + CGFloat(c) * cellSize
            let cy = gridStartY + CGFloat(rowsCount - 1 - r) * cellSize
            let isFilled = i < revealedCount
            let isEdge = i == revealedCount - 1
            // pulse on the leading edge dot
            var radius = dotR
            if isEdge {
                radius = dotR * (1 + 0.15 * sin(phase * 3))
                accent.withAlphaComponent(0.5).setFill()
                NSBezierPath(ovalIn: NSRect(x: cx - radius * 1.6, y: cy - radius * 1.6, width: radius * 3.2, height: radius * 3.2)).fill()
            }
            let color = isFilled ? accent : emptyDot
            color.setFill()
            NSBezierPath(ovalIn: NSRect(x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2)).fill()
        }

        // Footer: percentage that fades in with the reveal.
        // 7 decimals so the value visibly ticks every frame (~30ms).
        let fadeAlpha = max(0, min(1, (reveal - 0.5) * 2))
        drawText(String(format: "%.7f%%", pct), at: NSPoint(x: w / 2, y: h * 0.18), size: w * 0.06, color: accent.withAlphaComponent(fadeAlpha), weight: .black)
        drawText("\(dayOfYear) of \(totalDays) days", at: NSPoint(x: w / 2, y: h * 0.13), size: w * 0.014, color: textSecondary.withAlphaComponent(fadeAlpha), weight: .medium, kerning: 4)
        drawText("TIMEPASSED", at: NSPoint(x: w / 2, y: h * 0.06), size: w * 0.012, color: textSecondary.withAlphaComponent(fadeAlpha * 0.8), weight: .bold, kerning: 14)
    }

    private func easeOut(_ t: CGFloat) -> CGFloat {
        let clamped = max(0, min(1, t))
        return 1 - pow(1 - clamped, 3)
    }

    private func drawText(
        _ string: String,
        at point: NSPoint,
        size: CGFloat,
        color: NSColor,
        weight: NSFont.Weight,
        kerning: CGFloat = 0
    ) {
        let para = NSMutableParagraphStyle()
        para.alignment = .center
        let attrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color,
            .kern: kerning,
            .paragraphStyle: para,
        ]
        let str = NSAttributedString(string: string, attributes: attrs)
        let strSize = str.size()
        let rect = NSRect(
            x: point.x - strSize.width / 2,
            y: point.y - strSize.height / 2,
            width: strSize.width,
            height: strSize.height
        )
        str.draw(in: rect)
    }
}
