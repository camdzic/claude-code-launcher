const result = await Bun.build({
  entrypoints: ['src/index.tsx'],
  compile: {
    target: 'bun-windows-x64',
    outfile: 'dist/claude-code-launcher.exe',
    windows: {
      title: 'Claude Code Launcher',
      icon: 'assets/claude-icon.ico'
    }
  }
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }

  process.exit(1);
}

const built = result.outputs[0];

if (built !== undefined) {
  console.log(`Built ${built.path}`);
}
