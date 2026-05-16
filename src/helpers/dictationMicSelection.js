const NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;

const includesAny = (label, terms) => terms.some((term) => label.includes(term));

export function scoreDictationMicLabel(label) {
  const normalized = typeof label === "string" ? label.trim().toLowerCase() : "";
  if (!normalized) return 0;

  if (
    includesAny(normalized, [
      "stereo mix",
      "what u hear",
      "speaker",
      "monitor",
      "nvidia",
      "digital output",
    ])
  ) {
    return NEGATIVE_INFINITY;
  }

  let score = 0;

  if (includesAny(normalized, ["arctis", "steelseries", "nova"])) score += 160;
  if (includesAny(normalized, ["razer", "headset", "headphones"])) score += 110;
  if (includesAny(normalized, ["yeti", "shure", "rode", "elgato", "wave"])) score += 100;
  if (includesAny(normalized, ["usb"])) score += 30;
  if (includesAny(normalized, ["wireless", "bluetooth"])) score += 20;
  if (includesAny(normalized, ["microphone", "mic"])) score += 5;

  if (includesAny(normalized, ["webcam", "camera", "nexigo"])) score -= 45;
  if (includesAny(normalized, ["built-in", "internal", "integrated"])) score -= 10;

  return score;
}

export function selectPreferredDictationMic(devices) {
  const candidates = (devices || [])
    .filter((device) => device?.kind === "audioinput" && device.deviceId)
    .map((device, index) => ({
      device,
      index,
      score: scoreDictationMicLabel(device.label),
    }))
    .filter((candidate) => Number.isFinite(candidate.score) && candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return candidates[0]?.device || null;
}
