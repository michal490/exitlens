import test from 'node:test';import assert from 'node:assert/strict';import {analyze,numeric} from '../dist/analysis.js';
const pool=(id,reserve,volume,base='solana_ABC')=>({id,attributes:{reserve_in_usd:reserve,volume_usd:{h24:volume},price_change_percentage:{h24:'50'},transactions:{h24:{buys:4,sells:3}}},relationships:{base_token:{data:{id:base}},quote_token:{data:{id:'solana_XYZ'}}}});
const snap=data=>({network:'solana',token:'ABC',response:{data}});
test('size ratio and turnover are separate calculations',()=>{const r=analyze(snap([pool('a','50000','1000000')]),5000);assert.equal(r.pools[0].positionPct,10);assert.equal(r.pools[0].turnover,20);});
test('missing and zero reserves never produce invented ratios',()=>{const r=analyze(snap([pool('a',null,null),pool('b','0','100')]),5000);assert.equal(r.pools[0].positionPct,null);assert.equal(r.pools[1].positionPct,null);assert.equal(r.missing,1);assert.equal(numeric(''),null);});
test('deduplicates and rejects unrelated tokens',()=>{const p=pool('a','100','2');assert.equal(analyze(snap([p,p,pool('b','5','2','solana_other')]),1).pools.length,1);});
test('quote-token matches reverse transaction direction and withhold base price change',()=>{const p=pool('a','100','2','solana_other');p.relationships.quote_token.data.id='solana_ABC';const r=analyze(snap([p]),1).pools[0];assert.equal(r.change,null);assert.equal(r.buys,3);});
test('rejects invalid positions',()=>{for(const x of [0,-1,NaN,Infinity])assert.throws(()=>analyze(snap([]),x));});
test('reserve concentration denominator is returned pools only',()=>{const r=analyze(snap([pool('a',75,1),pool('b',25,1)]),5);assert.equal(r.total,100);assert.equal(r.largestShare,75);});
