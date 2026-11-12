import {test} from 'node:test';
import assert from 'node:assert/strict';
import {worksheetTitle,worksheetFilename} from '../src/document-title.js';
import {serialize,deserialize} from '../src/model.js';
test('titles are optional, validated and round trip independently of region data',()=>{const data=serialize([],undefined,'Physics — 1');assert.deepEqual(deserialize(data),[]);assert.equal(JSON.parse(data).title,'Physics — 1');assert.deepEqual(deserialize('{"version":1,"regions":[]}'),[]);assert.throws(()=>worksheetTitle('a\nb'));assert.throws(()=>deserialize('{"version":1,"regions":[],"title":2}'));});
test('download filenames keep human titles and remove invalid path characters',()=>{assert.equal(worksheetFilename('Physics.json'),'Physics.json');assert.equal(worksheetFilename(' Topic: a/b '),'Topic- a-b.json');assert.equal(worksheetFilename(''),'orbit-worksheet.json');assert.equal(worksheetFilename('CON'),'worksheet-CON.json');});
