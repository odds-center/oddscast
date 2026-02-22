import { useState, useEffect, useCallback } from 'react';
import Icon from '../icons';

type Status = 'online' | 'offline' | 'reconnected';

export default function NetworkStatusBanner() {
  const [status, setStatus] = useState<Status>('online');
  const [visible, setVisible] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  const goOffline = useCallback(() => {
    setStatus('offline');
    setVisible(true);
    setWasOffline(true);
  }, []);

  const goOnline = useCallback(() => {
    if (!wasOffline) return;
    setStatus('reconnected');
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [wasOffline]);

  useEffect(() => {
    if (!navigator.onLine) goOffline();

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, [goOffline, goOnline]);

  if (!visible) return null;

  const isOffline = status === 'offline';

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-9999 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 ${
        isOffline
          ? 'bg-red-500/95 backdrop-blur-sm'
          : 'bg-emerald-500/95 backdrop-blur-sm'
      }`}
      style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
      role="alert"
    >
      <Icon
        name={isOffline ? 'WifiOff' : 'Wifi'}
        size={16}
        className={isOffline ? 'animate-pulse' : ''}
      />
      <span>
        {isOffline
          ? '인터넷 연결이 끊겼습니다. 재연결 시도 중...'
          : '다시 연결되었습니다!'}
      </span>
    </div>
  );
}
