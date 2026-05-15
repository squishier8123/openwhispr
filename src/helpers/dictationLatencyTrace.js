let nextTraceNumber = 1;

const getNow = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

export const createDictationLatencyTrace = (trigger = "dictation") => {
  const traceNumber = nextTraceNumber++;
  return {
    id: `dictation-${Date.now()}-${traceNumber}`,
    trigger,
    startedAt: getNow(),
    marks: [],
  };
};

export const markDictationLatencyTrace = (trace, stage, detail = {}) => {
  if (!trace) return null;

  const mark = {
    stage,
    elapsedMs: Math.round(getNow() - trace.startedAt),
    ...detail,
  };
  trace.marks.push(mark);
  return mark;
};

export const getDictationLatencyTraceSnapshot = (trace, status = "active", detail = {}) => {
  if (!trace) return null;

  return {
    traceId: trace.id,
    trigger: trace.trigger,
    status,
    totalMs: Math.round(getNow() - trace.startedAt),
    marks: trace.marks.map((mark) => ({ ...mark })),
    ...detail,
  };
};
