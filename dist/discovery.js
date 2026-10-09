export function tokenCandidates(response, network, query) {
  const q=query.trim().toLowerCase(), seen=new Set();
  const linked=new Set((response.data||[]).flatMap(p=>[p.relationships?.base_token?.data?.id,p.relationships?.quote_token?.data?.id]));
  return (response.included||[]).filter(t=>t.type==='token' && t.id?.startsWith(network+'_') && linked.has(t.id)).filter(t=>{
    const a=t.attributes||{}, key=network==='solana'?a.address:a.address?.toLowerCase();
    if(!key||seen.has(key)||![a.name,a.symbol,a.address].some(v=>v?.toLowerCase().includes(q)))return false;
    seen.add(key);return true;
  }).map(t=>({address:t.attributes.address,name:t.attributes.name||'Unnamed token',symbol:t.attributes.symbol||'Unknown'}));
}
export const tokenKey=(network,address)=>network+'_'+(network==='solana'?address:address.toLowerCase());
export function readShortlist(raw){
  try {const rows=JSON.parse(raw);return Array.isArray(rows)?rows.filter(x=>['solana','eth','base','bsc'].includes(x?.network)&&typeof x.token==='string'&&typeof x.fetchedAt==='string'&&Number.isFinite(Date.parse(x.fetchedAt))&&Array.isArray(x.response?.data)).slice(0,8):[];} catch{return [];}
}
