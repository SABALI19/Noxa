self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          if (response.ok || response.type === "opaqueredirect") {
            return response;
          }
          return fetch("/index.html");
        } catch {
          return fetch("/index.html");
        }
      })()
    );
    return;
  }

  event.respondWith(fetch(event.request));
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
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload?.data?.eventId || "noxa-notification",
    data: payload?.data || {},
  };

  event.waitUntil(
    (async () => {
      try {
        if ("BroadcastChannel" in self) {
          const channel = new BroadcastChannel("noxa-notification-channel");
          channel.postMessage({ type: "PLAY_RINGTONE", payload });
          channel.close();
        }
      } catch {}

      await self.registration.showNotification(title, options);
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/dashboard";

  event.waitUntil(
    Promise.resolve()
      .then(() => {
        try {
          if ("BroadcastChannel" in self) {
            const channel = new BroadcastChannel("noxa-notification-channel");
            channel.postMessage({ type: "NOTIFICATION_ACTION", payload: event.notification?.data || {} });
            channel.close();
          }
        } catch {}
      })
      .then(() =>
        self.clients.matchAll({ type: "window", includeUncontrolled: true })
      )
      .then((clients) => {
        const matchingClient = clients.find((client) => client.url.includes(targetUrl));
        if (matchingClient) {
          return matchingClient.focus();
        }

        return self.clients.openWindow(targetUrl);
      })
  );
});

self.addEventListener("notificationclose", (event) => {
  event.waitUntil(
    Promise.resolve().then(() => {
      try {
        if ("BroadcastChannel" in self) {
          const channel = new BroadcastChannel("noxa-notification-channel");
          channel.postMessage({ type: "NOTIFICATION_ACTION", payload: event.notification?.data || {} });
          channel.close();
        }
      } catch {}
    })
  );
});
