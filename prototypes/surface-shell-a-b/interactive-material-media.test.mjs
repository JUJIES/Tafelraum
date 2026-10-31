import assert from 'node:assert/strict';
import {mkdtemp, writeFile, open, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {interactiveMaterialMimeType, listInteractiveMaterialFiles, readInteractiveMaterialPackage,
  interactiveMaterialMaxBytes, interactiveMaterialMaxMediaBytes} from './interactive-material.mjs';

test('local streamed media have a bounded budget separate from code and images', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'tafelraum-media-budget-'));
  const sparse = async (name, size) => {const file = await open(path.join(root, name), 'w'); try {await file.truncate(size);} finally {await file.close();}};
  try {
    await writeFile(path.join(root, 'manifest.json'), JSON.stringify({format:'tafelraum-interactive-html', schemaVersion:1,
      id:path.basename(root), title:'Media test', entry:'index.html'}));
    await writeFile(path.join(root, 'index.html'), '<video controls src="clip.mp4"></video>');
    await writeFile(path.join(root, 'NOTICE.txt'), 'Credits remain in the package.');
    await sparse('clip.mp4', interactiveMaterialMaxBytes + 1);
    assert.equal(interactiveMaterialMimeType('clip.mp4'), 'video/mp4');
    assert.equal(interactiveMaterialMimeType('capture.webm'), 'video/webm');
    assert.equal((await listInteractiveMaterialFiles(root)).length, 4);
    assert.ok((await readInteractiveMaterialPackage(root, path.basename(root))).size > interactiveMaterialMaxBytes);
    await sparse('clip.mp4', interactiveMaterialMaxMediaBytes + 1);
    await assert.rejects(listInteractiveMaterialFiles(root), /Medienbudget/);
    await assert.rejects(readInteractiveMaterialPackage(root, path.basename(root)), /Medienbudget/);
    await sparse('clip.mp4', 1);
    await sparse('oversized.js', interactiveMaterialMaxBytes + 1);
    await assert.rejects(listInteractiveMaterialFiles(root), /Inhalts-/);
    await assert.rejects(readInteractiveMaterialPackage(root, path.basename(root)), /Inhalts-/);
  } finally {await rm(root, {recursive:true, force:true});}
});
