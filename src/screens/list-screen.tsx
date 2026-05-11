import { Box, Text } from 'ink';
import { ConfirmPrompt } from '../components/confirm-prompt';
import { ProjectRow } from '../components/project-row';
import type { Mode, ProjectEntry } from '../types';

type ListScreenProps = {
  entries: ProjectEntry[];
  selectedIndex: number;
  missingFlags: boolean[];
  mode: Mode;
};

export function ListScreen({
  entries,
  selectedIndex,
  missingFlags,
  mode
}: ListScreenProps) {
  if (entries.length === 0) {
    return (
      <Box borderStyle="round" paddingX={1}>
        <Text dimColor>No recent projects. Press n to open a folder.</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="round" flexDirection="column" paddingX={1}>
      {entries.map((entry, index) => {
        const showConfirmDelete =
          mode.kind === 'confirmDelete' && mode.index === index;
        const showConfirmMissing =
          mode.kind === 'confirmRemoveMissing' && mode.index === index;
          
        return (
          <Box key={entry.path} flexDirection="column">
            <ProjectRow
              entry={entry}
              selected={index === selectedIndex}
              missing={missingFlags[index] === true}
            />
            {showConfirmDelete && (
              <ConfirmPrompt message="Delete this entry?" />
            )}
            {showConfirmMissing && (
              <ConfirmPrompt message="Folder missing. Remove from list?" />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
