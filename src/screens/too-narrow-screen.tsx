import { Box, Text } from 'ink';

export function TooNarrowScreen() {
  return (
    <Box paddingX={1}>
      <Text>Terminal too narrow — please resize to 60+ columns.</Text>
    </Box>
  );
}
