import test from 'node:test';
import assert from 'node:assert/strict';
import {tokenCandidates,readShortlist,tokenKey} from '../dist/discovery.js';
import {analyze} from '../dist/analysis.js';
const token=(id,address,symbol)=>({id,type:'token',attributes:{address,symbol,name:symbol}});
test('search only offers linked matching tokens on the selected network and deduplicates contracts',()=>{
 const response={data:[{relationships:{base_token:{data:{id:'eth_0xAB'}},quote_token:{data:{id:'eth_0xcd'}}}},{relationships:{base_token:{data:{id:'base_0xAB'}}}}],included:[token('eth_0xAB','0xAB','ABC'),token('eth_0xAB','0xab','ABC'),token('eth_0xcd','0xcd','USDC'),token('base_0xAB','0xAB','ABC'),token('eth_0xEF','0xEF','ABC')]};
 assert.deepEqual(tokenCandidates(response,'eth','abc'),[{address:'0xAB',name:'ABC',symbol:'ABC'}]);
});
test('shortlist rejects corrupt and unsupported snapshots and caps size',()=>{
 assert.deepEqual(readShortlist('{bad'),[]);assert.deepEqual(readShortlist(JSON.stringify([{network:'unknown'}])),[]);
 const row={network:'solana',token:'abc',fetchedAt:'2026-10-08T15:06:30Z',response:{data:[]}};
 assert.equal(readShortlist(JSON.stringify(Array(12).fill(row))).length,8);
 assert.equal(tokenKey('eth','0xAB'),tokenKey('eth','0xab'));assert.notEqual(tokenKey('solana','AB'),tokenKey('solana','ab'));
});
test('quote token overview uses quote price and withholds base change',()=>{
 const snapshot={network:'eth',token:'0xQ',response:{data:[{id:'pool',attributes:{base_token_price_usd:'20',quote_token_price_usd:'1',reserve_in_usd:'2000',price_change_percentage:{h24:'50'}},relationships:{base_token:{data:{id:'eth_0xb'}},quote_token:{data:{id:'eth_0xq'}}}}]}};
 const p=analyze(snapshot,100).pools[0];assert.equal(p.price,1);assert.equal(p.change,null);assert.equal(p.positionPct,5);
});
