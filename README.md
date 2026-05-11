# Claude Code Launcher

Windows TUI for picking a recent project folder and launching Claude Code in it

## Requirements

- Windows 10/11
- [Bun](https://bun.com) >= 1.3.10
- [Claude Code](https://claude.com/claude-code) on `PATH`

## Build

```
bun install
bun run build
```

Produces `dist\claude-code-launcher.exe`.

## Add to PATH

To run `claude-code-launcher` from any directory, add the `dist` folder to your user `PATH`. In PowerShell from the repo root:

```powershell
$dir = (Resolve-Path .\dist).Path
$old = [Environment]::GetEnvironmentVariable('Path', 'User')
[Environment]::SetEnvironmentVariable('Path', "$old;$dir", 'User')
```

Open a new terminal for the change to take effect, then run `claude-code-launcher` from anywhere.

## Use

Run the `.exe`. Keys:

- arrows: navigate
- enter: open the highlighted project in Claude Code (`claude --model opus --effort max`)
- `n`: add a new project via Windows folder picker
- `r`: rename the highlighted entry
- `d`: delete the highlighted entry
- `q` / `Ctrl+C`: quit

Recent projects are stored in `%USERPROFILE%\.claude-code-launcher\recent.json` (max 15, sorted by most-recently opened).
