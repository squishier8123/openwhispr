const test = require("node:test");
const assert = require("node:assert/strict");

const ParakeetManager = require("../../src/helpers/parakeet.js");

test("uses downloaded default Parakeet model when selected model is stale", () => {
  const manager = new ParakeetManager();
  manager.serverManager = {
    isModelDownloaded: (modelName) => modelName === "parakeet-unified-en-0.6b",
  };

  assert.equal(
    manager.resolveDownloadedModel("parakeet-tdt-0.6b-v3"),
    "parakeet-unified-en-0.6b"
  );
});

test("keeps selected Parakeet model when it is downloaded", () => {
  const manager = new ParakeetManager();
  manager.serverManager = {
    isModelDownloaded: (modelName) => modelName === "parakeet-tdt-0.6b-v3",
  };

  assert.equal(
    manager.resolveDownloadedModel("parakeet-tdt-0.6b-v3"),
    "parakeet-tdt-0.6b-v3"
  );
});
