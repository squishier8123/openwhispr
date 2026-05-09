function isGlobeLikeHotkey(hotkey) {
  return /^GLOBE$|^Fn$/i.test(String(hotkey || ""));
}

function isModifierOnlyHotkey(hotkey) {
  return /^(Control|Ctrl|Alt|Option|Shift|Super|Win|Meta|Command|Cmd)$/i.test(
    String(hotkey || "")
  );
}

function isRightSideModifier(hotkey) {
  return /^Right(Control|Ctrl|Alt|Option|Shift|Super|Win|Meta|Command|Cmd)$/i.test(
    String(hotkey || "")
  );
}

function shouldUseWindowsNativeListener({
  platform = process.platform,
  hotkey,
  activationMode = "tap",
} = {}) {
  if (platform !== "win32") return false;
  if (!hotkey || isGlobeLikeHotkey(hotkey)) return false;

  if (activationMode === "push") return true;
  if (isModifierOnlyHotkey(hotkey) || isRightSideModifier(hotkey)) return true;

  // Windows function-key dictation uses the native listener even in tap mode.
  return true;
}

module.exports = {
  shouldUseWindowsNativeListener,
};
