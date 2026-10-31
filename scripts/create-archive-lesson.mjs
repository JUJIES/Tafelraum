import path from "node:path";
import { fileURLToPath } from "node:url";
import { createArchiveLesson } from "../prototypes/surface-shell-a-b/archive-server.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function usage() {
  return `Unterricht im Tafelraum-Archiv anlegen

Pflicht:
  --class <Name|ID>    Klasse, zum Beispiel Dinos
  --subject <Name|ID>  Fach, zum Beispiel LER/WAT
  --series <Name|ID>   Reihe, zum Beispiel Reisen
  --title <Titel>      Inhaltsbezogener Stundentitel

Optional:
  --date <YYYY-MM-DD>  Geplanter Termin; ohne Angabe bleibt er offen
  --lesson-id <ID>     Vorgegebene stabile Lesson-ID
  --source-ref <Pfad>  Beleg im Materialspiegel, Status planned
  --allow-duplicate    Gleicher Titel und Termin dürfen erneut angelegt werden
  --archive-root <Pfad>
  --api <Origin>       Laufenden Tafelraum-Server verwenden
  --no-api             Direkt in die Dateibasis schreiben
  --help
`;
}

function parseArguments(argv) {
  const options = {
    archiveRoot: path.join(projectRoot, "data", "unterrichtsarchiv"),
    apiOrigin: "http://127.0.0.1:5175",
    useApi: true,
    allowDuplicate: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") return { help: true };
    if (argument === "--allow-duplicate") {
      options.allowDuplicate = true;
      continue;
    }
    if (argument === "--no-api") {
      options.useApi = false;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Wert für ${argument} fehlt.`);
    index += 1;
    if (argument === "--class") options.classSelector = value;
    else if (argument === "--subject") options.subjectSelector = value;
    else if (argument === "--series") options.seriesSelector = value;
    else if (argument === "--title") options.title = value;
    else if (argument === "--date") options.scheduledFor = value;
    else if (argument === "--lesson-id") options.lessonId = value;
    else if (argument === "--source-ref") options.sourceReference = value;
    else if (argument === "--archive-root") options.archiveRoot = path.resolve(value);
    else if (argument === "--api") options.apiOrigin = value.replace(/\/$/, "");
    else throw new Error(`Unbekannte Option ${argument}.`);
  }
  return options;
}

function lessonInput(options) {
  return {
    classSelector: options.classSelector,
    subjectSelector: options.subjectSelector,
    seriesSelector: options.seriesSelector,
    title: options.title,
    scheduledFor: options.scheduledFor ?? null,
    lessonId: options.lessonId,
    allowDuplicate: options.allowDuplicate,
    ...(options.sourceReference ? {
      sourceReferences: [{ path: options.sourceReference, evidence: "planned" }],
    } : {}),
  };
}

async function createThroughApi(options, input) {
  if (!options.useApi) return null;
  let statusResponse;
  try {
    statusResponse = await fetch(`${options.apiOrigin}/api/archive/status`, {
      signal: AbortSignal.timeout(700),
    });
  } catch {
    return null;
  }
  if (!statusResponse.ok) return null;
  const status = await statusResponse.json();
  if (path.resolve(status.archiveRoot) !== options.archiveRoot) return null;
  const response = await fetch(`${options.apiOrigin}/api/archive/lessons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? `Archivserver antwortete mit ${response.status}.`);
  return result;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const input = lessonInput(options);
  const result = await createThroughApi(options, input)
    ?? await createArchiveLesson(options.archiveRoot, input);
  const lessonDirectory = path.join(
    options.archiveRoot,
    "faecher",
    result.lesson.subjectId,
    "reihen",
    result.lesson.seriesId,
    "stunden",
    result.lesson.id,
  );
  const materialDirectory = path.join(lessonDirectory, "material");
  process.stdout.write(`${JSON.stringify({
    created: result.created,
    lesson: result.lesson,
    lessonDirectory,
    materialDirectory,
    materialBasis: result.lesson.materialBasis ?? null,
  }, null, 2)}\n`);
}

await main();
