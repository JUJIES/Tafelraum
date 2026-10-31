import path from "node:path";
import { fileURLToPath } from "node:url";
import { readInteractiveMaterialPackage, validateRoomStateContract } from "../prototypes/surface-shell-a-b/interactive-material.mjs";

function usage() {
  return `Interaktives Tafelraum-HTML-Paket prüfen

Pflicht:
  --source-dir <Pfad>    Paketordner mit manifest.json und HTML-Einstiegspunkt

Optional:
  --require-print      Für Arbeitsblätter: fehlende A4-Druckfähigkeit ablehnen
  --help

Die Prüfung verwendet denselben Paketvertrag wie Tafelraum und verändert
weder Quellordner noch Unterrichtsarchiv.
`;
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") return { help: true };
    if (argument === "--require-print") { options.requirePrint = true; continue; }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Wert für ${argument} fehlt.`);
    index += 1;
    if (argument === "--source-dir") options.sourceDirectory = path.resolve(value);
    else throw new Error(`Unbekannte Option ${argument}.`);
  }
  return options;
}

export async function checkInteractiveMaterial({ sourceDirectory, requirePrint = false }) {
  if (!sourceDirectory) throw new Error("--source-dir fehlt.");
  const packageRoot = path.resolve(sourceDirectory);
  const material = await readInteractiveMaterialPackage(packageRoot, path.basename(packageRoot), { requirePrint });
  await validateRoomStateContract(packageRoot);
  return material;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const material = await checkInteractiveMaterial(options);
  process.stdout.write(`${JSON.stringify({
    ok: true,
    id: material.id,
    title: material.title,
    entry: material.entry,
    defaultViewport: material.defaultViewport,
    live: material.live,
    print: material.print,
    fileCount: material.fileCount,
    size: material.size,
  }, null, 2)}\n`);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await main();
}
