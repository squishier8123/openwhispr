#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const modelRegistry = require("../src/models/modelRegistryData.json");

function exists(filePath) {
  return !!filePath && fs.existsSync(filePath);
}

function findFirst(candidates) {
  return candidates.find(exists) || null;
}

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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function existingDirs(candidates) {
  return unique(candidates).filter((candidate) => {
    try {
      return fs.existsSync(candidate) && fs.statSync(candidate).isDirectory();
    } catch {
      return false;
    }
  });
}

function windowsUserProfiles() {
  const usersRoot = "/mnt/c/Users";
  if (!fs.existsSync(usersRoot)) return [];

  return fs
    .readdirSync(usersRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(usersRoot, entry.name));
}

function cacheRoots() {
  return existingDirs([
    path.join(os.homedir(), ".cache", "openwhispr"),
    process.env.OPENWHISPR_CACHE_DIR,
    ...windowsUserProfiles().map((profile) => path.join(profile, ".cache", "openwhispr")),
  ]);
}

function resourceBins() {
  return existingDirs([
    path.join(rootDir, "resources", "bin"),
    process.env.OPENWHISPR_RESOURCE_BIN,
    "/mnt/c/Program Files/OpenWhispr/resources/bin",
    "/mnt/c/Program Files (x86)/OpenWhispr/resources/bin",
    ...windowsUserProfiles().map((profile) =>
      path.join(profile, "AppData", "Local", "Programs", "openwhispr", "resources", "bin"),
    ),
    ...windowsUserProfiles().map((profile) =>
      path.join(profile, "AppData", "Local", "OpenWhispr", "resources", "bin"),
    ),
  ]);
}

function windowsAppDataEnvFiles() {
  return windowsUserProfiles().map((profile) =>
    path.join(profile, "AppData", "Roaming", "OpenWhispr-development", ".env"),
  );
}

function currentMode() {
  const envFile = findFirst([path.join(rootDir, ".env"), ...windowsAppDataEnvFiles()]);
  const env = { ...process.env, ...parseEnvFile(envFile) };
  return {
    envFile,
    dictationKey: env.DICTATION_KEY || null,
    activationMode: env.ACTIVATION_MODE || null,
    lightModeEnabled: env.LIGHT_MODE_ENABLED !== "false",
    localTranscriptionProvider: env.LOCAL_TRANSCRIPTION_PROVIDER || null,
    parakeetModel: env.PARAKEET_MODEL || null,
  };
}

function runPowerShell(command) {
  const { execFileSync } = require("child_process");
  try {
    return execFileSync("powershell.exe", ["-NoProfile", "-Command", command], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
  } catch {
    return "";
  }
}

function checkHotkeyListener() {
  const command = [
    "Get-CimInstance Win32_Process",
    "| Where-Object { $_.Name -eq 'windows-key-listener.exe' }",
    "| Select-Object -First 1 -ExpandProperty CommandLine",
  ].join(" ");
  const commandLine = process.platform === "win32" || fs.existsSync("/mnt/c")
    ? runPowerShell(command)
    : "";
  return {
    expectedKey: "F6",
    running: !!commandLine,
    commandLine: commandLine || null,
    listeningForExpectedKey: /\bF6\b/i.test(commandLine),
  };
}

function checkMicAccess() {
  const logPath = findFirst([
    path.join(rootDir, ".tmp", "codex-dev-out.log"),
    "/mnt/c/Users/Geoff/Documents/openwhispr-windows-dev/.tmp/codex-dev-out.log",
  ]);
  const logText = readText(logPath);
  return {
    recentSuccess: /Recording started with microphone/i.test(logText),
    logPath,
  };
}

function platformBinary(base) {
  const ext = process.platform === "win32" ? ".exe" : "";
  return `${base}-${process.platform}-${process.arch}${ext}`;
}

function checkWhisper() {
  const baseModel = modelRegistry.whisperModels.base;
  const modelPath = findFirst(cacheRoots().map((root) => path.join(root, "whisper-models", baseModel.fileName)));
  const binary = findFirst([
    ...resourceBins().map((binDir) => path.join(binDir, platformBinary("whisper-server"))),
    ...resourceBins().map((binDir) => path.join(binDir, "whisper-server-win32-x64.exe")),
    ...resourceBins().map((binDir) => path.join(binDir, "whisper-server-linux-x64")),
    ...resourceBins().map((binDir) => path.join(binDir, process.platform === "win32" ? "whisper-server.exe" : "whisper-server")),
  ]);

  return {
    binary: !!binary,
    binaryPath: binary,
    baseModel: exists(modelPath),
    baseModelPath: modelPath,
  };
}

function checkParakeet() {
  const model = "parakeet-unified-en-0.6b";
  const requiredFiles = ["encoder.int8.onnx", "decoder.int8.onnx", "joiner.int8.onnx", "tokens.txt"];
  const modelDir = findFirst(
    cacheRoots().map((root) => path.join(root, "parakeet-models", model)).filter((candidate) =>
      requiredFiles.every((file) => exists(path.join(candidate, file))),
    ),
  );
  const binary = findFirst([
    ...resourceBins().map((binDir) => path.join(binDir, platformBinary("sherpa-onnx-ws"))),
    ...resourceBins().map((binDir) => path.join(binDir, "sherpa-onnx-ws-win32-x64.exe")),
    ...resourceBins().map((binDir) => path.join(binDir, "sherpa-onnx-ws-linux-x64")),
    ...resourceBins().map((binDir) => path.join(binDir, process.platform === "win32" ? "sherpa-onnx-ws.exe" : "sherpa-onnx-ws")),
  ]);

  return {
    binary: !!binary,
    binaryPath: binary,
    model,
    modelReady: !!modelDir,
    modelDir,
  };
}

function checkFfmpeg() {
  const staticPath = (() => {
    try {
      return require("ffmpeg-static");
    } catch {
      return null;
    }
  })();

  return {
    available: !!findFirst([
      staticPath,
      "/usr/bin/ffmpeg",
      "/usr/local/bin/ffmpeg",
      "C:\\ffmpeg\\bin\\ffmpeg.exe",
      "/mnt/c/ffmpeg/bin/ffmpeg.exe",
    ]),
    path: findFirst([staticPath, "/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg", "C:\\ffmpeg\\bin\\ffmpeg.exe", "/mnt/c/ffmpeg/bin/ffmpeg.exe"]),
  };
}

function main() {
  const whisper = checkWhisper();
  const parakeet = checkParakeet();
  const ffmpeg = checkFfmpeg();
  const mode = currentMode();
  const hotkey = checkHotkeyListener();
  const mic = checkMicAccess();
  const blockers = [];

  if (!ffmpeg.available) blockers.push("FFmpeg missing");
  if (!whisper.binary) blockers.push("Whisper server binary missing");
  if (!whisper.baseModel) blockers.push("Whisper base model missing");
  if (hotkey.running && !hotkey.listeningForExpectedKey) {
    blockers.push("Windows hotkey listener is running but not listening for F6");
  }

  const report = {
    dictationReady: blockers.length === 0,
    blockers,
    checkedPaths: {
      cacheRoots: cacheRoots(),
      resourceBins: resourceBins(),
    },
    lightModeDefault: true,
    mode,
    hotkey,
    mic,
    whisper,
    parakeet,
    ffmpeg,
    notes: [
      "Parakeet is preferred for fast local English dictation when ready.",
      "Whisper base is the reliability fallback and is treated as required.",
    ],
  };

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.dictationReady ? 0 : 1;
}

main();
