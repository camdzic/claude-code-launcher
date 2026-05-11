import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { errorColor } from '../theme';

type RenameScreenProps = {
  input: string;
  error: string | undefined;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
};

export function RenameScreen({
  input,
  error,
  onChange,
  onSubmit
}: RenameScreenProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text>Name: </Text>
        <TextInput value={input} onChange={onChange} onSubmit={onSubmit} />
      </Box>
      {error !== undefined && (
        <Box>
          <Text color={errorColor}>{error}</Text>
        </Box>
      )}
    </Box>
  );
}
