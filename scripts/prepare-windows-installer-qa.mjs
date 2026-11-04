// Explicit local QA entry point; shared Windows adapter builds and verifies resources.
import {prepareWindowsDesktop} from './stage-windows-desktop.mjs';
await prepareWindowsDesktop({channel:'qa-installer',identifier:'app.jujies.tafelraum.public.qa.windows.installer',resourceDirectory:'installer-qa-resources'});
