import { useState, useEffect } from 'react';

interface PWAState {
  isOnline: boolean;
}

// Install-prompt detection (isInstalled/isStandalone/canInstall) used to
// live here too, but the feature that consumed it (PWAInstallPrompt) was
// disabled and nothing reads those fields anymore, so it was dropped rather
// than kept as dead code. Re-add it if that UI comes back — and note the
// beforeinstallprompt listener needs to call event.preventDefault() and
// store the event itself (to call event.prompt() later), not just flip a
// boolean, which is what the old version did.
export const usePWA = (): PWAState => {
  const [state, setState] = useState<PWAState>({
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    const handleOnline = () => setState({ isOnline: true });
    const handleOffline = () => setState({ isOnline: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return state;
};
