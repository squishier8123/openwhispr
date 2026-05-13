const assert = require("node:assert/strict");
const test = require("node:test");

const {
  resolveStartupTranscriptionPrefs,
} = require("../../src/helpers/startupTranscriptionPrefs");

test("uses Parakeet startup preference when env selects the local nvidia provider", () => {
  const prefs = resolveStartupTranscriptionPrefs({
    LOCAL_TRANSCRIPTION_PROVIDER: "nvidia",
    PARAKEET_MODEL: "parakeet-unified-en-0.6b",
  });

  assert.deepEqual(prefs, {
    useLocalWhisper: true,
    localTranscriptionProvider: "nvidia",
    parakeetModel: "parakeet-unified-en-0.6b",
  });
});

test("defaults fresh installs to local Parakeet dictation", () => {
  assert.deepEqual(resolveStartupTranscriptionPrefs({}), {
    useLocalWhisper: true,
    localTranscriptionProvider: "nvidia",
    parakeetModel: "parakeet-unified-en-0.6b",
  });
});
