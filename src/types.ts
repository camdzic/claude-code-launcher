export type ProjectEntry = {
  path: string;
  name: string;
  lastOpened: number;
};

export type Mode =
  | { kind: 'list' }
  | { kind: 'confirmDelete'; index: number }
  | { kind: 'confirmRemoveMissing'; index: number }
  | { kind: 'pickingFolder' }
  | { kind: 'rename'; index: number; input: string; error?: string };
