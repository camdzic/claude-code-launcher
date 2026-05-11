import { statSync } from 'node:fs';

export function isExistingDirectory(absPath: string) {
  try {
    return statSync(absPath).isDirectory();
  } catch {
    return false;
  }
}

export function canonicalize(absPath: string) {
  return absPath.toLowerCase();
}
