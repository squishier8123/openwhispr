const test = require("node:test");
const assert = require("node:assert/strict");

test("prefers the always-ready NexiGo mic over headset microphones", async () => {
  const { selectPreferredDictationMic } = await import(
    "../../src/helpers/dictationMicSelection.js"
  );

  const nexigo = {
    kind: "audioinput",
    deviceId: "nexigo",
    label: "Microphone (NexiGo N60 FHD Webcam Audio)",
  };
  const arctis = {
    kind: "audioinput",
    deviceId: "arctis",
    label: "Microphone (Arctis Nova Pro Wireless)",
  };

  assert.equal(selectPreferredDictationMic([arctis, nexigo]), nexigo);
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
