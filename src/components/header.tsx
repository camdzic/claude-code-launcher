import { Box, Text } from 'ink';
import { accent } from '../theme';

export function Header() {
  return (
    <Box paddingX={1}>
      <Text bold color={accent}>
        Claude Code Launcher
      </Text>
    </Box>
  );
}
