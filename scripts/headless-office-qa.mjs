// Compare the real sandboxed converter before/after build-time resource selection.
import assert from 'node:assert/strict';
import {mkdir, readFile, readdir, copyFile, symlink, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const [baseline, selected, fixtureDirectory, output] = process.argv.slice(2).map(value => path.resolve(value));
assert.ok(baseline && selected && fixtureDirectory && output, 'BASELINE_OFFICE_APP SELECTED_OFFICE_APP FIXTURE_DIRECTORY NEW_OUTPUT');
await mkdir(output); // Never overwrite earlier QA evidence.
const report = {cases: []};
for (const [name, office] of [['baseline', baseline], ['selected', selected]]) {
  const resources = path.join(output, name, 'desktop-resources');
  await mkdir(path.join(resources, 'server/office-import'), {recursive: true});
  await mkdir(path.join(resources, 'runtime/libreoffice'), {recursive: true});
  await copyFile(new URL('../prototypes/surface-shell-a-b/office-import.mjs', import.meta.url), path.join(resources, 'server/office-import.mjs'));
  await copyFile(new URL('../prototypes/surface-shell-a-b/office-import/runtime.json', import.meta.url), path.join(resources, 'server/office-import/runtime.json'));
  await symlink(office, path.join(resources, 'runtime/libreoffice/LibreOffice.app'));
  const {convertOfficeToPdf, validateDocx} = await import(pathToFileURL(path.join(resources, 'server/office-import.mjs')));
  for (const file of (await readdir(fixtureDirectory)).filter(file => file.endsWith('.docx')).sort()) {
    const input = path.join(fixtureDirectory, file);
    validateDocx(await readFile(input));
    const target = path.join(output, name, path.basename(file, '.docx'));
    await mkdir(target);
    const pdf = await convertOfficeToPdf(input, target);
    await writeFile(path.join(target, 'result.pdf'), pdf);
    execFileSync('pdftoppm', ['-r', '96', '-png', path.join(target, 'result.pdf'), path.join(target, 'page')]);
    execFileSync('pdftotext', ['-layout', path.join(target, 'result.pdf'), path.join(target, 'text.txt')]);
    const hash = bytes => createHash('sha256').update(bytes).digest('hex');
    const pages = [];
    for (const page of (await readdir(target)).filter(file => /^page-\d+\.png$/.test(file)).sort()) pages.push(hash(await readFile(path.join(target, page))));
    assert.ok(pages.length);
    const entry = {file, pages, text: hash(await readFile(path.join(target, 'text.txt')))};
    if (name === 'baseline') report.cases.push(entry);
    else assert.deepEqual(entry, report.cases.find(row => row.file === file), 'PDF rendering/text changed: ' + file);
  }
}
report.passed = true;
await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
