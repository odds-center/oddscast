/**
 * Authentication events (prevents circular reference between axios ↔ authStore)
 * Emit here on 401, subscribe in authStore
 */
type Listener = () => void;
const listeners: Listener[] = [];

export function emitUnauthorized() {
  listeners.forEach((fn) => fn());
}

export function onUnauthorized(fn: Listener) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}
