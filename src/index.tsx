import { render } from 'ink';
import { App } from './app';
import { launchClaudeCode } from './launcher';

process.stdout.write('\x1b]0;Claude Code Launcher\x07');

let picked: string | undefined;

const ink = render(
  <App
    onPick={(absPath) => {
      picked = absPath;
    }}
  />
);

await ink.waitUntilExit();

if (picked === undefined) {
  process.exit(0);
}

const { exitCode } = await launchClaudeCode(picked);

process.exit(exitCode);
