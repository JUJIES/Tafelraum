// Automatic Windows platform hook; official delivery still requires its explicit config.
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readDesktopRelease} from './desktop-release-config.mjs';
import {prepareWindowsDesktop} from './stage-windows-desktop.mjs';
const repository=fileURLToPath(new URL('../',import.meta.url));
const release=await readDesktopRelease(repository);
assert.equal(release.profile,'public');
assert(['manual','public'].includes(release.channel));
await prepareWindowsDesktop({channel:release.channel,identifier:'app.jujies.tafelraum.public',resourceDirectory:'windows-resources'});
