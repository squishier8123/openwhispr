const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createLocalAiActivityTracker,
} = require("../../src/helpers/localAiActivityTracker");

test("does not stop local sidecar while service is active", async () => {
  let stopped = false;
  const tracker = createLocalAiActivityTracker({
    setTimeoutFn: (callback) => {
      callback();
      return 1;
    },
    clearTimeoutFn: () => {},
  });

  tracker.start("parakeet");
  tracker.scheduleIdleStop("parakeet", async () => {
    stopped = true;
  });

  assert.equal(stopped, false);

  await tracker.finish("parakeet");
  tracker.scheduleIdleStop("parakeet", async () => {
    stopped = true;
  });

  assert.equal(stopped, true);
});
