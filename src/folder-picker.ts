const script = [
  'Add-Type -AssemblyName System.Windows.Forms',
  '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog',
  `$dialog.Description = 'Select a project folder'`,
  '$dialog.UseDescriptionForTitle = $true',
  '$dialog.ShowNewFolderButton = $true',
  '$dialog.RootFolder = [System.Environment+SpecialFolder]::MyComputer',
  `$dialog.SelectedPath = [System.Environment]::GetFolderPath('UserProfile')`,
  'if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {',
  '  Write-Output $dialog.SelectedPath',
  '}'
].join('\n');

export async function pickFolder() {
  try {
    const proc = Bun.spawn({
      cmd: [
        'powershell.exe',
        '-NoProfile',
        '-NonInteractive',
        '-STA',
        '-WindowStyle',
        'Hidden',
        '-Command',
        script
      ],
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe',
      windowsHide: true
    });

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      return undefined;
    }

    const stdout = await new Response(proc.stdout).text();

    const trimmed = stdout.trim();

    if (trimmed.length === 0) {
      return undefined;
    }

    const lines = trimmed.split(/\r?\n/);
    const first = lines[0].trim();

    if (first.length === 0) {
      return undefined;
    }
    
    return first;
  } catch {
    return undefined;
  }
}
