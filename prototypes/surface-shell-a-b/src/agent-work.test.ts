import {test} from 'node:test';
import assert from 'node:assert/strict';
import {agentSuccessMs,createAgentWorkTracker,workLeaseMs} from './agent-work.ts';
import {readTeachingAgentCommand} from '../teaching-agent-protocol.mjs';
const id='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const cmd=(action:'start'|'heartbeat'|'finish'|'cancel',lessonId='lesson',workId=id)=>({type:'workPhase' as const,lessonId,workId,action});
test('work protocol only accepts stable lesson/phase identity and named transitions',()=>{
 assert.deepEqual(readTeachingAgentCommand(cmd('start')),cmd('start'));
 for(const invalid of [{...cmd('start'),workId:'free text'},{...cmd('start'),action:'done'},{...cmd('start'),lessonId:'../secret'}])assert.throws(()=>readTeachingAgentCommand(invalid));
});
test('phase spans successful steps, blocks pending/failed work and checks final revision',()=>{
 let clock=100;const tracker=createAgentWorkTracker(()=>clock);
 tracker.command(cmd('start'));
 tracker.observe('lesson','import','Fügt Material hinzu','working',clock+30_000);
 assert.throws(()=>tracker.check('lesson',id),/offen/);
 tracker.observe('lesson','import','Material hinzugefügt','done',clock+30_000);
 assert.equal(tracker.visible()[0].outcome,'active');
 const version=tracker.check('lesson',id);
 tracker.observe('lesson','canvas','Ordnet den Canvas','working',clock+30_000);
 tracker.observe('lesson','canvas','Fertig','done',clock+30_000);
 assert.throws(()=>tracker.finish('lesson',id,version),/verändert/);
 tracker.observe('lesson','failure','Ordnet den Canvas','working',clock+30_000);
 tracker.observe('lesson','failure','Nicht übernommen','error',clock+30_000);
 tracker.observe('lesson','later','Fertig','done',clock+30_000);
 assert.throws(()=>tracker.check('lesson',id),/fehlgeschlagene/);
 tracker.command(cmd('cancel'));
 assert.equal(tracker.command(cmd('start')).outcome,'cancelled');
 tracker.command(cmd('start','lesson',other));
 tracker.observe('lesson','failure','Nicht übernommen','error',clock+30_000);
 tracker.finish('lesson',other,tracker.check('lesson',other));
 assert.equal(tracker.visible()[0].label,'Canvas gespeichert');
 clock+=agentSuccessMs-1;assert.equal(tracker.visible().length,1);
 clock+=1;assert.equal(tracker.visible().length,0);
});
test('heartbeat expiry, disconnect, wrong lesson and stale phase cannot produce success',()=>{
 let clock=1;const tracker=createAgentWorkTracker(()=>clock);
 tracker.command(cmd('start'));
 assert.throws(()=>tracker.command(cmd('start','lesson',other)),/bereits/);
 assert.throws(()=>tracker.command(cmd('heartbeat','other')),/Zielstunde/);
 clock+=workLeaseMs-1;tracker.command(cmd('heartbeat'));
 clock+=workLeaseMs-1;assert.equal(tracker.visible()[0].outcome,'active');
 clock+=2;assert.equal(tracker.visible()[0].outcome,'unconfirmed');
 assert.throws(()=>tracker.command(cmd('heartbeat')),/beendet/);
 assert.throws(()=>tracker.check('lesson',id),/beendet/);
 tracker.command(cmd('start','lesson',other));
 tracker.command(cmd('cancel')); // delayed cancellation of old ID leaves current phase alone
 assert.equal(tracker.visible()[0].id,other);assert.equal(tracker.visible()[0].outcome,'active');
 tracker.disconnect();assert.equal(tracker.visible()[0].outcome,'unconfirmed');
});

test('a failed final flush ends the phase without a success claim',()=>{
 const tracker=createAgentWorkTracker();tracker.command(cmd('start'));
 const version=tracker.check('lesson',id);
 tracker.fail('lesson',id,'Übernommen · noch nicht gespeichert');
 assert.equal(tracker.visible()[0].phase,'error');
 assert.throws(()=>tracker.finish('lesson',id,version),/beendet/);
});

test('archive finish requires a matching operation and verified current material',()=>{
 const tracker=createAgentWorkTracker();
 tracker.command({...cmd('start'),scope:'archive',preparation:'images'});
 assert.equal(tracker.visible()[0].label,'Bereitet Bilder vor');
 tracker.observe('lesson','late','Material archiviert','done',Infinity,{source:'material',workId:id,materialPath:'old.png'});
 tracker.observe('lesson','foreign','Archiviert Material','working',Infinity,{source:'material',workId:other});
 tracker.observe('lesson','foreign','Material archiviert','done',Infinity,{source:'material',workId:other,materialPath:'old.png'});
 assert.throws(()=>tracker.archivePaths('lesson',id),/Materialnachweis/);
 tracker.observe('lesson','import','Archiviert Material','working',Infinity,{source:'material',workId:id});
 assert.throws(()=>tracker.check('lesson',id),/offen/);
 tracker.observe('lesson','import','Material archiviert','done',Infinity,{source:'material',workId:id,materialPath:'cards.png'});
 const version=tracker.check('lesson',id);
 assert.throws(()=>tracker.finish('lesson',id,version,new Set(['other.png'])),/Bestand/);
 assert.equal(tracker.finish('lesson',id,version,new Set(['cards.png'])).label,'Material archiviert');
});

test('canvas completion counts saved images across batches',()=>{
 const tracker=createAgentWorkTracker();
 tracker.command(cmd('start'));
 tracker.observe('lesson','batch','Platziert {0} Bilder','working',Infinity,{source:'canvas',imageCount:7});
 tracker.observe('lesson','batch','Speichert den Canvas','working',Infinity);
 tracker.observe('lesson','batch','Canvas gespeichert · {0} Bilder','done',Infinity,{source:'canvas',imageCount:7});
 tracker.observe('lesson','resize','Ordnet den Canvas','working',Infinity);
 tracker.observe('lesson','resize','Canvas gespeichert','done',Infinity,{source:'canvas',imageCount:0});
 const result=tracker.finish('lesson',id,tracker.check('lesson',id));
 assert.equal(result.imageCount,7);
 assert.equal(result.label,'Canvas gespeichert · {0} Bilder');
});
