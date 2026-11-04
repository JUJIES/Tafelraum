import path from 'node:path';

// Git for Windows can precede System32 on PATH. Its GNU tar interprets C: as
// a remote host. Use the Windows-provided bsdtar for native Windows paths.
export const archiveTar = process.platform === 'win32'
  ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')
  : 'tar';
