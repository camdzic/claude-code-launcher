import { dlopen, FFIType } from 'bun:ffi';
import { spawnSync } from 'node:child_process';

function findClaudePath() {
  const result = spawnSync('where', ['claude'], { encoding: 'utf8' });

  if (result.status !== 0) {
    return undefined;
  }

  const trimmed = result.stdout.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const lines = trimmed.split(/\r?\n/);

  return lines[0].trim();
}

function loadFreeConsole() {
  try {
    const lib = dlopen('kernel32.dll', {
      FreeConsole: { args: [], returns: FFIType.bool }
    });

    return lib.symbols.FreeConsole;
  } catch {
    return undefined;
  }
}

const freeConsole = loadFreeConsole();

function detachParentConsole() {
  if (freeConsole === undefined) {
    return;
  }

  try {
    freeConsole();
  } catch {}
}

export async function launchClaudeCode(cwd: string) {
  const claudePath = findClaudePath();

  if (claudePath === undefined) {
    process.stdout.write(
      ` Claude Code not found. Install it and ensure 'claude' is on your PATH.\n`
    );

    return { exitCode: 1 };
  }

  if (typeof process.stdin.setRawMode === 'function') {
    process.stdin.setRawMode(false);
  }

  process.stdout.write('\n');

  const proc = Bun.spawn({
    cmd: [claudePath, '--model', 'opus', '--effort', 'max'],
    cwd,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit'
  });

  detachParentConsole();

  const code = await proc.exited;

  if (typeof code === 'number') {
    return { exitCode: code };
  }

  return { exitCode: 1 };
}
