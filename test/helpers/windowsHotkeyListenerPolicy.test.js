const test = require("node:test");
const assert = require("node:assert/strict");

test("Windows F-key tap dictation still requires native listener", () => {
  const { shouldUseWindowsNativeListener } = require("../../src/helpers/windowsHotkeyListenerPolicy");

  assert.equal(
    shouldUseWindowsNativeListener({
      platform: "win32",
      hotkey: "F6",
      activationMode: "tap",
    }),
    true
  );
});

test("non-Windows F-key tap dictation does not require native listener", () => {
  const { shouldUseWindowsNativeListener } = require("../../src/helpers/windowsHotkeyListenerPolicy");

  assert.equal(
    shouldUseWindowsNativeListener({
      platform: "linux",
      hotkey: "F6",
      activationMode: "tap",
    }),
    false
  );
});
