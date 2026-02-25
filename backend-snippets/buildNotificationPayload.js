// Copy this helper into your backend (example: Noxa-app/src/utils/buildNotificationPayload.js)
// and import it in controllers before calling io.emit(...).

const toItemType = (notificationType = '') => {
  if (!notificationType || typeof notificationType !== 'string') return 'system';
  if (notificationType.includes('_')) return notificationType.split('_')[0];
  return notificationType;
};

const normalizeString = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const result = String(value).trim();
  return result || fallback;
};

export const buildNotificationPayload = ({
  eventId,
  notificationType,
  itemType,
  item,
  title,
  message,
  playSound = true,
  timestamp
}) => {
  const resolvedType = normalizeString(notificationType, 'socket_message');
  const resolvedItemType = normalizeString(itemType, toItemType(resolvedType));
  const resolvedItem = item || {};
  const resolvedTitle = normalizeString(
    title,
    resolvedItem.title || `${resolvedItemType} update`
  );

  return {
    eventId: normalizeString(
      eventId,
      `${resolvedType}_${resolvedItem.id || Date.now()}_${Date.now()}`
    ),
    notificationType: resolvedType,
    itemType: resolvedItemType,
    item: {
      id: resolvedItem.id || null,
      title: resolvedTitle,
      progress: resolvedItem.progress,
      status: resolvedItem.status
    },
    title: normalizeString(title, ''),
    message: normalizeString(message, ''),
    playSound: Boolean(playSound),
    timestamp: timestamp || new Date().toISOString()
  };
};

// Example usage in a controller:
//
// import { buildNotificationPayload } from '../utils/buildNotificationPayload.js';
//
// const payload = buildNotificationPayload({
//   eventId: `task_created_${task._id}`,
//   notificationType: 'task_created',
//   item: { id: String(task._id), title: task.title, status: task.status }
// });
//
// req.app.get('io').emit('notification', payload);
