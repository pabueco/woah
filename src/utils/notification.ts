type NotificationOptions = {
  title: string;
  body: string;
  renotify?: boolean;
  silent?: boolean;
  tag?: string;
  vibration?: number[];
};

export function showNotification(notificationOptions: NotificationOptions) {
  try {
    Notification.requestPermission((result) => {
      if (result === "granted") {
        navigator.serviceWorker.ready.then((registration) => {
          console.log("registration", registration);

          registration.showNotification(notificationOptions.title, {
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            ...notificationOptions,
          });
        });
      }
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}
