import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath,pathToFileURL } from "node:url";
import {
  interactiveMaterialFolderName,
  readInteractiveMaterialPackage,
  validateRoomStateContract,
} from "../prototypes/surface-shell-a-b/interactive-material.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function usage() {
  return `Interaktives HTML-Material in eine Tafelraum-Stunde einspielen

Pflicht:
  --lesson-id <ID>       Zielstunde im Unterrichtsarchiv
  --source-dir <Pfad>    Paketordner mit manifest.json und HTML-Einstiegspunkt

Optional:
  --archive-root <Pfad>  Standard: data/unterrichtsarchiv
  --require-print       Für Arbeitsblätter: gemeinsame A4-Seiten für neue Arbeitsblätter verlangen
  --help

Der Installer ist additiv: Ein gleichnamiges bestehendes Paket wird nur als
bereits vorhanden akzeptiert, wenn alle Dateien bytegleich sind. Abweichende
Inhalte werden nicht überschrieben.
`;
}

function parseArguments(argv) {
  const options = {
    archiveRoot: path.join(projectRoot, "data", "unterrichtsarchiv"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") return { help: true };
    if (argument === "--require-print") { options.requirePrint = true; continue; }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Wert für ${argument} fehlt.`);
    index += 1;
    if (argument === "--lesson-id") options.lessonId = value;
    else if (argument === "--source-dir") options.sourceDirectory = path.resolve(value);
    else if (argument === "--archive-root") options.archiveRoot = path.resolve(value);
    else throw new Error(`Unbekannte Option ${argument}.`);
  }
  return options;
}

function safeArchivePath(archiveRoot, relativePath) {
  const resolvedRoot = path.resolve(archiveRoot);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  if (!resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("Materialpfad liegt außerhalb des Unterrichtsarchivs.");
  }
  return resolvedPath;
}

async function fileDigest(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function directoryDigest(directory) {
  const entries = [];
  async function visit(currentDirectory, relativeDirectory = "") {
    const children = await readdir(currentDirectory, { withFileTypes: true });
    children.sort((left, right) => left.name.localeCompare(right.name));
    for (const child of children) {
      const relativePath = path.posix.join(relativeDirectory, child.name);
      const absolutePath = path.join(currentDirectory, child.name);
      if (child.isDirectory()) await visit(absolutePath, relativePath);
      else if (child.isFile()) entries.push(`${relativePath}\0${await fileDigest(absolutePath)}`);
      else throw new Error(`Nicht unterstützter Paketeintrag: ${relativePath}`);
    }
  }
  await visit(directory);
  return createHash("sha256").update(entries.join("\n")).digest("hex");
}

export async function installInteractiveMaterial({ archiveRoot, lessonId, sourceDirectory, requirePrint = false }) {
  if (!lessonId) throw new Error("--lesson-id fehlt.");
  if (!sourceDirectory) throw new Error("--source-dir fehlt.");

  const resolvedArchiveRoot = path.resolve(archiveRoot);
  const archiveDocument = JSON.parse(await readFile(path.join(resolvedArchiveRoot, "archive.json"), "utf8"));
  const lesson = archiveDocument.catalog?.lessons?.find((candidate) => candidate.id === lessonId);
  if (!lesson) throw new Error(`Unterricht ${lessonId} wurde nicht gefunden.`);
  if (lesson.materialBasis?.scope !== "lesson" || typeof lesson.materialBasis.archivePath !== "string") {
    throw new Error("Interaktive Materialien benötigen eine stundenspezifische Materialbasis.");
  }

  const sourcePackage = await readInteractiveMaterialPackage(sourceDirectory, path.basename(sourceDirectory), { requirePrint });
  await validateRoomStateContract(sourceDirectory);
  const materialRoot = safeArchivePath(resolvedArchiveRoot, lesson.materialBasis.archivePath);
  const interactiveRoot = path.join(materialRoot, interactiveMaterialFolderName);
  const targetDirectory = path.join(interactiveRoot, sourcePackage.id);
  await mkdir(interactiveRoot, { recursive: true });

  try {
    const targetPackage = await readInteractiveMaterialPackage(targetDirectory, sourcePackage.id);
    const [sourceDigest, targetDigest] = await Promise.all([
      directoryDigest(sourceDirectory),
      directoryDigest(targetDirectory),
    ]);
    if (sourceDigest !== targetDigest) {
      throw new Error(`Material ${sourcePackage.id} existiert bereits mit anderem Inhalt; es wurde nichts überschrieben.`);
    }
    return { created: false, lessonId, material: targetPackage, targetDirectory };
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const temporaryRoot = path.join(interactiveRoot, `.install-${process.pid}-${Date.now()}`);
  const temporaryDirectory = path.join(temporaryRoot, sourcePackage.id);
  try {
    await cp(sourceDirectory, temporaryDirectory, { recursive: true, errorOnExist: true });
    await readInteractiveMaterialPackage(temporaryDirectory, sourcePackage.id);
    await rename(temporaryDirectory, targetDirectory);
    await rm(temporaryRoot, { recursive: true, force: true });
  } catch (error) {
    await rm(temporaryRoot, { recursive: true, force: true });
    if (error?.code === "EEXIST" || error?.code === "ENOTEMPTY") {
      throw new Error(`Material ${sourcePackage.id} wurde gleichzeitig angelegt; es wurde nichts überschrieben.`);
    }
    throw error;
  }

  return {
    created: true,
    lessonId,
    material: await readInteractiveMaterialPackage(targetDirectory, sourcePackage.id),
    targetDirectory,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const result = await installInteractiveMaterial(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
