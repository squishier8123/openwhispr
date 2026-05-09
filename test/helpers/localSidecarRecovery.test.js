const assert = require("node:assert/strict");
const test = require("node:test");

const {
  formatSidecarFailure,
  isRetryableSidecarReset,
  transcribeWithSidecarRecovery,
} = require("../../src/helpers/localSidecarRecovery");

test("classifies local sidecar connection reset as retryable", () => {
  assert.equal(
    isRetryableSidecarReset(
      new Error("whisper-server request failed: read ECONNRESET"),
    ),
    true,
  );
});

test("restarts sidecar once after a retryable reset", async () => {
  let attempts = 0;
  let restarts = 0;

  const result = await transcribeWithSidecarRecovery({
    label: "whisper-server",
    transcribe: async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("whisper-server request failed: read ECONNRESET");
      }
      return { text: "recovered" };
    },
    restart: async () => {
      restarts += 1;
    },
  });

  assert.deepEqual(result, { text: "recovered" });
  assert.equal(attempts, 2);
  assert.equal(restarts, 1);
});

test("does not retry non-sidecar transcription failures", async () => {
  let attempts = 0;

  await assert.rejects(
    () =>
      transcribeWithSidecarRecovery({
        label: "whisper-server",
        transcribe: async () => {
          attempts += 1;
          throw new Error("Whisper model \"base\" not downloaded");
        },
        restart: async () => {},
      }),
    /not downloaded/,
  );

  assert.equal(attempts, 1);
});

test("formats sidecar reset as a specific local service failure", () => {
  const result = formatSidecarFailure("Whisper", new Error("read ECONNRESET"));

  assert.equal(result.error, "local_sidecar_connection_reset");
  assert.match(result.message, /Whisper local service stopped responding/i);
});
