const test = require("node:test");
const assert = require("node:assert/strict");

test("rejects empty dictation audio", async () => {
  const { getDictationAudioReadiness } = await import("../../src/helpers/dictationReliability.js");

  assert.deepEqual(getDictationAudioReadiness({ size: 0 }, { durationSeconds: 1 }), {
    ready: false,
    reason: "empty_audio",
    size: 0,
    durationMs: 1000,
  });
});

test("rejects header-only dictation audio before transcription", async () => {
  const { getDictationAudioReadiness } = await import("../../src/helpers/dictationReliability.js");

  assert.deepEqual(getDictationAudioReadiness({ size: 110 }, { durationSeconds: 1 }), {
    ready: false,
    reason: "audio_too_small",
    size: 110,
    durationMs: 1000,
  });
});

test("rejects recordings shorter than the usable capture window", async () => {
  const { getDictationAudioReadiness } = await import("../../src/helpers/dictationReliability.js");

  assert.deepEqual(getDictationAudioReadiness({ size: 4096 }, { durationSeconds: 0.25 }), {
    ready: false,
    reason: "audio_too_short",
    size: 4096,
    durationMs: 250,
  });
});

test("allows normal dictation audio through", async () => {
  const { getDictationAudioReadiness } = await import("../../src/helpers/dictationReliability.js");

  assert.deepEqual(getDictationAudioReadiness({ size: 12751 }, { durationSeconds: 1.2 }), {
    ready: true,
    reason: "ready",
    size: 12751,
    durationMs: 1200,
  });
});

test("falls back from Parakeet for retryable local nvidia failures", async () => {
  const { shouldFallbackFromParakeet } = await import(
    "../../src/helpers/dictationReliability.js"
  );

  assert.equal(
    shouldFallbackFromParakeet(
      {
        useLocalWhisper: true,
        localTranscriptionProvider: "nvidia",
        allowLocalFallback: true,
      },
      new Error("Parakeet binary is missing")
    ),
    true
  );

  assert.equal(
    shouldFallbackFromParakeet(
      {
        useLocalWhisper: true,
        localTranscriptionProvider: "nvidia",
        allowLocalFallback: true,
      },
      new Error("No audio detected"),
      {
        audioReadiness: { ready: true },
        speechGateDecision: { skip: true, reason: "insufficient_speech" },
      }
    ),
    true
  );

  assert.equal(
    shouldFallbackFromParakeet(
      {
        useLocalWhisper: true,
        localTranscriptionProvider: "nvidia",
        allowLocalFallback: true,
      },
      new Error("No audio detected")
    ),
    false
  );

  assert.equal(
    shouldFallbackFromParakeet(
      {
        useLocalWhisper: true,
        localTranscriptionProvider: "nvidia",
        allowLocalFallback: true,
      },
      new Error("No audio detected"),
      {
        audioReadiness: { ready: true },
        speechGateDecision: { skip: false, reason: "speech_detected" },
      }
    ),
    true
  );

  assert.equal(
    shouldFallbackFromParakeet(
      {
        useLocalWhisper: true,
        localTranscriptionProvider: "nvidia",
        allowLocalFallback: true,
      },
      new Error("No audio detected"),
      {
        audioReadiness: { ready: true },
        speechGateDecision: { skip: true, reason: "silence" },
      }
    ),
    false
  );
});

test("retries blank local transcription with normalized audio only when capture evidence is usable", async () => {
  const { shouldRetryNormalizedNoAudio } = await import(
    "../../src/helpers/dictationReliability.js"
  );

  assert.equal(
    shouldRetryNormalizedNoAudio(
      { success: false, message: "No audio detected" },
      {
        audioReadiness: { ready: true },
        speechGateDecision: { skip: true, reason: "insufficient_speech" },
      }
    ),
    true
  );

  assert.equal(
    shouldRetryNormalizedNoAudio(
      { success: false, message: "No audio detected" },
      {
        audioReadiness: { ready: true },
        speechGateDecision: { skip: true, reason: "silence" },
      }
    ),
    false
  );

  assert.equal(shouldRetryNormalizedNoAudio({ success: true, text: "hello" }), false);
});
