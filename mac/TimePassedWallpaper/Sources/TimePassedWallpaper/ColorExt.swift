import AppKit

extension NSColor {
    convenience init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let val = UInt32(s, radix: 16) else { return nil }
        let r = CGFloat((val >> 16) & 0xFF) / 255
        let g = CGFloat((val >> 8) & 0xFF) / 255
        let b = CGFloat(val & 0xFF) / 255
        self.init(red: r, green: g, blue: b, alpha: 1)
    }
}
