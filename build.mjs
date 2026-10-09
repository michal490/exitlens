import fs from 'node:fs';
const files=['index.html','app.js','analysis.js','discovery.js','style.css','theme.css','example.json','coingecko-api-logo.svg'];
const mime={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json',svg:'image/svg+xml'};
const assets=Object.fromEntries(files.map(name=>['/'+name,{body:fs.readFileSync('dist/'+name,'utf8'),type:mime[name.split('.').pop()]}]));
fs.mkdirSync('dist/server',{recursive:true});
fs.writeFileSync('dist/server/index.js',fs.readFileSync('server/api.js','utf8')+'\nconst assets='+JSON.stringify(assets)+';\nexport default {async fetch(request,env,ctx){const url=new URL(request.url);if(url.pathname.startsWith("/api/"))return handleAPI(request,env,ctx);if(!["GET","HEAD"].includes(request.method))return new Response("Method not allowed",{status:405});const asset=assets[url.pathname==="/"?"/index.html":url.pathname];return asset?new Response(request.method==="HEAD"?null:asset.body,{headers:{"Content-Type":asset.type,"X-Content-Type-Options":"nosniff"}}):new Response("Not found",{status:404});}};\n');
console.log('Built ExitLens Worker; secrets are supplied only at runtime.');
