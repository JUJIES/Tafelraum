// Explicit local QA entry point; shared Windows adapter builds and verifies resources.
import {prepareWindowsDesktop} from './stage-windows-desktop.mjs';
await prepareWindowsDesktop({channel:'qa-update',identifier:'app.jujies.tafelraum.public.qa.windows.update',resourceDirectory:'update-qa-resources'});
