# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bun run build` — compile to `dist/claude-code-launcher.exe` via Bun's `--compile` (target `bun-windows-x64`, see `scripts/build.ts`)
- `bun run tsc` — type-check (no emit)
- `bun run biome` — format + lint with autofix (`biome check --write`)

A `lefthook` pre-commit hook runs two sequential steps (`piped: true`): `biome check --write` on staged `*.{ts,tsx,js,jsx,cjs,mjs,json,jsonc}` files (re-stages fixes), then `bunx tsc --noEmit` over the whole project when any `*.{ts,tsx}` files are staged. Either failing aborts the commit. The repo is Windows-only (`"os": ["win32"]` in `package.json`); the Bun compile target is hard-coded to `bun-windows-x64`.

### Commands you must NOT run

The owner runs these manually — do not invoke them, even if asked indirectly. Surface the command for them to run instead.

- `bun run start` / `bun src/index.ts` / `bun run src/index.ts` — anything that boots the TUI (interactive; would hang the session)
- `bun install` (unless the owner explicitly says "install dependencies")
- editing `bun.lock` directly

`bun run build`, `bun run tsc`, and `bun run biome` are the only exceptions.

## Architecture

**Two-phase process lifecycle.** `src/index.tsx` renders the Ink TUI and awaits `ink.waitUntilExit()`. The selected path is captured via the `onPick` callback (not a return value) because Ink owns the terminal until it exits. After Ink exits, `launchClaudeCode(picked)` from `src/launcher.ts` spawns `claude --model opus --effort max` with inherited stdio, then calls `FreeConsole` (via `bun:ffi` to `kernel32.dll`) to detach from the parent console so Claude Code can take over the terminal cleanly.

**State machine in `src/app.tsx`.** `App` is the central reducer. UI state is a discriminated `Mode` union (`src/types.ts`): `list`, `confirmDelete`, `confirmRemoveMissing`, `pickingFolder`, `rename`. `useInput` dispatches keystrokes per-mode; rendering picks a sub-screen from `src/screens/`. All mutations go through `storage.ts` helpers (`upsertAndBump`, `removeAt`, `renameAt`) and are persisted by `persist()` after every state change.

**Storage (`src/storage.ts`).** Entries live at `%USERPROFILE%\.claude-code-launcher\recent.json`, capped at `maxEntries` (15, in `src/theme.ts`), sorted by `lastOpened` descending. Writes are atomic (temp file + `renameSync`). If the file is unparseable or fails schema validation (`isProjectEntryArray`), it's moved to `recent.json.bak` and the store resets to empty. Path identity uses `canonicalize()` (lowercase) since Windows paths are case-insensitive.

**Folder picker (`src/folder-picker.ts`).** Shells out to PowerShell with `-STA -WindowStyle Hidden` to show a `System.Windows.Forms.FolderBrowserDialog`. STA is required for WinForms dialogs; do not remove it.

## Conventions

- Biome formatter: single quotes, semicolons, no trailing commas, LF line endings.
- Enforced lints worth knowing: `noFloatingPromises`, `noForEach`, `useExplicitLengthCheck` (use `arr.length > 0`, not truthy checks), `useBlockStatements`, `useNodejsImportProtocol` (`node:fs`, not `fs`), `useDateNow`, `useAwait`.
- React 19 — `useEffectEvent` is used in `app.tsx`. JSX runtime is `react-jsx`.
- The terminal renders a "too narrow" fallback below `minWidth` (60 columns, `src/theme.ts`).

## Commits

Conventional Commits, terse, lowercase.

- Prefix with one of: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `build:`, `ci:`, `revert:`. Omit scope (`feat(x):`) — keep it simple.
- Aim for ~6–7 words after the prefix. Slightly more is fine if a single extra word avoids ambiguity, slightly fewer is fine if intent is already clear.
- Subject only. Add a body only when the *why* is non-obvious from the diff.
- Lowercase prose; preserve identifier case (`CLAUDE.md`, `NODE_ENV`, code symbols, file names).
- Imperative mood (`add x`, not `added x`). No trailing period.

**Split per concern.** Prefer many focused commits over one bundled commit. When the working tree contains changes spanning unrelated files, systems, or features, make separate commits — one per concern — and push the series at the end. Don't squash unrelated work into a single commit just because it happened in one session.

**Commit/push everything.** When asked to commit or push, include all working-tree changes — even files modified outside the current session. Don't leave outside-session edits aside as "not yours". The split-per-concern rule still applies: each unrelated bucket gets its own commit.
