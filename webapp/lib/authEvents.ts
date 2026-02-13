/**
 * 인증 이벤트 (axios ↔ authStore 간 순환 참조 방지)
 * 401 발생 시 여기서 emit, authStore에서 subscribe
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
