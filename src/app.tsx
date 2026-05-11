import path from 'node:path';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { useEffect, useEffectEvent, useState } from 'react';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { pickFolder } from './folder-picker';
import { isExistingDirectory } from './paths';
import { ListScreen } from './screens/list-screen';
import { RenameScreen } from './screens/rename-screen';
import { TooNarrowScreen } from './screens/too-narrow-screen';
import {
  defaultStoreLocation,
  readEntries,
  removeAt,
  renameAt,
  upsertAndBump,
  writeEntries
} from './storage';
import { minWidth } from './theme';
import type { Mode, ProjectEntry } from './types';

type AppProps = {
  onPick: (absPath: string) => void;
};

const store = defaultStoreLocation();

function computeMissingFlags(entries: ProjectEntry[]) {
  const flags: boolean[] = [];

  for (const entry of entries) {
    flags.push(!isExistingDirectory(entry.path));
  }

  return flags;
}

function hintsFor(mode: Mode) {
  if (mode.kind === 'list') {
    return '↑↓ navigate · enter open · n new · r rename · d delete · q quit';
  }
  if (mode.kind === 'pickingFolder') {
    return 'waiting for folder selection…';
  }
  if (mode.kind === 'rename') {
    return 'enter save · esc cancel';
  }

  return 'y confirm · n / esc cancel';
}

function clamp(idx: number, len: number) {
  if (len === 0) {
    return 0;
  }
  if (idx < 0) {
    return 0;
  }
  if (idx >= len) {
    return len - 1;
  }

  return idx;
}

export function App({ onPick }: AppProps) {
  const ink = useApp();

  const { stdout } = useStdout();

  const [entries, setEntries] = useState<ProjectEntry[]>(() =>
    readEntries(store)
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [lastSaveError, setLastSaveError] = useState<string | undefined>(
    undefined
  );
  const [columns, setColumns] = useState<number>(stdout.columns);

  useEffect(() => {
    function onResize() {
      setColumns(stdout.columns);
    }

    stdout.on('resize', onResize);

    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  const pickByPath = useEffectEvent((absPath: string) => {
    const name = path.basename(absPath);
    const next = upsertAndBump(entries, absPath, name);

    setEntries(next);
    persist(next);
    onPick(absPath);

    ink.exit();
  });

  useEffect(() => {
    if (mode.kind !== 'pickingFolder') {
      return;
    }

    let cancelled = false;

    void pickFolder().then((picked) => {
      if (cancelled) {
        return;
      }

      if (picked === undefined) {
        setMode({ kind: 'list' });

        return;
      }

      pickByPath(picked);
    });

    return () => {
      cancelled = true;
    };
  }, [mode.kind]);

  const missingFlags = computeMissingFlags(entries);

  function persist(next: ProjectEntry[]) {
    try {
      writeEntries(store, next);
      setLastSaveError(undefined);
    } catch (err) {
      if (err instanceof Error) {
        setLastSaveError(err.message);
      } else {
        setLastSaveError('unknown error');
      }
    }
  }

  function pickEntry(entry: ProjectEntry) {
    const next = upsertAndBump(entries, entry.path, entry.name);

    setEntries(next);
    persist(next);
    onPick(entry.path);

    ink.exit();
  }

  function applyRemove(index: number) {
    const next = removeAt(entries, index);

    setEntries(next);
    persist(next);
    setSelectedIndex(clamp(selectedIndex, next.length));
  }

  function applyRename(index: number, name: string) {
    const next = renameAt(entries, index, name);

    setEntries(next);
    persist(next);
  }

  useInput((input, key) => {
    if (mode.kind === 'list') {
      if (key.upArrow) {
        setSelectedIndex(clamp(selectedIndex - 1, entries.length));

        return;
      }
      if (key.downArrow) {
        setSelectedIndex(clamp(selectedIndex + 1, entries.length));

        return;
      }
      if (key.return) {
        if (entries.length === 0) {
          return;
        }
        if (missingFlags[selectedIndex] === true) {
          setMode({ kind: 'confirmRemoveMissing', index: selectedIndex });

          return;
        }

        pickEntry(entries[selectedIndex]);

        return;
      }
      if (input === 'n') {
        setMode({ kind: 'pickingFolder' });

        return;
      }
      if (input === 'd' && entries.length > 0) {
        setMode({ kind: 'confirmDelete', index: selectedIndex });

        return;
      }
      if (input === 'r' && entries.length > 0) {
        setMode({
          kind: 'rename',
          index: selectedIndex,
          input: entries[selectedIndex].name,
          error: undefined
        });

        return;
      }
      if (input === 'q' || (key.ctrl && input === 'c')) {
        ink.exit();
      }

      return;
    }

    if (mode.kind === 'confirmDelete') {
      if (input === 'y') {
        applyRemove(mode.index);
        setMode({ kind: 'list' });

        return;
      }
      if (input === 'n' || key.escape) {
        setMode({ kind: 'list' });
      }

      return;
    }

    if (mode.kind === 'confirmRemoveMissing') {
      if (input === 'y') {
        applyRemove(mode.index);
        setMode({ kind: 'list' });

        return;
      }
      if (input === 'n' || key.escape) {
        setMode({ kind: 'list' });
      }

      return;
    }

    if (mode.kind === 'rename') {
      if (key.ctrl && input === 'c') {
        ink.exit();

        return;
      }
      if (key.escape) {
        setMode({ kind: 'list' });
      }

      return;
    }
  });

  if (columns < minWidth) {
    return <TooNarrowScreen />;
  }

  return (
    <Box flexDirection="column">
      <Header />
      {mode.kind === 'pickingFolder' ? (
        <Box paddingX={1}>
          <Text dimColor>Opening Windows folder picker…</Text>
        </Box>
      ) : mode.kind === 'rename' ? (
        <RenameScreen
          input={mode.input}
          error={mode.error}
          onChange={(value) => {
            setMode({
              kind: 'rename',
              index: mode.index,
              input: value,
              error: undefined
            });
          }}
          onSubmit={(value) => {
            const trimmed = value.trim();

            if (trimmed.length === 0) {
              setMode({
                kind: 'rename',
                index: mode.index,
                input: '',
                error: 'Name cannot be empty.'
              });

              return;
            }

            applyRename(mode.index, trimmed);
            setMode({ kind: 'list' });
          }}
        />
      ) : (
        <ListScreen
          entries={entries}
          selectedIndex={selectedIndex}
          missingFlags={missingFlags}
          mode={mode}
        />
      )}
      {lastSaveError !== undefined && (
        <Box paddingX={1}>
          <Text color="red" dimColor>
            Failed to save: {lastSaveError}
          </Text>
        </Box>
      )}
      <Footer hints={hintsFor(mode)} />
    </Box>
  );
}
