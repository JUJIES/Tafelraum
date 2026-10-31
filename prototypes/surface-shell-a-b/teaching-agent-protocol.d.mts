export const teachingAgentProtocol:string;
export const teachingAgentPrefix:string;
export type TeachingCommand = {type:'context'|'refresh'} | {type:'openLesson';lessonId:string;expectedLessonId:string;expectedRevision:string};
export function readTeachingAgentCommand(value:unknown):TeachingCommand;
export type TeachingLesson = {id:string;title:string;classId:string;className:string;subjectId:string;subjectName:string;seriesId:string;seriesName:string;scheduledFor:string|null;materialBasis:unknown;breadcrumb:string};
export function teachingCatalog(archive:unknown):{classes:{id:string;label:string}[];subjects:{id:string;classId:string;label:string}[];series:{id:string;subjectId:string;label:string}[];lessons:TeachingLesson[]};
export function findTeachingLessons(archive:unknown,selectors?:Record<string,string>):TeachingLesson[];
export function resolveTeachingLesson(archive:unknown,selectors:Record<string,string>):TeachingLesson;
export function resolveTeachingSeries(archive:unknown,selectors:Record<string,string>):{classSelector:string;subjectSelector:string;seriesSelector:string};
