/** Coalesce same-turn notifications, but never drop an invalidation during a read. */
export function createRefreshQueue(run: (isCurrent: () => boolean) => Promise<void>): () => Promise<void> {
  let requested = 0;
  let running: Promise<void> | null = null;

  return () => {
    ++requested;
    if (!running) {
      running = (async () => {
        try {
          let handled: number;
          do {
            // A committed write emits an event before its caller resumes. Batch both.
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            handled = requested;
            await run(() => handled === requested);
          } while (handled !== requested);
        } finally {
          // Clear inside the drain, not a later .finally() microtask: a new request
          // must not join an already-finished drain and lose its notification.
          running = null;
        }
      })();
    }
    return running;
  };
}
