import { useCallback } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

/**
 * Hook to manage native local notifications
 */
export const useNativeNotifications = () => {
  const requestPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return true;

    try {
      const { display } = await LocalNotifications.checkPermissions();
      if (display === "granted") return true;

      const { display: newDisplay } =
        await LocalNotifications.requestPermissions();
      return newDisplay === "granted";
    } catch (e) {
      console.error("Permission request failed", e);
      return false;
    }
  }, []);

  // Initialize channel once
  const initChannel = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.createChannel({
        id: "timepassed_alarms_v2",
        name: "TimePassed Alarms",
        description: "Focus Timer and Event Alerts",
        importance: 5, // HIGH
        visibility: 1, // PUBLIC
        sound: undefined, // default
        vibration: true,
      });
    } catch (e) {
      console.error("Channel error", e);
    }
  }, []);

  /**
   * Schedule a notification
   */
  const scheduleNotification = useCallback(
    async ({
      id,
      title,
      body,
      scheduleAt,
    }) => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Ensure we have permission
        const granted = await requestPermissions();
        if (!granted) return;

        // Ensure channel exists
        await initChannel();

        // Ensure date is in the future
        const triggerAt = new Date(scheduleAt);
        if (triggerAt.getTime() <= Date.now()) return;

        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id,
              schedule: { at: triggerAt, allowWhileIdle: true },
              channelId: "timepassed_alarms_v2", // Use our explicit channel
              sound: undefined,
              actionTypeId: "",
              extra: null,
            },
          ],
        });
        console.log(
          `Scheduled notification ${id} for ${triggerAt.toISOString()}`,
        );
      } catch (e) {
        console.error("Scheduling failed", e);
      }
    },
    [requestPermissions],
  );

  /**
   * Cancel specific notifications
   */
  const cancelNotifications = useCallback(async (ids) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({
        notifications: ids.map((id) => ({ id })),
      });
    } catch (e) {
      console.error("Cancel failed", e);
    }
  }, []);

  return {
    scheduleNotification,
    cancelNotifications,
    requestPermissions,
  };
};
