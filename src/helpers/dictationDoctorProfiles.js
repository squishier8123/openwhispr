const fs = require("fs");

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function parseEnvFile(filePath) {
  const values = {};
  for (const line of readText(filePath).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    values[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return values;
}

function profileFromEnvFile(profile) {
  const env = parseEnvFile(profile.path);
  return {
    label: profile.label,
    path: profile.path,
    exists: fs.existsSync(profile.path),
    dictationKey: env.DICTATION_KEY || null,
    activationMode: env.ACTIVATION_MODE || null,
    lightModeEnabled: env.LIGHT_MODE_ENABLED !== "false",
    localTranscriptionProvider: env.LOCAL_TRANSCRIPTION_PROVIDER || null,
    whisperModel: env.LOCAL_WHISPER_MODEL || null,
    parakeetModel: env.PARAKEET_MODEL || null,
  };
}

function buildProviderDrift(activeProfile, preferredLocalProvider = "nvidia") {
  if (!activeProfile?.exists) {
    return {
      detected: false,
      message: null,
    };
  }

  const actualProvider = activeProfile.localTranscriptionProvider;
  const detected = !!actualProvider && actualProvider !== preferredLocalProvider;
  return {
    detected,
    message: detected
      ? `${activeProfile.label} app is set to ${actualProvider}; preferred zero-cost reliability path is ${preferredLocalProvider}.`
      : null,
  };
}

function buildModeReport(options = {}) {
  const profiles = (options.envFiles || []).map(profileFromEnvFile);
  const activeProfile = profiles.find((profile) => profile.exists) || null;
  const providerDrift = buildProviderDrift(activeProfile, options.preferredLocalProvider);

  return {
    envFile: activeProfile?.path || null,
    dictationKey: activeProfile?.dictationKey || null,
    activationMode: activeProfile?.activationMode || null,
    lightModeEnabled: activeProfile?.lightModeEnabled ?? true,
    localTranscriptionProvider: activeProfile?.localTranscriptionProvider || null,
    parakeetModel: activeProfile?.parakeetModel || null,
    activeProfile,
    profiles,
    providerDrift,
  };
}

module.exports = {
  buildModeReport,
  parseEnvFile,
};
