import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {verifyWindowsRuntimeFile} from './stage-windows-desktop.mjs';
import {pinnedNode as pinned} from './stage-windows-desktop.mjs';
test('a tampered cached runtime is rejected before extraction or execution',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'tafelraum-node-integrity-'));
 const file=path.join(directory,pinned.archive);
 await writeFile(file,'corrupted downloaded runtime');
 await assert.rejects(verifyWindowsRuntimeFile(file,pinned.archiveSha256),/checksum mismatch/);
});
