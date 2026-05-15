const test = require("node:test");
const assert = require("node:assert/strict");

test("dictation latency trace records ordered marks with a stable id", async () => {
  const {
    createDictationLatencyTrace,
    getDictationLatencyTraceSnapshot,
    markDictationLatencyTrace,
  } = await import("../../src/helpers/dictationLatencyTrace.js");

  const trace = createDictationLatencyTrace("batch-recording");
  markDictationLatencyTrace(trace, "start-request");
  markDictationLatencyTrace(trace, "recording-started", { provider: "local-parakeet" });

  const snapshot = getDictationLatencyTraceSnapshot(trace, "recording");

  assert.match(snapshot.traceId, /^dictation-\d+-\d+$/);
  assert.equal(snapshot.trigger, "batch-recording");
  assert.equal(snapshot.status, "recording");
  assert.equal(snapshot.marks.length, 2);
  assert.equal(snapshot.marks[0].stage, "start-request");
  assert.equal(snapshot.marks[1].stage, "recording-started");
  assert.equal(snapshot.marks[1].provider, "local-parakeet");
});

test("dictation latency trace helpers tolerate missing traces", async () => {
  const { getDictationLatencyTraceSnapshot, markDictationLatencyTrace } =
    await import("../../src/helpers/dictationLatencyTrace.js");

  assert.equal(markDictationLatencyTrace(null, "ignored"), null);
  assert.equal(getDictationLatencyTraceSnapshot(null), null);
});
