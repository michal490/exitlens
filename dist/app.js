import {analyze} from './analysis.js';

import {tokenCandidates,tokenKey,readShortlist} from './discovery.js';

const $=id=>document.getElementById(id), money=n=>n===null?'Unavailable':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n), pct=n=>n===null?'Unavailable':`${n.toFixed(2)}%`, esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let snapshot, report, selected=0, saved=false, lastFetch=0, busy=false, view='check';

const cache=new Map();

let shortlist=[];try{shortlist=readShortlist(localStorage.getItem('poolcheck-shortlist-v1'));}catch{}

const price=n=>n==null?'Unavailable':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumSignificantDigits:6}).format(n);

function render(){

 report=analyze(snapshot,Number($('position').value)); selected=Math.min(selected,Math.max(0,report.pools.length-1));

 $('results').hidden=view==='shortlist'; $('mode').textContent=saved?'SAVED REAL EXAMPLE · HISTORICAL DATA':'API DATA · POINT-IN-TIME SNAPSHOT';

 const sameId=id=>snapshot.network==='solana'?id===`${snapshot.network}_${snapshot.token}`:id?.toLowerCase()===`${snapshot.network}_${snapshot.token}`.toLowerCase();

 const tokenData=snapshot.response.included?.find(t=>t.type==='token'&&sameId(t.id));

 $('token-title').textContent=tokenData?.attributes?.symbol || 'Token report';

 $('stamp').textContent=`${snapshot.network.toUpperCase()} · Fetched ${new Date(snapshot.fetchedAt).toISOString().replace('T',' ').slice(0,19)} UTC · ${snapshot.token}`;

 $('source').href=snapshot.endpoint;

 $('coverage').textContent=`${report.pools.length} pools returned · Page 1`;

 const p=report.pools[selected];

 $('overview').innerHTML=`<div class="section-title"><div><span class="eyebrow">SELECTED POOL SNAPSHOT</span><h2>${esc(tokenData?.attributes?.name||'Token overview')}</h2></div><strong class="token-price">${price(p?.price)}</strong></div><div class="overview-grid"><div><span>24h price change</span><strong>${pct(p?.change??null)}</strong></div><div><span>24h token buys / sells</span><strong>${p?.buys??'—'} / ${p?.sells??'—'}</strong></div><div><span>Pools in this response</span><strong>${report.pools.length}</strong></div></div><p class="footnote">${esc(p?.name||'No selected pool')} · ${esc(p?.dex||'')} · Price from this pool, not an execution quote. Counts are swaps, not people.</p>`;

 $('overview').hidden=view!=='check';$('pool-details').hidden=view!=='pools';



 $('metrics').innerHTML=[['Your position',money(report.position),'Hypothetical USD value'],['Selected pool reserves',money(p?.reserve??null),'Both assets, reported value'],['Position / reserves',pct(p?.positionPct??null),'Size context, not price impact'],['24h volume / reserves',p?.turnover==null?'Unavailable':`${p.turnover.toFixed(1)}×`,'Past activity / current reserves']].map(([label,value,note])=>`<div class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');

 $('focus').innerHTML=p?`<div><span class="eyebrow">YOUR POSITION, IN CONTEXT</span><h2>${p.positionPct===null?'This pool has no usable reserve figure.':`${money(report.position)} is ${pct(p.positionPct)} of this pool’s reported reserves.`}</h2><p>${p.positionPct===null?'A size comparison cannot be calculated here.':`That is a comparison of size. It does not mean your trade would move the price by ${pct(p.positionPct)}.`}</p><p><a href="https://www.geckoterminal.com/${encodeURIComponent(snapshot.network)}/pools/${encodeURIComponent(p.address)}" target="_blank" rel="noreferrer">View selected pool on GeckoTerminal</a></p></div><div><span class="eyebrow">${esc(p.name)} · ${esc(p.dex)}</span><div class="big">${pct(p.positionPct)}</div><div class="compare-label"><span>Position / total pool reserves</span><span>100%</span></div><div class="bar"><i style="width:${Math.min(100,Math.max(0,p.positionPct||0))}%"></i></div><p>${money(p.volume)} traded over 24 hours. That is activity over time, not money waiting to fill your order.</p><p class="footnote">24h token buys: ${p.buys??'Unavailable'} · sells: ${p.sells??'Unavailable'} · swap counts, not people</p></div>`:'<h2>No matching pools were returned.</h2><p>Check the network and exact token address. An empty result is not proof that the token has no liquidity.</p>';

 $('pool-rows').innerHTML=report.pools.map((p,i)=>`<tr class="${i===selected?'selected':''}"><td><button data-pool="${i}" aria-pressed="${i===selected}">${esc(p.name)}<small>${esc(p.dex)} · ${esc(p.address?.slice(0,6))}…${esc(p.address?.slice(-4))}</small></button></td><td>${money(p.reserve)}</td><td>${pct(p.positionPct)}</td><td>${money(p.volume)}</td><td class="${p.change>0?'green':''}">${p.change===null?'Unavailable':`${p.change>0?'+':''}${pct(p.change)}`}</td></tr>`).join('');

 $('distribution').innerHTML=report.total>0?report.pools.slice(0,5).map(p=>`<div class="distribution-row"><span>${esc(p.dex)} · ${esc(p.address?.slice(0,6))}…</span><strong>${pct((p.reserve||0)/report.total*100)}</strong></div><div class="bar"><i style="width:${Math.max(0,p.reserve||0)/report.total*100}%"></i></div>`).join('')+`<p class="muted">${money(report.total)} reported across ${report.pools.length} returned pools. ${report.missing} missing reserve values.</p>`:'<p>No positive reserve values available.</p>';

 document.querySelectorAll('[data-pool]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.pool);render();});

}

function setView(next){view=next;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));$('research-inputs').hidden=view==='shortlist';$('shortlist-view').hidden=view!=='shortlist';$('results').hidden=!snapshot||view==='shortlist';if(snapshot)render();renderShortlist();}

function setBusy(value){busy=value;document.querySelectorAll('#check,#search-button,#example,[data-candidate],[data-recheck]').forEach(b=>b.disabled=value);}

async function getResponse(endpoint){

 const cached=cache.get(endpoint);if(cached&&Date.now()-cached.time<60000)return cached;

 if(Date.now()-lastFetch<10000)throw Error('Please wait 10 seconds between API requests.');lastFetch=Date.now();

 const r=await fetch(endpoint,{signal:AbortSignal.timeout(20000)});

 if(!r.ok)throw Error(r.status===429?'The shared API limit was reached. Wait a minute and retry.':`The data request failed (${r.status}). Try again later.`);

 const response=await r.json();if(!Array.isArray(response.data))throw Error('The API returned an unexpected response.');

 const result={response,time:Date.now(),fetchedAt:new Date().toISOString()};cache.set(endpoint,result);return result;

}

function failure(e){$('status').textContent=(e.name==='TimeoutError'?'The request timed out. Try again shortly.':e.message)+(snapshot?' The previous dated report is still shown.':'');}

async function lookup(network,token){

 if(busy)return;

 if(!(network==='solana'?/^[1-9A-HJ-NP-Za-km-z]{32,44}$/:/^0x[0-9a-fA-F]{40}$/).test(token)){$('status').textContent='Enter a valid contract address for this network.';return;}

 if(!Number.isFinite(Number($('position').value))||Number($('position').value)<=0){$('status').textContent='Enter a trade size greater than $0.';return;}

 setBusy(true);$('status').textContent='Reading pool data…';

 try{const endpoint=`https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${encodeURIComponent(token)}/pools?include=base_token,quote_token,dex&page=1`;

 const data=await getResponse(endpoint);snapshot={network,token,fetchedAt:data.fetchedAt,endpoint,response:data.response};saved=false;selected=0;

 $('network').value=network;$('token').value=token;$('status').textContent='Dated snapshot loaded. Identical requests may reuse data for up to 60 seconds.';setView(view==='shortlist'?'check':view);

 }catch(e){failure(e);}finally{setBusy(false);}

}

$('lookup').onsubmit=e=>{e.preventDefault();lookup($('network').value,$('token').value.trim());};

$('discovery').onsubmit=async e=>{e.preventDefault();if(busy)return;const query=$('query').value.trim(),network=$('search-network').value;if(query.length<2)return;

 setBusy(true);$('status').textContent='Finding matching tokens…';$('candidates').replaceChildren();

 try{const endpoint=`https://api.geckoterminal.com/api/v2/search/pools?query=${encodeURIComponent(query)}&network=${network}&include=base_token,quote_token,dex&page=1`;const {response}=await getResponse(endpoint),candidates=tokenCandidates(response,network,query);

 $('candidates').innerHTML=candidates.map((c,i)=>`<button type="button" class="candidate quiet" data-candidate="${i}"><strong>${esc(c.name)} · ${esc(c.symbol)}</strong><span>${esc(network.toUpperCase())} · ${esc(c.address)}</span><small>Use this contract</small></button>`).join('');

 $('status').textContent=candidates.length?'Choose the exact token. Search covers up to 20 matching pools; it is not a verified-token list.':'No matching token metadata returned. Try a full name or paste the official contract below.';

 document.querySelectorAll('[data-candidate]').forEach(b=>b.onclick=()=>{const c=candidates[Number(b.dataset.candidate)];$('network').value=network;$('token').value=c.address;$('status').textContent=`Selected ${c.symbol}. Check the contract, then click Check pools. The report below still refers to its displayed token.`;});

 }catch(e){failure(e);}finally{setBusy(false);}

};

$('position').addEventListener('input',()=>{if(snapshot&&Number($('position').value)>0){render();renderShortlist();}else $('status').textContent='Enter a trade size greater than $0. The previous report is unchanged.';});

for(const id of ['network','token'])$(id).addEventListener('input',()=>{$('status').textContent='Inputs changed. Click Check pools to load them; the previous report still shows its original token.';});

document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{$('position').value=b.dataset.size;if(snapshot)render();renderShortlist();});

document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));

$('example').onclick=async()=>{if(busy)return;setBusy(true);try{snapshot=await fetch('example.json').then(r=>r.json());saved=true;selected=0;$('network').value=snapshot.network;$('token').value=snapshot.token;$('status').textContent='Saved API response from 8 October 2026. Changing the trade size recalculates locally.';setView('check');}catch(e){failure(e);}finally{setBusy(false);}};

function persist(){try{localStorage.setItem('poolcheck-shortlist-v1',JSON.stringify(shortlist));return true;}catch{$('status').textContent='This browser could not save the shortlist. It remains available only until the page closes.';return false;}}

function renderShortlist(){

 $('saved-count').textContent=shortlist.length;

 $('shortlist-rows').innerHTML=shortlist.length?shortlist.map((s,i)=>{const r=analyze(s,Number($('position').value)>0?Number($('position').value):5000),p=r.pools[0],meta=s.response.included?.find(t=>t.type==='token'&&tokenKey(s.network,t.attributes?.address||'')===tokenKey(s.network,s.token));return `<article class="saved-card"><div><h3>${esc(meta?.attributes?.name||'Token')} · ${esc(meta?.attributes?.symbol||s.token)}</h3><p class="footnote">Largest returned pool: ${esc(p?.name||'Unavailable')} · ${esc(p?.dex||'')}</p><p class="footnote">${esc(s.network.toUpperCase())} · ${esc(s.token)}</p><p>${s.historical?'HISTORICAL EXAMPLE':'SAVED SNAPSHOT'} · ${esc(new Date(s.fetchedAt).toISOString().replace('T',' ').slice(0,19))} UTC</p></div><div class="overview-grid"><div><span>Largest returned pool reserves</span><strong>${money(p?.reserve??null)}</strong></div><div><span>Token price in that pool</span><strong>${price(p?.price)}</strong></div><div><span>${money(r.position)} / reserves</span><strong>${pct(p?.positionPct??null)}</strong></div></div><div class="actions"><button class="quiet" data-open="${i}">Open saved check</button><button class="quiet" data-recheck="${i}">Check current pools</button><button class="quiet" data-remove="${i}" aria-label="Remove ${esc(p?.name||'token')} from shortlist">Remove</button></div></article>`;}).join(''):'<p class="empty">Find a token or open the saved example, then choose <strong>Save to shortlist</strong>. Keep up to eight tokens here.</p>';

 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{snapshot=shortlist[Number(b.dataset.open)];saved=!!snapshot.historical;selected=0;$('network').value=snapshot.network;$('token').value=snapshot.token;$('status').textContent='Opened a saved snapshot. Use Check pools for a current request.';setView('check');});

 document.querySelectorAll('[data-recheck]').forEach(b=>{b.disabled=busy;b.onclick=()=>{const s=shortlist[Number(b.dataset.recheck)];lookup(s.network,s.token);};});

 document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{shortlist.splice(Number(b.dataset.remove),1);persist();renderShortlist();});

}

$('save-token').onclick=()=>{if(!snapshot||!report.pools.length){$('status').textContent='Load a token with matching pools before saving.';return;}const key=tokenKey(snapshot.network,snapshot.token),index=shortlist.findIndex(s=>tokenKey(s.network,s.token)===key);if(index<0&&shortlist.length>=8){$('status').textContent='Your shortlist has eight tokens. Remove one before adding another.';return;}const entry={...snapshot,historical:saved};if(index>=0)shortlist[index]=entry;else shortlist.push(entry);if(persist())$('status').textContent='Saved in this browser. Saving this token again replaces its previous snapshot.';renderShortlist();};

renderShortlist();

$('export').onclick=()=>{const blob=new Blob([JSON.stringify({...snapshot,analysis:report,methodology:'Position / total pool reserves is not price impact. Page 1 only.'},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='poolcheck-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};

$('example').click();



if(document.modelContext?.registerTool){

 const lifecycle=new AbortController();

 try{Promise.resolve(document.modelContext.registerTool({name:'read_poolcheck_report',description:'Read the currently displayed token snapshot and trade-size comparisons. Does not fetch new prices.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(!input||Object.keys(input).length)throw Error('No inputs are supported.');return snapshot?{network:snapshot.network,token:snapshot.token,fetchedAt:snapshot.fetchedAt,historical:saved,report}: {status:'No report loaded'};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}

 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});

}

