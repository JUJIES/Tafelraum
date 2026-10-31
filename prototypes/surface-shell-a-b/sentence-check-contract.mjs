// Existing manifest/request validation, shared across distributions. No provider access.
export const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const id=value=>typeof value==='string'&&/^[-a-z0-9]{1,64}$/.test(value);
export function sentenceCheckCapability(value){
  if(value===undefined||value===null)return null;
  if(!object(value)||Object.keys(value).some(key=>!['protocol','projectId'].includes(key))||!['video-lab-v1','tafelraum-v1'].includes(value.protocol)||!id(value.projectId))throw new Error('Satzprüfungsfähigkeit ist ungültig.');
  return {protocol:value.protocol,projectId:value.projectId};
}
export function validSentenceRequest(value,projectId){
  return object(value)&&Object.keys(value).sort().join(',')==='assessment,projectId,questionId,sceneId,value'
    &&value.projectId===projectId&&id(value.projectId)&&id(value.sceneId)&&id(value.questionId)
    &&typeof value.value==='string'&&value.value.trim().length>0&&value.value.length<=500
    &&object(value.assessment)&&Object.keys(value.assessment).sort().join(',')==='family,forms,partOfSpeech'
    &&id(value.assessment.family)&&['verb','noun','adjective'].includes(value.assessment.partOfSpeech)
    &&Array.isArray(value.assessment.forms)&&value.assessment.forms.length>0&&value.assessment.forms.length<=20
    &&value.assessment.forms.every(id);
}
export function validSentenceResult(value){return object(value)&&Object.keys(value).sort().join(',')==='correct,feedback'&&typeof value.correct==='boolean'&&typeof value.feedback==='string'&&value.feedback.trim().length>0&&value.feedback.length<=500;}

