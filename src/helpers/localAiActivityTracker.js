function createLocalAiActivityTracker(options = {}) {
  const activeCounts = new Map();
  const timers = new Map();
  const setTimeoutFn = options.setTimeoutFn || setTimeout;
  const clearTimeoutFn = options.clearTimeoutFn || clearTimeout;

  function clear(service) {
    const timer = timers.get(service);
    if (timer) clearTimeoutFn(timer);
    timers.delete(service);
  }

  return {
    start(service) {
      activeCounts.set(service, (activeCounts.get(service) || 0) + 1);
      clear(service);
    },

    async finish(service) {
      const nextCount = Math.max(0, (activeCounts.get(service) || 0) - 1);
      if (nextCount === 0) activeCounts.delete(service);
      else activeCounts.set(service, nextCount);
    },

    scheduleIdleStop(service, stop, delayMs = 5 * 60 * 1000) {
      clear(service);
      const timer = setTimeoutFn(async () => {
        timers.delete(service);
        if ((activeCounts.get(service) || 0) > 0) return;
        await stop();
      }, delayMs);
      timers.set(service, timer);
    },

    clear,
  };
}

module.exports = {
  createLocalAiActivityTracker,
};
