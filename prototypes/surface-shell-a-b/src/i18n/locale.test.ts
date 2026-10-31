import assert from 'node:assert/strict';
import {test} from 'node:test';
import english from './en.json' with {type:'json'};
import {getUiLocale,parseUiLocale,setUiLocale,subscribeUiLocale,uiLanguageTag,uiLocaleStorageKey} from './locale.ts';
import {t} from './translate.ts';

test('language preference survives storage failures and follows other local windows',()=>{
 const data=new Map<string,string>([[uiLocaleStorageKey,'unsupported']]);
 const events=new Map<string,EventListener>();let blocked=false,calls=0;
 const previous=globalThis.window;
 Object.assign(globalThis,{window:{
  localStorage:{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{if(blocked)throw Error('Unavailable');data.set(key,value);}},
  addEventListener:(name:string,listener:EventListener)=>events.set(name,listener),
  removeEventListener:(name:string)=>events.delete(name),
 }});
 try{
  assert.equal(parseUiLocale(null),'de');assert.equal(parseUiLocale('EN'),'de');assert.equal(getUiLocale(),'de');
  const unsubscribe=subscribeUiLocale(()=>calls++);
  setUiLocale('en');assert.equal(calls,1);assert.equal(data.get(uiLocaleStorageKey),'en');assert.equal(uiLanguageTag(),'en-GB');
  assert.equal(t('Einstellungen'),'Settings');
  assert.equal(t('{0} umbenennen','Stift'),'Rename Stift','values remain content, including names that match UI source keys');
  assert.equal(t('Unknown text'),'Unknown text');assert.equal(t('__proto__'),'__proto__');assert.equal(t('toString'),'toString');
  setUiLocale('en');assert.equal(calls,1);
  data.set(uiLocaleStorageKey,'de');events.get('storage')!({key:uiLocaleStorageKey} as StorageEvent);
  assert.equal(getUiLocale(),'de');assert.equal(t('Einstellungen'),'Einstellungen');assert.equal(calls,2);
  blocked=true;setUiLocale('en');assert.equal(getUiLocale(),'en');assert.equal(calls,3);
  data.delete(uiLocaleStorageKey);events.get('storage')!({key:null} as StorageEvent);assert.equal(getUiLocale(),'de');
  unsubscribe();assert.equal(events.size,0);
 }finally{Object.assign(globalThis,{window:previous});}
});
test('catalogue preserves every positional placeholder',()=>{
 const placeholders=(text:string)=>[...text.matchAll(/\{\d+\}/g)].map(match=>match[0]).sort();
 for(const [source,translation] of Object.entries(english)){
  assert.ok(translation.trim(),source);
  assert.deepEqual(placeholders(translation),placeholders(source),source);
 }
});
