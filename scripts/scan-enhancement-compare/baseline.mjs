// Experimental adapter: run the exact production pixel function, no reimplementation.
import { enhanceScanPixels } from '../../prototypes/surface-shell-a-b/src/canvas/scan-enhancement.ts';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const source = Buffer.concat(chunks);
if (!source.length || source.length % 4) throw new Error('Expected RGBA bytes.');
process.stdout.write(Buffer.from(enhanceScanPixels(new Uint8ClampedArray(source))));
