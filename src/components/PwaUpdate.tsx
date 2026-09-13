import { useEffect, useState } from 'react';

export function PwaUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let hasController = Boolean(navigator.serviceWorker.controller);
    const watched = new Set<ServiceWorker>();
    const checkWaiting = () => {
      if (!disposed && hasController && registration?.waiting) setWaiting(registration.waiting);
    };
    const foundUpdate = () => {
      const installing = registration?.installing;
      if (installing && !watched.has(installing)) {
        watched.add(installing);
        installing.addEventListener('statechange', checkWaiting);
      }
    };
    const check = () => {
      checkWaiting();
      void registration?.update().then(checkWaiting).catch(() => undefined);
    };
    const changedController = () => {
      // Another window may activate the update. Keep this window's draft intact.
      if (hasController && !disposed) setWaiting(navigator.serviceWorker.controller);
      hasController = Boolean(navigator.serviceWorker.controller);
    };
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' }).then((registered) => {
      if (disposed) return;
      registration = registered;
      checkWaiting();
      registration.addEventListener('updatefound', foundUpdate);
      foundUpdate();
    }).catch(() => undefined);
    window.addEventListener('focus', check);
    navigator.serviceWorker.addEventListener('controllerchange', changedController);
    return () => {
      disposed = true;
      window.removeEventListener('focus', check);
      registration?.removeEventListener('updatefound', foundUpdate);
      navigator.serviceWorker.removeEventListener('controllerchange', changedController);
      for (const worker of watched) worker.removeEventListener('statechange', checkWaiting);
    };
  }, []);

  if (!waiting) return null;
  return (
    <aside className="pwa-update" role="status">
      <span>نسخة جديدة جاهزة. احفظ إدخالك قبل التحديث.</span>
      <button className="button primary" type="button" disabled={updating} onClick={() => {
        setUpdating(true);
        if (waiting.state === 'activated' || navigator.serviceWorker.controller === waiting) {
          window.location.reload();
          return;
        }
        navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
        waiting.postMessage({ type: 'SKIP_WAITING' });
      }}>{updating ? 'جاري التحديث...' : 'تحديث التطبيق'}</button>
    </aside>
  );
}
