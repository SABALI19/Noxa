self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "Noxa Notification";
  const options = {
    body: payload.body || "You have a new update.",
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: payload?.data?.eventId || "noxa-notification",
    data: payload?.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const matchingClient = clients.find((client) => client.url.includes(targetUrl));
        if (matchingClient) {
          return matchingClient.focus();
        }

        return self.clients.openWindow(targetUrl);
      })
  );
});

