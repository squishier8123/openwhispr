function resolveStartupTranscriptionPrefs(env = process.env) {
  const provider = env.LOCAL_TRANSCRIPTION_PROVIDER;
  if (provider === "nvidia") {
    return {
      useLocalWhisper: true,
      localTranscriptionProvider: "nvidia",
      parakeetModel: env.PARAKEET_MODEL || "parakeet-unified-en-0.6b",
    };
  }

  if (provider === "whisper") {
    return {
      useLocalWhisper: true,
      localTranscriptionProvider: "whisper",
      whisperModel: env.LOCAL_WHISPER_MODEL || "base",
    };
  }

  return {
    useLocalWhisper: true,
    localTranscriptionProvider: "nvidia",
    parakeetModel: env.PARAKEET_MODEL || "parakeet-unified-en-0.6b",
  };
}

module.exports = {
  resolveStartupTranscriptionPrefs,
};
