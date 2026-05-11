import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { canonicalize } from './paths';
import { maxEntries } from './theme';
import type { ProjectEntry } from './types';

export type StoreLocation = {
  dir: string;
  file: string;
  backup: string;
};

export function defaultStoreLocation() {
  const dir = path.join(homedir(), '.claude-code-launcher');

  return {
    dir,
    file: path.join(dir, 'recent.json'),
    backup: path.join(dir, 'recent.json.bak')
  };
}

export function readEntries(loc: StoreLocation) {
  const empty: ProjectEntry[] = [];

  let raw: string;

  try {
    raw = readFileSync(loc.file, 'utf8');
  } catch {
    return empty;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    backupAndReset(loc);

    return empty;
  }

  if (!isProjectEntryArray(parsed)) {
    backupAndReset(loc);

    return empty;
  }

  const sorted = parsed.slice().sort((a, b) => b.lastOpened - a.lastOpened);

  return sorted.slice(0, maxEntries);
}

export function writeEntries(loc: StoreLocation, entries: ProjectEntry[]) {
  mkdirSync(loc.dir, { recursive: true });

  const tmp = `${loc.file}.tmp`;

  writeFileSync(tmp, JSON.stringify(entries, null, 2));
  renameSync(tmp, loc.file);
}

export function upsertAndBump(
  entries: ProjectEntry[],
  absPath: string,
  name: string
) {
  const key = canonicalize(absPath);
  const filtered = entries.filter((e) => canonicalize(e.path) !== key);
  const next: ProjectEntry = { path: absPath, name, lastOpened: Date.now() };

  return [next, ...filtered].slice(0, maxEntries);
}

export function removeAt(entries: ProjectEntry[], index: number) {
  if (index < 0 || index >= entries.length) {
    return entries;
  }

  const next = entries.slice();

  next.splice(index, 1);

  return next;
}

export function renameAt(entries: ProjectEntry[], index: number, name: string) {
  if (index < 0 || index >= entries.length) {
    return entries;
  }

  const next = entries.slice();

  next[index] = { ...next[index], name };

  return next;
}

function backupAndReset(loc: StoreLocation) {
  try {
    renameSync(loc.file, loc.backup);
  } catch {}
}

function isProjectEntryArray(value: unknown): value is ProjectEntry[] {
  if (!Array.isArray(value)) {
    return false;
  }

  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    
    const e = item as Record<string, unknown>;

    if (typeof e.path !== 'string') {
      return false;
    }
    if (typeof e.name !== 'string') {
      return false;
    }
    if (typeof e.lastOpened !== 'number') {
      return false;
    }
  }

  return true;
}
