export const MIN_DICTATION_AUDIO_BYTES = 1024;
export const MIN_DICTATION_DURATION_MS = 650;

export function getDictationAudioReadiness(audioBlob, metadata = {}) {
  const size = audioBlob?.size ?? audioBlob?.byteLength ?? audioBlob?.length ?? 0;
  const durationMs =
    typeof metadata.durationSeconds === "number" ? metadata.durationSeconds * 1000 : null;

  if (size <= 0) {
    return { ready: false, reason: "empty_audio", size, durationMs };
  }

  if (size < MIN_DICTATION_AUDIO_BYTES) {
    return { ready: false, reason: "audio_too_small", size, durationMs };
  }

  if (durationMs !== null && durationMs < MIN_DICTATION_DURATION_MS) {
    return { ready: false, reason: "audio_too_short", size, durationMs };
  }

  return { ready: true, reason: "ready", size, durationMs };
}

export function shouldFallbackFromParakeet(settings, error) {
  if (!settings?.useLocalWhisper || settings.localTranscriptionProvider !== "nvidia") {
    return false;
  }
  if (!settings.allowLocalFallback) {
    return false;
  }

  const message = error?.message || "";
  return !/No audio detected/i.test(message);
}
