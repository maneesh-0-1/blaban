// Utility to track in-flight and pending cart quantity updates
// preventing stale server responses and race conditions from rolling back local optimistic state.

const pendingUpdates = new Map();

export const setPendingCartQty = (key, targetQty) => {
  if (key == null) return;
  pendingUpdates.set(String(key), {
    targetQty: Number(targetQty),
    timestamp: Date.now(),
  });
};

export const getPendingCartQty = (key) => {
  if (key == null) return null;
  const entry = pendingUpdates.get(String(key));
  if (!entry) return null;
  // Expire after 3.5 seconds
  if (Date.now() - entry.timestamp > 3500) {
    pendingUpdates.delete(String(key));
    return null;
  }
  return entry.targetQty;
};

export const clearPendingCartQty = (key) => {
  if (key == null) return;
  pendingUpdates.delete(String(key));
};
