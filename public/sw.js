self.__NOXA_QUIET_MODE_CACHE = "noxa-notification-state";
self.__NOXA_QUIET_MODE_KEY = "/__noxa_notification_quiet_mode__";
self.__NOXA_DEFAULT_SNOOZE_MINUTES = 30;

const normalizeText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  const result = String(value).trim();
  return result || fallback;
};

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

const getNotificationMeta = (payload = {}) => {
  const data = payload?.data && typeof payload.data === "object" ? payload.data : {};
  const notificationType = normalizeText(
    data.notificationType,
    payload.notificationType || data.type || payload.type || "socket_message"
  ).toLowerCase();
  const itemType = normalizeText(
    data.itemType,
    notificationType.includes("_") ? notificationType.split("_")[0] : "system"
  ).toLowerCase();
  const rawItemId = data.itemId ?? data.id ?? data.item?.id ?? null;
  const itemId = rawItemId === null || rawItemId === undefined ? "" : encodeURIComponent(String(rawItemId));

  return { data, notificationType, itemType, itemId };
};

const resolveTargetUrl = ({ data = {}, notificationType = "", itemType = "", itemId = "", action = "" }) => {
  const explicitUrl = normalizeText(data.url || data.originPath, "");

  if (action === "goal-update" && itemId) {
    return `/goals/${itemId}?edit=true`;
  }

  if (action === "task-view" && itemId) {
    return `/tasks#task-${itemId}`;
  }

  if (explicitUrl) return explicitUrl;

  if ((itemType === "task" || notificationType.startsWith("task_")) && itemId) {
    return `/tasks#task-${itemId}`;
  }
  if (itemType === "task" || notificationType.startsWith("task_")) {
    return "/tasks";
  }
  if ((itemType === "goal" || notificationType.startsWith("goal_")) && itemId) {
    return `/goals/${itemId}`;
  }
  if (itemType === "goal" || notificationType.startsWith("goal_")) {
    return "/goals";
  }
  if (itemType === "reminder" || notificationType.startsWith("reminder_")) {
    return "/reminders";
  }
  if (itemType === "note" || notificationType.startsWith("note_")) {
    return "/notes";
  }
  if (
    itemType === "profile" ||
    itemType === "account" ||
    notificationType.startsWith("profile_") ||
    notificationType.startsWith("account_") ||
    notificationType === "user_logged_in"
  ) {
    return "/account";
  }
  return "/dashboard";
};

const resolveActions = ({ notificationType = "", itemType = "", itemId = "" }) => {
  if ((itemType === "goal" || notificationType.startsWith("goal_")) && itemId) {
    return [
      { action: "snooze", title: "Snooze 30m" },
      { action: "goal-update", title: "Update" },
    ];
  }

  if ((itemType === "task" || notificationType.startsWith("task_")) && itemId) {
    return [
      { action: "snooze", title: "Snooze 30m" },
      { action: "task-view", title: "View" },
    ];
  }

  return [];
};

const broadcastNotificationAction = async (payload = {}) => {
  try {
    if ("BroadcastChannel" in self) {
      const channel = new BroadcastChannel("noxa-notification-channel");
      channel.postMessage({ type: "NOTIFICATION_ACTION", payload });
      channel.close();
    }
  } catch {}
};

const performPushSnoozeAction = async (data = {}) => {
  const pushAction = data?.pushAction;
  if (!pushAction || pushAction.kind !== "reminder_snooze" || !pushAction.endpoint || !pushAction.token) {
    return false;
  }

  const response = await fetch(pushAction.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      actionToken: pushAction.token,
      snoozeMinutes: self.__NOXA_DEFAULT_SNOOZE_MINUTES,
    }),
  });

  if (!response.ok) {
    throw new Error(`Push snooze request failed (${response.status})`);
  }

  return true;
};

const focusOrOpenTarget = async (targetUrl) => {
  const resolvedUrl = new URL(targetUrl, self.location.origin).toString();
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const sameOriginClient = clients.find((client) => {
    try {
      return new URL(client.url).origin === self.location.origin;
    } catch {
      return false;
    }
  });

  if (sameOriginClient) {
    if ("navigate" in sameOriginClient) {
      try {
        await sameOriginClient.navigate(resolvedUrl);
      } catch {}
    }
    return sameOriginClient.focus();
  }

  return self.clients.openWindow(resolvedUrl);
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


  // #push-notifications #noxa
  const title = payload.title || "Noxa Notification";
  const { data, notificationType, itemType, itemId } = getNotificationMeta(payload);
  const defaultUrl = resolveTargetUrl({ data, notificationType, itemType, itemId });
  const options = {
    body: payload.body || "You have a new update.",
    icon: "/logo-2-square.png",
    badge: "/logo-icon-copy.png",
    tag: data.eventId || "noxa-notification",
    data: {
      ...data,
      notificationType,
      itemType,
      itemId: data.itemId ?? data.id ?? data.item?.id ?? null,
      url: defaultUrl,
    },
    actions: resolveActions({ notificationType, itemType, itemId }),
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
          channel.postMessage({ type: "PLAY_RINGTONE", payload: { ...payload, data: options.data } });
          channel.close();
        }
      } catch {}

      await self.registration.showNotification(title, options);
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification?.data || {};
  const notificationType = normalizeText(data.notificationType, "").toLowerCase();
  const itemType = normalizeText(data.itemType, "").toLowerCase();
  const rawItemId = data.itemId ?? data.id ?? data.item?.id ?? null;
  const itemId = rawItemId === null || rawItemId === undefined ? "" : encodeURIComponent(String(rawItemId));
  const action = normalizeText(event.action, "open");

  event.waitUntil(
    Promise.resolve()
      .then(async () => {
        if (action === "snooze") {
          let quietUntil = null;
          try {
            const usedBackendSnooze = await performPushSnoozeAction(data);
            if (!usedBackendSnooze) {
              quietUntil = new Date(
                Date.now() + self.__NOXA_DEFAULT_SNOOZE_MINUTES * 60 * 1000
              ).toISOString();
              await writeQuietModeState({ quietUntil });
            }
          } catch {
            quietUntil = new Date(
              Date.now() + self.__NOXA_DEFAULT_SNOOZE_MINUTES * 60 * 1000
            ).toISOString();
            await writeQuietModeState({ quietUntil });
          }

          await broadcastNotificationAction({
            ...data,
            action,
            quietUntil,
            snoozeMinutes: self.__NOXA_DEFAULT_SNOOZE_MINUTES,
          });
          return;
        }

        await broadcastNotificationAction({
          ...data,
          action,
        });
      })
      .then(async () => {
        if (action === "snooze") return;
        const targetUrl = resolveTargetUrl({ data, notificationType, itemType, itemId, action });
        await focusOrOpenTarget(targetUrl);
      })
  );
});

self.addEventListener("notificationclose", (event) => {
  event.waitUntil(
    broadcastNotificationAction({
      ...(event.notification?.data || {}),
      action: "dismiss",
    })
  );
});
