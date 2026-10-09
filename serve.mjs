import http from 'node:http';
import './build.mjs';
const {default:worker}=await import('./dist/server/index.js');
http.createServer(async(req,res)=>{
 try{const response=await worker.fetch(new Request(new URL(req.url,'http://127.0.0.1:4178'),{method:req.method}),process.env,{});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}
 catch{res.writeHead(500).end('Request failed.');}
}).listen(4178,'127.0.0.1',()=>console.log('ExitLens: http://127.0.0.1:4178'));
