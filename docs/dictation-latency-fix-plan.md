# Dictation Latency Fix Plan

## Goal

Fix OpenWhispr lag for live Codex dictation, or prove a better dictation path with measured evidence.

## Worktree

- Path: `/home/geoff25/worktrees/openwhispr-dictation-latency-20260515`
- Branch: `codex/openwhispr-dictation-latency`

## First Checks

1. Measure time from hotkey press to recording start.
2. Measure time from recording stop to transcript ready.
3. Measure time from transcript ready to paste into Codex.
4. Check whether lag is caused by audio capture, transcription, clipboard/paste, Electron UI, or background model load.

## Local Model Role

Do not use local LLMs for microphone capture. Use Ollama only after transcription for:

- punctuation cleanup;
- short rewrite cleanup;
- fixing obvious OpenWhispr dictation errors;
- command formatting for Codex.

## Candidate Fixes

- Keep the speech model warm.
- Reduce startup/preload work.
- Add timing logs around hotkey, recorder, transcription, and paste.
- Prefer a fast cleanup model only after raw transcript is available.
- Keep a fallback dictation path if OpenWhispr remains unstable.

## Done

- Latency is measured before and after changes.
- The slow stage is identified.
- A repeatable smoke test proves the fix.
- The final recommendation says whether to keep OpenWhispr or switch dictation workflow.
