const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const electronMock = {
  clipboard: {
    writeText: () => {},
  },
  systemPreferences: {},
};
const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === "electron") return electronMock;
  return originalLoad.call(this, request, parent, isMain);
};
const ClipboardManager = require("../../src/helpers/clipboard");
Module._load = originalLoad;

function withPlatform(platform, fn) {
  const descriptor = Object.getOwnPropertyDescriptor(process, "platform");
  Object.defineProperty(process, "platform", { value: platform });

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      Object.defineProperty(process, "platform", descriptor);
    });
}

test("Windows paste returns manual fallback result when clipboard fallback is allowed", async () => {
  await withPlatform("win32", async () => {
    const manager = new ClipboardManager();
    const writes = [];

    manager._saveClipboard = () => ({ type: "text", data: "before" });
    manager.pasteWindows = async () => {
      throw new Error("target app rejected paste");
    };
    manager.safeLog = () => {};

    const originalWriteText = electronMock.clipboard.writeText;
    electronMock.clipboard.writeText = (text) => writes.push(text);

    try {
      const result = await manager.pasteText("hello boss", {
        allowClipboardFallback: true,
      });

      assert.deepEqual(result, {
        success: true,
        pasted: false,
        copiedToClipboard: true,
        manualPasteRequired: true,
        platform: "win32",
        method: "clipboard",
        error: "target app rejected paste",
      });
      assert.deepEqual(writes, ["hello boss"]);
    } finally {
      electronMock.clipboard.writeText = originalWriteText;
    }
  });
});
