import { Box, Text } from 'ink';
import { accent, errorColor } from '../theme';
import type { ProjectEntry } from '../types';

type ProjectRowProps = {
  entry: ProjectEntry;
  selected: boolean;
  missing: boolean;
};

export function ProjectRow({ entry, selected, missing }: ProjectRowProps) {
  const prefix = selected ? '▶ ' : '  ';
  
  return (
    <Box flexDirection="column">
      <Box>
        <Text color={selected ? accent : undefined}>{prefix}</Text>
        <Text bold={selected} color={selected ? accent : undefined}>
          {entry.name}
        </Text>
        {missing && <Text color={errorColor}> (missing)</Text>}
      </Box>
      <Box>
        <Text>{'  '}</Text>
        <Text dimColor>{entry.path}</Text>
      </Box>
    </Box>
  );
}
