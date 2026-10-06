import http from 'node:http';
import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
const url='https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=100&offset=300';
const html=`<!doctype html><script>window.probe=(async()=>{const result={origin:location.origin,url:${JSON.stringify(url)}};try{const r=await fetch(${JSON.stringify(url)},{credentials:'omit'});const events=await r.json();result.gamma={status:r.status,count:events.length};const event=events.find(e=>e.slug==='nfl-tb-dal-2026-10-09');const market=event.markets.find(m=>m.question===event.title);const ids=JSON.parse(market.clobTokenIds);result.market={eventSlug:event.slug,question:market.question,outcomes:JSON.parse(market.outcomes),assets_ids:ids};await new Promise(resolve=>{const ws=new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/market');const t=setTimeout(()=>{result.websocket??='timeout';ws.close();resolve()},18000);ws.onopen=()=>{result.websocket='open';ws.send(JSON.stringify({assets_ids:ids,type:'market',initial_dump:true}))};ws.onmessage=e=>{result.websocket='received';result.frame=e.data;clearTimeout(t);ws.close();resolve()};ws.onerror=()=>{result.websocket='error';clearTimeout(t);resolve()};ws.onclose=e=>{result.close={code:e.code,reason:e.reason}}});}catch(e){result.error=String(e)}return result})()</script>`;
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end(html)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const child=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir=/private/tmp/rothera-browser-cdp-profile',origin],{stdio:['ignore','ignore','pipe']});
let socket; const diagnostics=[];
const timeout=setTimeout(()=>{child.kill('SIGTERM');server.close();process.exitCode=1},35000);
try{
const debugging=await new Promise((resolve,reject)=>{let log='';child.stderr.on('data',b=>{log+=b.toString();const m=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)resolve(m[1])});child.once('error',reject);child.once('exit',()=>reject(new Error('Chrome exited')))});
const debugOrigin=debugging.replace(/^ws:/,'http:').split('/devtools/')[0];
const targets=await (await fetch(debugOrigin+'/json/list')).json();
socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
let id=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}else if(/webSocket/i.test(m.method))diagnostics.push(m)};
const send=(method,params={})=>new Promise(resolve=>{const key=++id;pending.set(key,resolve);socket.send(JSON.stringify({id:key,method,params}))});
await send('Network.enable');
await send('Page.navigate',{url:origin});
await new Promise(resolve=>setTimeout(resolve,1000));
const response=await send('Runtime.evaluate',{expression:'window.probe',awaitPromise:true,returnByValue:true});
const result={checkedAt:new Date().toISOString(),browser:'Google Chrome headless',response,diagnostics};
await writeFile('/private/tmp/rothera-browser-check-result.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
}finally{clearTimeout(timeout);socket?.close();child.kill('SIGTERM');server.close()}
