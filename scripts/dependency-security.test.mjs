import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url));
const katex=require('katex');
const {template,fromPairs,unset}=await import(pathToFileURL(require.resolve('lodash-es')).href);

test('formula options cannot inherit trust while explicit trusted rendering remains available',()=>{
 const expression='\\href{https://example.org}{Link}';
 const inherited=Object.assign(Object.create({trust:true}),{strict:'ignore'});
 assert.doesNotMatch(katex.renderToString(expression,inherited),/<a\b/);
 assert.match(katex.renderToString(expression,{trust:true,strict:'ignore'}),/<a\b/);
});

test('the installed formula renderer preserves fraction, root and MathML output',()=>{
 const rendered=katex.renderToString('\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',{throwOnError:true});
 assert.match(rendered,/<math\b/);
 assert.match(rendered,/<mfrac>/);
 assert.match(rendered,/<msqrt>/);
});


test('the utility build preserves template imports and pair conversion',()=>{
 assert.equal(template('Hello <%= name %>',{imports:{name:'Welt'}})(),'Hello Welt');
 assert.deepEqual(fromPairs([['answer',42],['ready',true]]),{answer:42,ready:true});
});

test('utility guards reject injected imports and wrapped prototype paths',()=>{
 assert.throws(()=>template('Hello',{imports:{'value=1':1}}));
 const root={constructor:{prototype:{protected:'present'}}};
 assert.equal(unset(root,[['constructor'],['prototype'],'protected']),false);
 assert.equal(root.constructor.prototype.protected,'present');
});
