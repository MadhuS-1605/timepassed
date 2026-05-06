import Foundation
import Capacitor

/**
 * Mirrors small JSON values into the App Group's UserDefaults so
 * the iOS Widget Extension can read them with the main app closed.
 *
 * Used keys (all stored as plain strings — usually JSON-stringified):
 *   - widget_pulse           {logged, skipped, streak, emoji, label, color}
 *   - widget_birth_date      ISO string
 *   - widget_year_accent     hex string
 *   - widget_goal            {title, date}
 *   - widget_savedEvents     JSON array of {id, title, date}
 */
@objc(SharedDefaultsPlugin)
public class SharedDefaultsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SharedDefaultsPlugin"
    public let jsName = "SharedDefaults"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reloadWidgets", returnType: CAPPluginReturnPromise)
    ]

    /// Update this if you change the App Group ID in Xcode.
    private let appGroup = "group.com.timepassed.app"

    private var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroup)
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("key required")
            return
        }
        let value = call.getString("value")
        guard let defaults = defaults else {
            call.reject("App Group not available — check entitlements")
            return
        }
        if let value = value {
            defaults.set(value, forKey: key)
        } else {
            defaults.removeObject(forKey: key)
        }
        call.resolve(["ok": true])
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("key required")
            return
        }
        let value = defaults?.string(forKey: key)
        call.resolve(["value": value as Any])
    }

    /// Asks WidgetKit to refresh all timelines for our widget kinds.
    /// Safe no-op on older iOS.
    @objc func reloadWidgets(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            #if canImport(WidgetKit)
            // Note: importing WidgetKit at file scope would force everyone
            // to link the framework. Keep it inside the conditional.
            // We dispatch on main since reloadAllTimelines may post UI work.
            DispatchQueue.main.async {
                NotificationCenter.default.post(
                    name: Notification.Name("TimePassedReloadAllWidgets"),
                    object: nil
                )
            }
            #endif
        }
        call.resolve(["ok": true])
    }
}
