import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChrome } from '../../../frontend/scripts/chrome.mjs'

const directory = dirname(fileURLToPath(import.meta.url))
const fixture = await readFile(join(directory, 'metadata-cache-fixture.json'), 'utf8')
const server = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' })
  response.end('<!doctype html><title>Browser metadata cache research</title>')
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
let browser
try {
  browser = await launchChrome()
  const network = []
  browser.onEvent(message => {
    if (['Network.requestWillBeSent','Network.requestWillBeSentExtraInfo','Network.responseReceived',
      'Network.responseReceivedExtraInfo','Network.loadingFinished','Network.requestServedFromCache'].includes(message.method)) {
      network.push(message)
    }
  })
  await browser.send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}` })
  await browser.waitFor('document.readyState === "complete"')
  const result = await browser.evaluate(`(async () => {
    const fixture = ${JSON.stringify(fixture)};
    const samples = [];
    let start = performance.now();
    localStorage.setItem('nfl-discovery-v1', fixture);
    const storageWriteMs = performance.now() - start;
    for (let i = 0; i < 10; i++) {
      start = performance.now();
      const data = JSON.parse(localStorage.getItem('nfl-discovery-v1'));
      samples.push({readAndParseMs: performance.now() - start, games: data.games.length,
        markets: data.games.reduce((n,g) => n + g.markets.length, 0)});
    }
    const cache = await caches.open('nfl-discovery-research-v1');
    start = performance.now();
    await cache.put('/metadata-research', new Response(fixture));
    const cacheWriteMs = performance.now() - start;
    start = performance.now();
    const data = await (await cache.match('/metadata-research')).json();
    const cacheReadAndParseMs = performance.now() - start;
    const requests = [];
    const url = 'https://gamma-api.polymarket.com/events?tag_slug=nfl&active=true&closed=false&limit=100&offset=0';
    for (const mode of ['default', 'default', 'no-cache']) {
      start = performance.now();
      const response = await fetch(url, {credentials: 'omit', cache: mode, signal: AbortSignal.timeout(20000)});
      const text = await response.text();
      requests.push({url, mode, status: response.status, milliseconds: performance.now() - start,
        bytes: new TextEncoder().encode(text).length, count: JSON.parse(text).length,
        visibleHeaders: [...response.headers]});
    }
    return {timestamp: new Date().toISOString(), userAgent: navigator.userAgent, origin: location.origin,
      storageWriteMs, samples, cacheWriteMs, cacheReadAndParseMs, cacheGames: data.games.length, requests};
  })()`)
  await writeFile(join(directory, 'cache-result.json'), JSON.stringify({result, network, errors:browser.errors}, null, 2), {flag:'wx'})
  console.log(JSON.stringify(result, null, 2))
} finally {
  browser?.close()
  await new Promise(done => server.close(done))
}
