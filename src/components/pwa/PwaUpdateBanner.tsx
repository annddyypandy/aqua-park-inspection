import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '../ui/Button';

export function PwaUpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Periodic check so a new shell can be offered without wiping IndexedDB.
      if (!registration) {
        return;
      }

      window.setInterval(() => {
        void registration.update();
      }, 60 * 60 * 1000);
    },
  });

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="pwa-banner" role="status">
      <strong>App update available</strong>
      <p className="muted">
        Your inspection records stay on this device. Updating only refreshes the
        application files.
      </p>
      <Button
        variant="primary"
        block
        onClick={() => {
          void updateServiceWorker(true);
        }}
      >
        Update now
      </Button>
      <Button variant="ghost" block onClick={() => setNeedRefresh(false)}>
        Later
      </Button>
    </div>
  );
}
