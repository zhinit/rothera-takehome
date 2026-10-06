import http from 'node:http';
import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
const page=await (await import('node:fs/promises')).readFile('/private/tmp/rothera-clob-probe-page.js','utf8');
const html='<!doctype html><script>'+page+'</script>';
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end(html)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const child=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir=/private/tmp/rothera-clob-probe-profile',origin],{stdio:['ignore','ignore','pipe']});
let socket; const diagnostics=[];
const timeout=setTimeout(()=>{child.kill('SIGTERM');server.close();process.exitCode=1},150000);
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
await writeFile('/private/tmp/rothera-clob-probe-result.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({saved:'/private/tmp/rothera-clob-probe-result.json',frames:result.response?.result?.result?.value?.frames?.length,error:result.response?.result?.result?.value?.error}));
}finally{clearTimeout(timeout);socket?.close();child.kill('SIGTERM');server.close()}
