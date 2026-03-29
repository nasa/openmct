export function useSignalPolling(fn, baseInterval, hiddenMultiplier = 5) {
  let timer = null;
  let backoff = 1;
  const maxBackoff = 4;

  function stop() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function schedule(reason) {
    const hidden = document.visibilityState === 'hidden';
    const delay = baseInterval * backoff * (hidden ? hiddenMultiplier : 1);
    timer = window.setTimeout(() => {
      void run(reason);
    }, delay);
  }

  async function run(reason) {
    try {
      await fn(reason);
      backoff = 1;
    } catch (error) {
      backoff = Math.min(backoff * 2, maxBackoff);
    }

    schedule('interval');
  }

  return {
    start: () => schedule('startup'),
    stop,
    triggerNow: () => {
      stop();
      void run('manual');
    }
  };
}
