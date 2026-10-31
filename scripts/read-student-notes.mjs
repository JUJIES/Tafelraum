#!/usr/bin/env node
import { createStudentNotesStore } from '../prototypes/surface-shell-a-b/student-notes-store.mjs';
const args = process.argv.slice(2);
const values = {};
const names = { '--archive-root': 'archiveRoot', '--class-id': 'classId', '--subject-id': 'subjectId', '--series-id': 'seriesId', '--student-id': 'studentId', '--from': 'from', '--to': 'to', '--limit': 'limit', '--cursor': 'cursor' };
try {
  if (args.includes('--help')) {
    console.log('node scripts/read-student-notes.mjs --archive-root /absoluter/Archivpfad --class-id ID [--subject-id ID] [--student-id ID] [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--limit 200] [--cursor CURSOR]');
  } else {
    for (let i = 0; i < args.length; i += 2) {
      if (!names[args[i]] || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Ungültige Argumente. --help zeigt die Optionen.');
      values[names[args[i]]] = args[i + 1];
    }
    if (!values.archiveRoot?.startsWith('/') || !values.classId) throw new Error('Explizite absolute Archivwurzel und --class-id sind erforderlich.');
    const { archiveRoot, ...filters } = values;
    console.log(JSON.stringify(await createStudentNotesStore({ archiveRoot }).query(filters), null, 2));
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
