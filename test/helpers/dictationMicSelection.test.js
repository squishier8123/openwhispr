const test = require("node:test");
const assert = require("node:assert/strict");

test("prefers headset dictation mics over webcam microphones", async () => {
  const { selectPreferredDictationMic } = await import(
    "../../src/helpers/dictationMicSelection.js"
  );

  const arctis = {
    kind: "audioinput",
    deviceId: "arctis",
    label: "Microphone (Arctis Nova Pro Wireless)",
  };

  assert.equal(
    selectPreferredDictationMic([
      {
        kind: "audioinput",
        deviceId: "webcam",
        label: "Microphone (NexiGo N60 FHD Webcam Audio)",
      },
      arctis,
    ]),
    arctis
  );
});

test("does not select output or monitor devices as dictation microphones", async () => {
  const { selectPreferredDictationMic } = await import(
    "../../src/helpers/dictationMicSelection.js"
  );

  assert.equal(
    selectPreferredDictationMic([
      {
        kind: "audioinput",
        deviceId: "monitor",
        label: "VG27B (NVIDIA High Definition Audio)",
      },
    ]),
    null
  );
});
