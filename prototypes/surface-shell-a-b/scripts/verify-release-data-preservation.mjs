import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [oldApp, newApp] = process.argv.slice(2);
if (!oldApp || !newApp) {
  throw new Error("Aufruf: node scripts/verify-release-data-preservation.mjs <alte Tafelraum.app> <neue Tafelraum.app>");
}

const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+kRZkAAAAASUVORK5CYII=";
const profile = await mkdtemp(path.join(tmpdir(), "tafelraum-update-data-"));
const archiveRoot = path.join(profile, "archive");
const notesRoot = path.join(profile, "notes");

async function withPackagedServer(appPath, run) {
  const resources = path.join(appPath, "Contents/Resources/desktop-resources");
  const moduleUrl = pathToFileURL(path.join(resources, "server/desktop-server.mjs")).href;
  const { createDesktopServer } = await import(moduleUrl);
  const server = await createDesktopServer({
    archiveRoot,
    notesRoot,
    webRoot: path.join(resources, "web"),
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

async function request(origin, route, method = "GET", body) {
  const response = await fetch(`${origin}${route}`, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json", ...(method === "PUT" && route.endsWith("/board") ? { "If-None-Match": "*" } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.ok(response.ok, `${method} ${route}: HTTP ${response.status}`);
  return response.json();
}

async function fileHashes(root, directory = root) {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(result, await fileHashes(root, filePath));
    else if (entry.isFile()) result[path.relative(root, filePath)] = createHash("sha256").update(await readFile(filePath)).digest("hex");
  }
  return result;
}

try {
  const board = { schemaVersion: 1, elements: [], viewport: { scrollX: 0, scrollY: 0, zoom: { value: 1 } } };
  const asset = { id: "synthetic-image", mimeType: "image/png", dataURL: `data:image/png;base64,${png}`, created: 1, lastRetrieved: 1 };
  let expectedArchive;
  await withPackagedServer(oldApp, async (origin) => {
    expectedArchive = await request(origin, "/api/archive");
    await request(origin, "/api/archive/lessons/lesson-start/board", "PUT", board);
    await request(origin, "/api/archive/lessons/lesson-start/assets", "PUT", { files: [asset] });
  });
  // Retired notebook data stays on disk, without retaining its former API.
  await mkdir(notesRoot, { recursive: true });
  await writeFile(path.join(notesRoot, "notes.json"), JSON.stringify({ version: 1, notes: [{ id: "legacy-note", text: "Synthetische Alt-Notiz" }] }));
  await writeFile(path.join(notesRoot, "legacy-image.png"), Buffer.from(png, "base64"));
  const before = await fileHashes(profile);

  await withPackagedServer(newApp, async (origin) => {
    assert.deepEqual(await request(origin, "/api/archive"), expectedArchive);
    assert.deepEqual(await request(origin, "/api/archive/lessons/lesson-start/board"), board);
    assert.deepEqual(await request(origin, "/api/archive/lessons/lesson-start/assets", "POST", { fileIds: [asset.id] }), { files: [asset] });
  });
  const after = await fileHashes(profile);
  assert.deepEqual(after, before);
  assert.ok(Object.keys(before).some((name) => name.endsWith("scene.json")));
  assert.ok(Object.keys(before).some((name) => name.endsWith("notes.json")));
  console.log(JSON.stringify({ preserved: true, files: Object.keys(before).length, sha256: before }, null, 2));
} finally {
  await rm(profile, { recursive: true, force: true });
}
