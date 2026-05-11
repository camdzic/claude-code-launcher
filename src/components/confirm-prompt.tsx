import { Box, Text } from 'ink';

type ConfirmPromptProps = {
  message: string;
};

export function ConfirmPrompt({ message }: ConfirmPromptProps) {
  return (
    <Box>
      <Text>{'  '}</Text>
      <Text>{message} </Text>
      <Text dimColor>(y/N)</Text>
    </Box>
  );
}
