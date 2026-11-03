// Build-time selection only. Never trim the signed vendor cache or an installed app.
import assert from 'node:assert/strict';
import {copyFile, lstat, mkdir, readFile, readdir, realpath, rm, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const officeSelection = {
  schemaVersion: 1,
  id: 'docx-headless-26.8.1-v1',
  version: '26.8.1',
  // Keep the platform default and fallback bitmap themes, including dark variants.
  keepIconArchives: ['images_colibre.zip', 'images_colibre_dark.zip', 'images_sukapura.zip', 'images_sukapura_dark.zip'],
};

export async function headlessOfficeOmissions(app) {
  const resources = path.join(app, 'Contents/Resources');
  const names = await readdir(path.join(resources, 'config'));
  return ['Contents/Resources/help', ...names.filter(name => /^images_[a-z_]+\.zip$/.test(name)
    && !officeSelection.keepIconArchives.includes(name)).sort().map(name => 'Contents/Resources/config/' + name)];
}

async function treeBytes(target) {
  const stat = await lstat(target);
  if (!stat.isDirectory()) return stat.size;
  let bytes = 0;
  for (const name of await readdir(target)) bytes += await treeBytes(path.join(target, name));
  return bytes;
}

export async function prepareHeadlessOffice(source, resources, spec) {
  assert.equal(spec.version, officeSelection.version, 'Review the headless resource selection for this LibreOffice version');
  source = await realpath(source);
  resources = path.resolve(resources);
  assert.equal(path.basename(resources), 'desktop-resources', 'Expected fresh generated desktop-resources');
  assert.equal(await realpath(resources), resources, 'Generated resources must not be symlinked');
  const destination = path.join(resources, 'runtime/libreoffice');
  // No overwrite, including symlinks; this must run before the bundle is assembled.
  try {
    await lstat(destination);
    throw new Error('Generated Office destination already exists');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  assert.ok(!source.startsWith(resources + path.sep), 'Source must be the untouched vendor cache');
  await mkdir(path.join(resources, 'runtime'), {recursive: true});
  assert.equal(await realpath(path.join(resources, 'runtime')), path.join(resources, 'runtime'), 'Runtime directory must not be linked');
  execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', source]);
  const actualVersion = execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleShortVersionString', path.join(source, 'Contents/Info.plist')], {encoding: 'utf8'}).trim();
  assert.ok(actualVersion === spec.version || actualVersion.startsWith(spec.version + '.'), 'Vendor version does not match the selection');
  await mkdir(destination);
  const app = path.join(destination, 'LibreOffice.app');
  try {
    execFileSync('/usr/bin/ditto', ['--norsrc', '--noextattr', '--noacl', source, app]);
    // Preserve the original help-icon notice even though its assets are omitted.
    await mkdir(path.join(destination, 'notices'));
    await copyFile(path.join(app, 'Contents/Resources/help/media/icon-themes/COPYING-ICONS'),
      path.join(destination, 'notices/help-COPYING-ICONS'));
    const beforeBytes = await treeBytes(app);
    const removed = [];
    for (const relative of await headlessOfficeOmissions(app)) {
      const target = path.join(app, relative);
      // Refuse a changed upstream layout rather than following an unexpected link.
      assert.equal(await realpath(target), target, 'Unexpected linked Office resource');
      removed.push({path: relative, bytes: await treeBytes(target)});
      await rm(target, {recursive: true});
    }
    // All executable code and nested signatures are retained; renew the outer seal
    // after selecting resources. The final Tauri bundle receives its normal signing.
    execFileSync('/usr/bin/codesign', ['--force', '--sign', '-', '--preserve-metadata=identifier,entitlements,flags,runtime', app]);
    execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', app]);
    const report = {...officeSelection, beforeBytes, afterBytes: await treeBytes(app),
      retainedNotices: ['notices/help-COPYING-ICONS'], removed};
    await writeFile(path.join(destination, 'selection.json'), JSON.stringify(report, null, 2) + '\n');
    await writeFile(path.join(destination, 'provenance.json'), JSON.stringify(spec, null, 2) + '\n');
    return report;
  } catch (error) {
    await rm(destination, {recursive: true, force: true});
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [source, resources] = process.argv.slice(2);
  assert.ok(source && resources, 'SOURCE_VENDOR_APP GENERATED_DESKTOP_RESOURCES');
  const spec = JSON.parse(await readFile(new URL('../prototypes/surface-shell-a-b/office-import/runtime.json', import.meta.url)));
  console.log(JSON.stringify(await prepareHeadlessOffice(source, resources, spec)));
}
