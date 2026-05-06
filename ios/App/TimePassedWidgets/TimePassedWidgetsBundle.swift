import WidgetKit
import SwiftUI

@main
struct TimePassedWidgetsBundle: WidgetBundle {
    var body: some Widget {
        YearWidget()
        DayWidget()
        LifeWidget()
        PulseWidget()
        GoalWidget()
    }
}
