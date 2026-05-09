function isRetryableSidecarReset(error) {
  const message = error?.message || String(error || "");
  return /(?:ECONNRESET|ECONNREFUSED|socket hang up|server is not running|WebSocket.*closed|asio\.system:10058)/i.test(
    message,
  );
}

async function transcribeWithSidecarRecovery(options) {
  const { transcribe, restart, onRetry } = options;

  try {
    return await transcribe();
  } catch (error) {
    if (!isRetryableSidecarReset(error)) {
      throw error;
    }

    await onRetry?.(error);
    await restart();
    return transcribe();
  }
}

function formatSidecarFailure(serviceName, error) {
  const message = error?.message || String(error || "Unknown error");
  return {
    success: false,
    error: "local_sidecar_connection_reset",
    message: `${serviceName} local service stopped responding. OpenWhispr restarted it once, but this dictation still failed. Try again; if it repeats, switch to Parakeet or restart OpenWhispr.`,
    detail: message,
  };
}

module.exports = {
  formatSidecarFailure,
  isRetryableSidecarReset,
  transcribeWithSidecarRecovery,
};
