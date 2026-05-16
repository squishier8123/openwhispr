const test = require("node:test");
const assert = require("node:assert/strict");

const { buildConvertToWavArgs } = require("../../src/helpers/ffmpegUtils");

test("builds plain mono 16k wav conversion args", () => {
  assert.deepEqual(buildConvertToWavArgs("in.webm", "out.wav"), [
    "-i",
    "in.webm",
    "-ar",
    "16000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    "-y",
    "out.wav",
  ]);
});

test("adds audio normalization filter before wav encoding args", () => {
  assert.deepEqual(
    buildConvertToWavArgs("in.webm", "out.wav", {
      audioFilters: "highpass=f=100,dynaudnorm=f=75",
    }),
    [
      "-i",
      "in.webm",
      "-af",
      "highpass=f=100,dynaudnorm=f=75",
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      "-y",
      "out.wav",
    ]
  );
});
