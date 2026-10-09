export const numeric = value => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
export function analyze(snapshot, position) {
  if (!Number.isFinite(position) || position <= 0) throw new Error('Enter a position greater than $0.');
  const identity = value => snapshot.network === 'solana' ? value : value?.toLowerCase();
  const target = identity(`${snapshot.network}_${snapshot.token}`);
  const seen = new Set();
  const pools = (snapshot.response?.data || []).filter(p => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    const r = p.relationships;
    return [r?.base_token?.data?.id, r?.quote_token?.data?.id].some(id => identity(id) === target);
  }).map(p => {
    const a=p.attributes || {}, reserve=numeric(a.reserve_in_usd), volume=numeric(a.volume_usd?.h24);
    const targetIsBase=identity(p.relationships.base_token?.data?.id) === target;
    return {id:p.id,address:a.address,name:a.name || 'Unnamed pool',dex:p.relationships.dex?.data?.id || 'Unknown DEX',reserve,volume,
      price:numeric(targetIsBase ? a.base_token_price_usd : a.quote_token_price_usd),
      change:targetIsBase ? numeric(a.price_change_percentage?.h24) : null,
      buys:targetIsBase ? numeric(a.transactions?.h24?.buys) : numeric(a.transactions?.h24?.sells),
      sells:targetIsBase ? numeric(a.transactions?.h24?.sells) : numeric(a.transactions?.h24?.buys),
      positionPct:reserve>0 ? position/reserve*100 : null,turnover:reserve>0 && volume!==null ? volume/reserve : null};
  }).sort((a,b)=>(b.reserve??-1)-(a.reserve??-1));
  const total=pools.reduce((sum,p)=>sum+Math.max(0,p.reserve??0),0);
  return {position,pools,total,largestShare:total>0?pools[0].reserve/total*100:null,missing:pools.filter(p=>p.reserve===null).length};
}
