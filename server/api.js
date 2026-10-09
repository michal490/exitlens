const networks=new Set(['solana','eth','base','bsc']);
const requests=new Map();
const pending=new Map();
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function upstreamURL(url){
 const network=url.searchParams.get('network');if(!networks.has(network))throw Error('Choose a supported network.');
 let path;
 if(url.pathname==='/api/search'){
  const query=url.searchParams.get('query')?.trim();if(!query||query.length<2||query.length>100)throw Error('Enter a token name or symbol between 2 and 100 characters.');
  path=new URL('https://pro-api.coingecko.com/api/v3/onchain/search/pools');path.searchParams.set('query',query);path.searchParams.set('network',network);
 }else if(url.pathname==='/api/pools'){
  const token=url.searchParams.get('token')||'';if(!(network==='solana'?/^[1-9A-HJ-NP-Za-km-z]{32,44}$/:/^0x[0-9a-fA-F]{40}$/).test(token))throw Error('Enter a valid token contract for this network.');
  path=new URL(`https://pro-api.coingecko.com/api/v3/onchain/networks/${network}/tokens/${network==='solana'?token:token.toLowerCase()}/pools`);
 }else throw Error('Unknown data endpoint.');
 path.searchParams.set('include','base_token,quote_token,dex');path.searchParams.set('page','1');return path;
}
export async function handleAPI(request,env={},context={},deps={}){
 const url=new URL(request.url);
 if(request.method!=='GET')return reply({error:'Only GET is supported.'},405);
 if(!['/api/search','/api/pools'].includes(url.pathname))return reply({error:'Not found.'},404);
 let upstream;try{upstream=upstreamURL(url);}catch(e){return reply({error:e.message},400);}
 if(!env.COINGECKO_API_KEY)return reply({error:'The server API key has not been configured. The saved example remains available.'},503);
 const now=Date.now(),ip=request.headers.get('CF-Connecting-IP')||'local';
 for(const [key,row] of requests)if(row.until<=now)requests.delete(key);
 const bucket=requests.get(ip)||{count:0,until:now+60000};
 if(bucket.count>=30||requests.size>10000)return reply({error:'Too many checks. Please wait a minute.'},429);
 bucket.count++;requests.set(ip,bucket);
 // Dispatch Workers cannot access the default cache. Named caches are supported.
 let cache=deps.cache;try{cache??=await globalThis.caches?.open('poolcheck-api-v1');}catch{cache=undefined;}
 const cacheKey=new Request(new URL('/_poolcheck-cache/'+encodeURIComponent(upstream.href),url.origin));
 try{const hit=await cache?.match(cacheKey);if(hit)return reply(await hit.json());}catch{/* Cache availability must not prevent a fresh request. */}
 const fetcher=deps.fetch??fetch;
 try{
  let work=pending.get(upstream.href);
  if(!work){work=(async()=>{
   const r=await fetcher(upstream,{headers:{'x-cg-pro-api-key':env.COINGECKO_API_KEY,accept:'application/json'},signal:AbortSignal.timeout(20000),redirect:'manual'});
   if(!r.ok)return {status:r.status===429?429:502,error:r.status===429?'CoinGecko’s API limit was reached. Please retry in a minute.':r.status===401||r.status===403?'CoinGecko rejected the server key or this endpoint’s access.':'CoinGecko could not complete this request. Please retry.'};
   const response=await r.json();if(!Array.isArray(response.data))return {status:502,error:'CoinGecko returned an unexpected response.'};
   return {response,fetchedAt:new Date().toISOString(),endpoint:upstream.href,provider:'COINGECKO PRO API'};
  })();pending.set(upstream.href,work);}
  const data=await work;if(data.error)return reply({error:data.error},data.status);
  if(cache){const write=Promise.resolve().then(()=>cache.put(cacheKey,Response.json(data,{headers:{'Cache-Control':'public, max-age=60'}}))).catch(()=>{});if(context.waitUntil)context.waitUntil(write);else await write;}
  return reply(data);
 }catch(e){console.error('CoinGecko request failed:',String(e.message).replaceAll(env.COINGECKO_API_KEY,'[redacted]'));return reply({error:'The CoinGecko request timed out or was unavailable. Please retry.'},502);}finally{pending.delete(upstream.href);}
}
