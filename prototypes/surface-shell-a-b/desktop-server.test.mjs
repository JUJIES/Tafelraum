import distribution from './distribution.json' with {type:'json'};
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createDesktopServer, initializeEmptyArchive, stopWhenParentExits } from "./desktop-server.mjs";

test("creates a fresh archive only when no archive exists", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tafelraum-desktop-archive-"));
  try {
    assert.equal(await initializeEmptyArchive(root, new Date("2026-09-21T10:00:00.000Z")), true);
    const first = await readFile(path.join(root, "archive.json"), "utf8");
    const parsed = JSON.parse(first);
    assert.equal(parsed.format, "tafelraum-unterrichtsarchiv");
    assert.deepEqual(parsed.classes, [{ id: "class-start", label: "Meine Klasse" }]);
    assert.equal(parsed.catalog.lessons[0].title, "Erster Unterricht");
    assert.equal(await initializeEmptyArchive(root, new Date("2027-01-01T00:00:00.000Z")), false);
    assert.equal(await readFile(path.join(root, "archive.json"), "utf8"), first);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("serves the packaged app and local APIs from one loopback origin", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tafelraum-desktop-server-"));
  const webRoot = path.join(root, "web");
  const archiveRoot = path.join(root, "archive");
  const notesRoot = path.join(root, "personal-notes");
  await mkdir(notesRoot, { recursive: true });
  const legacyNotes = '{"version":1,"notes":[{"text":"Existing private note"}]}';
  await writeFile(path.join(notesRoot, "notes.json"), legacyNotes);
  await mkdir(webRoot, { recursive: true });
  await writeFile(path.join(webRoot, "index.html"), "<!doctype html><title>Tafelraum</title>");
  await writeFile(path.join(webRoot, "pdf.worker.mjs"), "export const ready = true;");
  const server = await createDesktopServer({ archiveRoot, notesRoot, webRoot });
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const health = await fetch(`${baseUrl}/api/desktop/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).ready, true);
    const archive = await fetch(`${baseUrl}/api/archive`);
    assert.equal(archive.status, 200);
    assert.equal((await archive.json()).format, "tafelraum-unterrichtsarchiv");
    const live = await fetch(`${baseUrl}/api/live/config`);
    if(distribution.remoteCanvas) assert.deepEqual(await live.json(), { configured: false, baseUrl: null });
    else assert.equal(live.status,404);
    for (const method of ["GET", "POST", "PUT", "DELETE"]) {
      const retired = await fetch(`${baseUrl}/api/personal-notes`, { method });
      assert.equal(retired.status, 404);
    }
    assert.equal(await readFile(path.join(notesRoot, "notes.json"), "utf8"), legacyNotes);
    const page = await fetch(baseUrl);
    assert.match(await page.text(), /<title>Tafelraum<\/title>/);
    const worker = await fetch(`${baseUrl}/pdf.worker.mjs`);
    assert.match(worker.headers.get("content-type"), /^text\/javascript/);
    assert.equal(worker.headers.get("x-content-type-options"), "nosniff");
    const packageRoot = path.join(archiveRoot, "faecher/subject-start/reihen/series-start/stunden/lesson-start/material/interaktiv/test");
    await mkdir(packageRoot, { recursive: true });
    await writeFile(path.join(packageRoot, "manifest.json"), JSON.stringify({
      format: "tafelraum-interactive-html", schemaVersion: 1, id: "test", title: "Test", entry: "index.html",
    }));
    await writeFile(path.join(packageRoot, "index.html"), '<!doctype html><img src="blue.svg">');
    await writeFile(path.join(packageRoot, "blue.svg"), '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="blue" width="10" height="10"/></svg>');
    const entryPath = "/api/archive/lessons/lesson-start/materials/interactive/test/index.html";
    const entry = await fetch(`${baseUrl}${entryPath}`, { redirect: "manual" });
    assert.equal(entry.status, 302);
    const capability = entry.headers.get("location");
    assert.match(capability, /^\/__material\/[a-f0-9]{64}\/lesson-start\/test\/index.html$/);
    // Native opaque-package redirect must preserve the explicit output context.
    const manifest=JSON.parse(await readFile(path.join(packageRoot,'manifest.json'),'utf8'));
    manifest.playback={protocol:'room-v1',initialState:{version:1,slide:0}};
    await writeFile(path.join(packageRoot,'manifest.json'),JSON.stringify(manifest));
    const controller=await fetch(`${baseUrl}${entryPath}`);
    assert.match(controller.headers.get('permissions-policy'),/fullscreen=\(\)/);
    const teacherHtml=await controller.text();
    assert.match(teacherHtml,/blue.svg/);assert.match(teacherHtml,/tafelraumPlaybackMirror/);assert.doesNotMatch(teacherHtml,/Room Canvas starten/);
    const outputRedirect=await fetch(`${baseUrl}${entryPath}?tafelraum-playback=output`,{redirect:'manual'});
    assert.ok(outputRedirect.headers.get('location').endsWith('?tafelraum-playback=output'));
    const output=await fetch(`${baseUrl}${outputRedirect.headers.get('location')}`,{headers:{'Sec-Fetch-Site':'cross-site','Sec-Fetch-Dest':'iframe'}});
    const outputHtml=await output.text();
    assert.match(output.headers.get('permissions-policy'),/fullscreen=\*/);
    assert.match(output.headers.get('permissions-policy'),/camera=\(\), microphone=\(\)/);
    assert.match(outputHtml,/<img src="blue.svg">/);
    assert.match(outputHtml,/tafelraum:playback-output/);
    assert.doesNotMatch(outputHtml,/id="chapter"/);
    const localRedirect=await fetch(`${baseUrl}${entryPath}?tafelraum-playback=local`,{redirect:'manual'});
    assert.ok(localRedirect.headers.get('location').endsWith('?tafelraum-playback=local'));
    const localHtml=await (await fetch(`${baseUrl}${localRedirect.headers.get('location')}`,{headers:{'Sec-Fetch-Site':'cross-site'}})).text();
    assert.match(localHtml,/<img src="blue.svg">/);assert.doesNotMatch(localHtml,/id="chapter"/);
    await writeFile(path.join(packageRoot,'controller.html'),'<!doctype html><html><head><title>Gleiche Oberfläche</title></head><body><img src="blue.svg"><button>Abspielen</button></body></html>');
    manifest.playback.controllerEntry='controller.html';
    await writeFile(path.join(packageRoot,'manifest.json'),JSON.stringify(manifest));
    const authored=await fetch(`${baseUrl}${entryPath}`),authoredHtml=await authored.text();
    assert.doesNotMatch(authoredHtml,/Gleiche Oberfläche/);assert.match(authoredHtml,/blue.svg/);assert.match(authoredHtml,/tafelraumPlaybackMirror/);
    assert.doesNotMatch(authored.headers.get('content-security-policy'),/media-src 'none'/);
    assert.doesNotMatch(authoredHtml,/id="chapter"/);
    const stillOriginal=await (await fetch(`${baseUrl}${entryPath}?tafelraum-playback=local`)).text();
    assert.doesNotMatch(stillOriginal,/Gleiche Oberfläche/);assert.match(stillOriginal,/blue.svg/);
    manifest.playback.controllerEntry='missing.html';await writeFile(path.join(packageRoot,'manifest.json'),JSON.stringify(manifest));
    const withoutLegacy=await fetch(`${baseUrl}${entryPath}`);assert.equal(withoutLegacy.status,200,'unused legacy control file cannot hide the original material');assert.match(await withoutLegacy.text(),/blue.svg/);
    delete manifest.playback;
    await writeFile(path.join(packageRoot,'manifest.json'),JSON.stringify(manifest));
    // A valid token grants this package, including relative opaque-origin assets.
    const scoped = await fetch(`${baseUrl}${capability}`, { headers: { "sec-fetch-site": "cross-site" } });
    assert.match(scoped.headers.get('permissions-policy'),/fullscreen=\(\)/);
    const fakeOutput=await fetch(`${baseUrl}${capability}?tafelraum-playback=output`);
    assert.match(fakeOutput.headers.get('permissions-policy'),/fullscreen=\(\)/,'query alone never grants fullscreen');
    assert.equal(scoped.status, 200);
    assert.match(await scoped.text(), /blue.svg/);
    const csp = scoped.headers.get("content-security-policy");
    assert.ok(csp.includes(`img-src 'self' ${baseUrl}${capability.replace("index.html", "")}`));
    assert.match(csp, /connect-src 'none'/);
    const image = await fetch(`${baseUrl}${capability.replace("index.html", "blue.svg")}`, { headers: { "sec-fetch-site": "cross-site" } });
    assert.equal(image.status, 200);
    assert.match(image.headers.get("content-type"), /image\/svg\+xml/);
    assert.match(await image.text(), /fill="blue"/);
    for (const url of [entryPath, "/api/archive", capability.replace("/test/", "/other/"), capability.replace("/lesson-start/", "/other/")]) {
      assert.equal((await fetch(`${baseUrl}${url}`, { headers: { "sec-fetch-site": "cross-site" } })).status, 403);
    }
    assert.equal((await fetch(`${baseUrl}${capability}`, { method: "POST" })).status, 403);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects an invalid parent process id", () => {
  assert.throws(() => stopWhenParentExits({ once() {} }, 1), /Elternprozess-ID/);
});

test("desktop remote provisioning uses the private sibling configuration and keeps the key server-side", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tafelraum-desktop-live-"));
  const webRoot = path.join(root,"web");
  await mkdir(webRoot);
  await writeFile(path.join(webRoot,"index.html"),"<title>Test</title>");
  await writeFile(path.join(root,"live-canvas.json"),JSON.stringify({baseUrl:"https://remote.invalid",adminKey:"private-test-key"}));
  let calls=0;
  const server=await createDesktopServer({archiveRoot:path.join(root,"archive"),notesRoot:path.join(root,"notes"),webRoot,
    liveRequest:async(url,options) => {
      assert.equal(url,"https://remote.invalid/api/live/meeting");
      assert.equal(options.headers.Authorization,"Bearer private-test-key");
      calls++;
      return Response.json({roomId:"test-room",hostToken:"test-host",inviteId:"test-invite"});
    }});
  const origin=`http://127.0.0.1:${server.address().port}`;
  try {
    const config=await fetch(`${origin}/api/live/config`);
    if(!distribution.remoteCanvas){assert.equal(config.status,404);assert.equal(calls,0);return;}
    assert.deepEqual(await config.json(),{configured:true,baseUrl:"https://remote.invalid"});
    assert.equal((await fetch(`${origin}/api/live/rooms`,{method:"POST"})).status,403);
    assert.equal((await fetch(`${origin}/api/live/rooms`,{method:"POST",headers:{Origin:"https://foreign.invalid","X-Live-Canvas":"create"}})).status,403);
    assert.equal(calls,0);
    const result=await fetch(`${origin}/api/live/rooms`,{method:"POST",headers:{Origin:origin,"X-Live-Canvas":"create"}});
    assert.equal(result.status,200);
    const text=await result.text();
    assert.ok(!text.includes("private-test-key"));
    assert.equal(JSON.parse(text).hostToken,"test-host");
    assert.equal(calls,1);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(root,{recursive:true,force:true});
  }
});
