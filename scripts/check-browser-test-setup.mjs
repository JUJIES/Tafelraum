// Fail before fixture/server creation with the exact local setup command.
import {createRequire} from 'node:module';
const require = createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url));
let playwright;
try {
  playwright = require('playwright');
} catch (cause) {
  throw new Error('Playwright fehlt. In prototypes/surface-shell-a-b zuerst npm ci ausführen.',{cause});
}
const engines = process.argv.slice(2);
if (!engines.length) engines.push('chromium');
for (const engine of engines) {
  if (!['chromium','webkit'].includes(engine)) throw new Error(`Unbekannte Testengine: ${engine}. Erlaubt: chromium, webkit.`);
  let browser;
  try {
    browser = await playwright[engine].launch({headless:true});
    console.log(`Browser-Testsetup bereit: ${engine} ${browser.version()}`);
  } catch (cause) {
    throw new Error(`Testbrowser ${engine} kann nicht starten. Im Appverzeichnis npm run test:browser:install${engine === 'webkit' ? ' -- webkit' : ''} ausführen. Unter Linux bei fehlenden Systembibliotheken: npm exec -- playwright install --with-deps ${engine}.`,{cause});
  } finally {
    await browser?.close();
  }
}
