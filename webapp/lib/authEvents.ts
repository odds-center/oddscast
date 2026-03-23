/**
 * Authentication events (prevents circular reference between axios ↔ authStore)
 * Emit here on 401, subscribe in authStore.
 * Also listens to cross-tab logout via StorageEvent.
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

// Cross-tab logout: detect when jwt_token is removed in another tab
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === 'jwt_token' && !e.newValue) {
      emitUnauthorized();
    }
  });
}
