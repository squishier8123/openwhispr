const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  buildModeReport,
} = require("../../src/helpers/dictationDoctorProfiles");

test("reports installed app provider drift from the preferred local Parakeet path", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ow-doctor-profiles-"));
  const installedEnv = path.join(tempDir, "installed.env");
  const developmentEnv = path.join(tempDir, "development.env");

  fs.writeFileSync(
    installedEnv,
    [
      "LOCAL_TRANSCRIPTION_PROVIDER=whisper",
      "LOCAL_WHISPER_MODEL=base",
      "DICTATION_KEY=F6",
    ].join("\n"),
  );
  fs.writeFileSync(
    developmentEnv,
    [
      "LOCAL_TRANSCRIPTION_PROVIDER=nvidia",
      "PARAKEET_MODEL=parakeet-unified-en-0.6b",
      "DICTATION_KEY=F6",
    ].join("\n"),
  );

  const report = buildModeReport({
    envFiles: [
      { label: "installed", path: installedEnv },
      { label: "development", path: developmentEnv },
    ],
    preferredLocalProvider: "nvidia",
  });

  assert.equal(report.activeProfile.label, "installed");
  assert.equal(report.activeProfile.localTranscriptionProvider, "whisper");
  assert.equal(report.providerDrift.detected, true);
  assert.match(report.providerDrift.message, /installed app is set to whisper/i);
});

test("does not report provider drift when installed app already uses Parakeet", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ow-doctor-profiles-"));
  const installedEnv = path.join(tempDir, "installed.env");

  fs.writeFileSync(
    installedEnv,
    [
      "LOCAL_TRANSCRIPTION_PROVIDER=nvidia",
      "PARAKEET_MODEL=parakeet-unified-en-0.6b",
      "DICTATION_KEY=F6",
    ].join("\n"),
  );

  const report = buildModeReport({
    envFiles: [{ label: "installed", path: installedEnv }],
    preferredLocalProvider: "nvidia",
  });

  assert.equal(report.activeProfile.label, "installed");
  assert.equal(report.providerDrift.detected, false);
});
