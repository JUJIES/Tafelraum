/** Small app-shell contract. Material creation and canvas commands stay separate. */
export const teachingAgentProtocol = 'tafelraum-teaching-agent-v1';
export const teachingAgentPrefix = '/api/teaching-agent';
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
export function readTeachingAgentCommand(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ungültiger Organisationsauftrag.');
  if (value.type === 'materialActivity' && /^[a-z0-9][a-z0-9._-]{0,127}$/i.test(value.lessonId ?? '') &&
      typeof value.lessonId === 'string' && typeof value.operationId === 'string' && /^[a-f0-9-]{36}$/i.test(value.operationId) &&
      ['begin','added','clear','unconfirmed','saved','failed'].includes(value.phase)) {
    const {type,lessonId,operationId,phase,workId,materialPath}=value;
    if ((workId!==undefined&&!uuid(workId)) ||
        (materialPath!==undefined&&(!['added','clear','saved'].includes(phase)||typeof materialPath!=='string'||
         materialPath.length>1000||/[\\\u0000-\u001f]/.test(materialPath)||materialPath.split('/').some(part=>!part||part==='.'||part==='..')))) {
      throw new Error('Ungültiger Materialnachweis.');
    }
    return {type,lessonId,operationId,phase,...(workId?{workId}:{}),...(materialPath?{materialPath}:{})};
  }
  if (value.type === 'workPhase') {
    if (typeof value.lessonId !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,127}$/i.test(value.lessonId) ||
        !uuid(value.workId) ||
        !['start','heartbeat','finish','cancel'].includes(value.action)) throw new Error('Ungültige Arbeitsphase.');
    const {lessonId,workId,action,scope,preparation}=value;
    if ((scope!==undefined&&(action!=='start'||!['archive','canvas'].includes(scope)))||
        (preparation!==undefined&&(action!=='start'||preparation!=='images'))) throw new Error('Ungültiger Arbeitsumfang.');
    return {type:'workPhase',lessonId,workId,action,...(scope?{scope}:{}),...(preparation?{preparation}:{})};
  }
  if (value.type === 'context' || value.type === 'refresh') return {type:value.type};
  if (value.type !== 'openLesson' || ![value.lessonId,value.expectedLessonId].every(id => typeof id === 'string' && /^[a-z0-9][a-z0-9._-]{0,127}$/i.test(id))
      || typeof value.expectedRevision !== 'string' || !value.expectedRevision || value.expectedRevision.length > 200) {
    throw new Error('Stabile Ziel-ID und aktueller Zustand der Lehreransicht erforderlich.');
  }
  return {type:'openLesson',lessonId:value.lessonId,expectedLessonId:value.expectedLessonId,expectedRevision:value.expectedRevision};
}

const normalized = value => String(value ?? '').normalize('NFC').trim().toLocaleLowerCase('de-DE');
const matches = (entry, selector) => !selector || entry.id === selector || normalized(entry.label ?? entry.title) === normalized(selector);

/** Projection of the canonical catalog, never a second persisted index. No private notes. */
export function teachingCatalog(archive) {
  const catalog = archive.catalog;
  if (!catalog || !Array.isArray(archive.classes)) throw new Error('Kein gültiges Unterrichtsarchiv.');
  const trashed = (kind,id) => (catalog.trash ?? []).some(item => item.kind === kind && item.id === id);
  const classes = archive.classes.filter(item => !trashed('class',item.id)).map(({id,label}) => ({id,label}));
  const subjects = catalog.subjects.filter(item => classes.some(c => c.id === item.classId) && !trashed('subject',item.id));
  const series = catalog.series.filter(item => subjects.some(s => s.id === item.subjectId) && !trashed('series',item.id) && item.archiveRole !== 'material-basis');
  const lessons = catalog.lessons.filter(item => series.some(s => s.id === item.seriesId && s.subjectId === item.subjectId)
    && subjects.some(s => s.id === item.subjectId && s.classId === item.classId)
    && !(catalog.hiddenLessonIds ?? []).includes(item.id) && !trashed('lesson',item.id)).map(item => {
    const lessonClass = classes.find(c => c.id === item.classId), subject = subjects.find(s => s.id === item.subjectId), lessonSeries = series.find(s => s.id === item.seriesId);
    return {id:item.id,title:item.title,classId:item.classId,className:lessonClass.label,subjectId:item.subjectId,subjectName:subject.label,seriesId:item.seriesId,seriesName:lessonSeries.label,
      scheduledFor:item.metadata?.scheduledFor ?? null,materialBasis:item.materialBasis ?? null,
      breadcrumb:[lessonClass.label,subject.label,lessonSeries.label,item.title].join(' → ')};
  });
  return {classes,subjects:subjects.map(({id,classId,label})=>({id,classId,label})),series:series.map(({id,subjectId,label})=>({id,subjectId,label})),lessons};
}

export function findTeachingLessons(archive, selectors = {}) {
  return teachingCatalog(archive).lessons.filter(item =>
    matches({id:item.classId,label:item.className},selectors.class)
    && matches({id:item.subjectId,label:item.subjectName},selectors.subject)
    && matches({id:item.seriesId,label:item.seriesName},selectors.series)
    && matches(item,selectors.lesson)
    && (!selectors.query || normalized(item.breadcrumb).includes(normalized(selectors.query))));
}

export function resolveTeachingLesson(archive, selectors) {
  if (!selectors.lesson?.trim()) throw new Error('Zielstunde fehlt: --lesson <ID oder genauer Titel>. Keine automatische Wahl der offenen Stunde.');
  const candidates = findTeachingLessons(archive, selectors);
  if (candidates.length !== 1) {
    const error = new Error(candidates.length ? 'Zielstunde ist mehrdeutig. Klasse, Fach, Reihe oder ID ergänzen.' : 'Zielstunde wurde nicht gefunden. Mit find suchen; nicht automatisch neu anlegen.');
    error.candidates = candidates;
    throw error;
  }
  return candidates[0];
}

export function resolveTeachingSeries(archive, selectors) {
  const catalog = teachingCatalog(archive);
  let candidates = catalog.series.filter(s => {
    const subject = catalog.subjects.find(item=>item.id===s.subjectId), lessonClass = catalog.classes.find(item=>item.id===subject.classId);
    return matches(s,selectors.series) && matches(subject,selectors.subject) && matches(lessonClass,selectors.class);
  });
  if (!selectors.series || candidates.length !== 1) throw new Error('Zielreihe ist nicht eindeutig. --series und gegebenenfalls --class/--subject ergänzen.');
  const series = candidates[0], subject = catalog.subjects.find(s=>s.id===series.subjectId);
  return {classSelector:subject.classId,subjectSelector:subject.id,seriesSelector:series.id};
}
