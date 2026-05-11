import { Box, Text } from 'ink';

type FooterProps = {
  hints: string;
};

export function Footer({ hints }: FooterProps) {
  return (
    <Box paddingX={1}>
      <Text dimColor>{hints}</Text>
    </Box>
  );
}
