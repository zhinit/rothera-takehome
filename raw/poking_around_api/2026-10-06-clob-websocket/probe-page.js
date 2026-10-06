window.probe = (async () => {
  const result = { startedAt: new Date().toISOString(), origin: location.origin, frames: [], actions: [], events: [] };
  window.probeProgress = result;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const log = (kind, details) => result.actions.push({ at: Date.now(), kind, ...details });
  try {
    const events = [];
    for (let offset=0; offset<=1200; offset+=100) {
      const response = await fetch('https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=100&offset='+offset);
      const page = await response.json();
      log('gamma-page',{offset,status:response.status,count:page.length});
      events.push(...page);
      if(page.length<100)break;
    }
    const games = events.filter(e => /^nfl-[a-z]{2,4}-[a-z]{2,4}-\d{4}-\d{2}-\d{2}$/.test(e.slug))
      .map(e => ({ ...e, selected: e.markets.filter(m => m.question === e.title || new RegExp('^' + e.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ': O/U \\d+(?:\\.\\d+)?$').test(m.question)).filter(m => !m.closed) }))
      .filter(e => e.selected.length > 0).sort((a,b) => Number(b.volume24hr) - Number(a.volume24hr));
    if (games.length < 2) throw new Error('Need two NFL games on page');
    const selected = games.slice(0,2).map(e => ({slug:e.slug,title:e.title,markets:e.selected.map(m=>({question:m.question,ids:JSON.parse(m.clobTokenIds)}))}));
    result.events = selected;
    const idsA = selected[0].markets.flatMap(m=>m.ids), idsB = selected[1].markets.flatMap(m=>m.ids);
    function connect(name, ids, heartbeat, initialDump = true) {
      const ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/market');
      let timer;
      ws.onmessage = e => result.frames.push({at:Date.now(),connection:name,data:e.data});
      ws.onclose = e => { clearInterval(timer); log('close',{connection:name,code:e.code,reason:e.reason,wasClean:e.wasClean}); };
      ws.onerror = () => log('error',{connection:name});
      const send = data => { log('send',{connection:name,data});ws.send(typeof data === 'string' ? data : JSON.stringify(data)); };
      const opened = new Promise((resolve,reject) => {
        ws.addEventListener('error',()=>reject(new Error('Connection error: '+name)),{once:true});
        ws.onopen=()=>{log('open',{connection:name});send({assets_ids:ids,type:'market',initial_dump:initialDump});if(heartbeat)timer=setInterval(()=>send('PING'),10000);resolve();};
      });
      return { ws, opened, send, stop:()=>{clearInterval(timer);ws.close(1000,'probe complete');} };
    }
    const main=connect('switch',idsA,true), idle=connect('no-heartbeat',idsA,false), noDump=connect('no-initial-dump',idsA,true,false);
    await Promise.all([main.opened,idle.opened,noDump.opened]);
    await sleep(25000);
    log('phase',{phase:'A-to-B'});
    main.send({operation:'unsubscribe',assets_ids:idsA});
    main.send({operation:'subscribe',assets_ids:idsB});
    await sleep(25000);
    log('phase',{phase:'B-to-A'});
    main.send({operation:'unsubscribe',assets_ids:idsB});
    main.send({operation:'subscribe',assets_ids:idsA});
    await sleep(15000);
    log('phase',{phase:'forced-disconnect'});
    main.stop();
    await sleep(1000);
    const recovered=connect('reconnect',idsA,true);
    await recovered.opened;
    await sleep(25000);
    recovered.stop();noDump.stop();
    await sleep(20000);
    log('idle-end',{readyState:idle.ws.readyState});idle.stop();
  } catch(e) { result.error=String(e); }
  result.finishedAt=new Date().toISOString();return result;
})();
