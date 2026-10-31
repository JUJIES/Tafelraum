import { createStudentNotesStore, StudentNotesError } from './student-notes-store.mjs';

function reply(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(value));
}
async function body(request) {
  let size = 0; const parts = [];
  for await (const part of request) { size += part.length; if (size > 256 * 1024) throw new StudentNotesError(413, 'Eingabe ist zu groß.'); parts.push(part); }
  try { return JSON.parse(Buffer.concat(parts).toString()); } catch { throw new StudentNotesError(400, 'Ungültige Eingabe.'); }
}
function baseRevision(request) {
  if (request.headers['if-none-match'] === '*') return null;
  return request.headers['if-match'];
}
/** Exact teacher-origin access, also when invoked directly by the Vite archive plugin. */
export function createStudentNotesMiddleware(options) {
  const store = createStudentNotesStore(options);
  return async (request, response, next) => {
    const url = new URL(request.url ?? '/', 'http://local');
    const roster = /^\/api\/archive\/classes\/([^/]+)\/students$/.exec(url.pathname);
    const notes = /^\/api\/archive\/lessons\/([^/]+)\/student-notes(?:\/([^/]+))?$/.exec(url.pathname);
    if (!roster && !notes && url.pathname !== '/api/archive/student-notes') return next();
    const host = request.headers.host ?? '', origin = request.headers.origin;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || request.headers['x-tafelraum-student-notes'] !== '1'
      || (origin !== undefined && origin !== `http://${host}`) || ['cross-site', 'same-site'].includes(request.headers['sec-fetch-site'])) {
      reply(response, 403, { error: 'Privater Zugriff auf Stundennotizen nicht erlaubt.' }); return;
    }
    try {
      if (roster && request.method === 'GET') return reply(response, 200, await store.getStudents(decodeURIComponent(roster[1])));
      if (roster && request.method === 'PUT') return reply(response, 200, await store.putStudents(decodeURIComponent(roster[1]), await body(request), baseRevision(request)));
      if (notes && !notes[2] && request.method === 'GET') return reply(response, 200, await store.getLessonNotes(decodeURIComponent(notes[1])));
      if (notes?.[2] && request.method === 'PUT') {
        const input = await body(request);
        return reply(response, 200, await store.putNote(decodeURIComponent(notes[1]), decodeURIComponent(notes[2]), input?.text, baseRevision(request)));
      }
      if (url.pathname === '/api/archive/student-notes' && request.method === 'GET') return reply(response, 200, await store.query(Object.fromEntries(url.searchParams)));
      reply(response, 405, { error: 'Diese Aktion ist nicht verfügbar.' });
    } catch (error) {
      reply(response, error instanceof StudentNotesError ? error.status : 500,
        { error: error instanceof StudentNotesError ? error.message : 'Private Stundennotizen konnten nicht gelesen oder gespeichert werden.' });
    }
  };
}
