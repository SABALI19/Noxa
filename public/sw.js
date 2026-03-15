self.__NOXA_QUIET_MODE_CACHE = "noxa-notification-state";
self.__NOXA_QUIET_MODE_KEY = "/__noxa_notification_quiet_mode__";

const readQuietModeState = async () => {
  try {
    const cache = await caches.open(self.__NOXA_QUIET_MODE_CACHE);
    const response = await cache.match(self.__NOXA_QUIET_MODE_KEY);
    if (!response) return { quietUntil: null };
    const parsed = await response.json();
    return parsed && typeof parsed === "object" ? parsed : { quietUntil: null };
  } catch {
    return { quietUntil: null };
  }
};

const writeQuietModeState = async (payload = {}) => {
  try {
    const cache = await caches.open(self.__NOXA_QUIET_MODE_CACHE);
    await cache.put(
      self.__NOXA_QUIET_MODE_KEY,
      new Response(JSON.stringify({ quietUntil: payload.quietUntil || null }), {
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch {}
};

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

self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};
  if (type === "SET_NOTIFICATION_QUIET_MODE") {
    event.waitUntil(writeQuietModeState(payload));
  }
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
      const quietModeState = await readQuietModeState();
      const quietUntil = quietModeState?.quietUntil ? new Date(quietModeState.quietUntil).getTime() : null;
      if (quietUntil && quietUntil > Date.now()) {
        return;
      }

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
