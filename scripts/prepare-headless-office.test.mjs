import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm, symlink, realpath, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {headlessOfficeOmissions, officeSelection, prepareHeadlessOffice} from './prepare-headless-office.mjs';

async function fixture(t) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'tafelraum-office-selection-')));
  t.after(() => rm(root, {recursive: true, force: true}));
  const source = path.join(root, 'vendor/LibreOffice.app');
  const config = path.join(source, 'Contents/Resources/config');
  await mkdir(config, {recursive: true});
  const resources = path.join(root, 'desktop-resources');
  await mkdir(resources);
  return {root, source, config, resources};
}

test('headless selection retains default/fallback themes, font and conversion resources', async t => {
  const f = await fixture(t);
  for (const name of [...officeSelection.keepIconArchives, 'images_karasa_jaga_svg.zip', 'images_colibre_svg.zip', 'soffice.cfg']) {
    await writeFile(path.join(f.config, name), 'fixture');
  }
  assert.deepEqual(await headlessOfficeOmissions(f.source), [
    'Contents/Resources/help', 'Contents/Resources/config/images_colibre_svg.zip',
    'Contents/Resources/config/images_karasa_jaga_svg.zip',
  ]);
});

test('unknown vendor version, existing destinations and linked resource roots are refused before mutation', async t => {
  const f = await fixture(t);
  await assert.rejects(prepareHeadlessOffice(f.source, f.resources, {version: 'future'}), /Review/);
  const original = path.join(f.resources, 'runtime/libreoffice/provenance.json');
  await mkdir(path.dirname(original), {recursive: true});
  await writeFile(original, 'preserve');
  await assert.rejects(prepareHeadlessOffice(f.source, f.resources, officeSelection), /already exists/);
  assert.equal(await readFile(original, 'utf8'), 'preserve');
  const linked = path.join(f.root, 'linked/desktop-resources');
  await mkdir(path.dirname(linked));
  await symlink(f.resources, linked, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(prepareHeadlessOffice(f.source, linked, officeSelection), /must not be symlinked/);
});

test('a linked runtime directory cannot redirect preparation into another tree', async t => {
  const f = await fixture(t);
  const elsewhere = path.join(f.root, 'elsewhere');
  await mkdir(elsewhere);
  await symlink(elsewhere, path.join(f.resources, 'runtime'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(prepareHeadlessOffice(f.source, f.resources, officeSelection), /Runtime directory must not be linked/);
});
