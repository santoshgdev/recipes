import UserNotifications

class NotificationManager {
    static let shared = NotificationManager()

    func requestPermission() async -> Bool {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        guard settings.authorizationStatus == .notDetermined else {
            return settings.authorizationStatus == .authorized
        }
        return (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
    }

    @discardableResult
    func scheduleTimer(stepTitle: String, seconds: Int) async -> String? {
        guard await requestPermission() else { return nil }

        let content = UNMutableNotificationContent()
        content.title = "Timer done"
        content.body = "\(stepTitle) is ready"
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: TimeInterval(seconds),
            repeats: false
        )
        let id = UUID().uuidString
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        try? await UNUserNotificationCenter.current().add(request)
        return id
    }

    func cancel(id: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id])
    }
}
