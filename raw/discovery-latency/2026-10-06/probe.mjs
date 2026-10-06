import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChrome } from '../../../frontend/scripts/chrome.mjs'

const directory = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(await readFile(process.argv[2], 'utf8'))
const server = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' })
  response.end('<!doctype html><title>Direct Gamma discovery research</title>')
})
await new Promise((done) => server.listen(0, '127.0.0.1', done))
let browser
try {
  browser = await launchChrome()
  const network = []
  browser.onEvent((message) => {
    if (message.method === 'Network.responseReceived' &&
        message.params.response.url.startsWith('https://gamma-api.polymarket.com/')) {
      network.push(message.params)
    }
  })
  await browser.send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}` })
  await browser.waitFor('document.readyState === "complete"')
  for (const scenario of config) {
    const result = await browser.evaluate(`(async () => {
      const scenario = ${JSON.stringify(scenario)};
      const started = performance.now();
      const pages = [];
      let firstGameMs = null;
      const gameSlug = /^nfl-[a-z]{2,4}-[a-z]{2,4}-\\d{4}-\\d{2}-\\d{2}$/;
      async function page(offset) {
        const params = new URLSearchParams({tag_slug: 'nfl', active: 'true', closed: 'false',
          limit: '100', offset: String(offset), ...scenario.params});
        const url = 'https://gamma-api.polymarket.com/events?' + params;
        const begin = performance.now();
        try {
          const response = await fetch(url, {credentials: 'omit', cache: 'no-store',
            signal: AbortSignal.timeout(20000)});
          const headersMs = performance.now() - begin;
          const text = await response.text();
          const bodyMs = performance.now() - begin;
          const parseBegin = performance.now();
          const events = JSON.parse(text);
          const parseMs = performance.now() - parseBegin;
          if (!response.ok || !Array.isArray(events)) throw new Error('HTTP ' + response.status + ': unexpected page');
          const games = events.filter(e => gameSlug.test(e.slug) && e.ended !== true && e.closed !== true && e.active !== false);
          if (games.length && firstGameMs === null) firstGameMs = performance.now() - started;
          return {offset, url, status: response.status, headers: [...response.headers],
            headersMs, bodyMs, parseMs, elapsedMs: performance.now() - started,
            count: events.length, gameCandidates: games.length, text};
        } catch (error) {
          return {offset, url, elapsedMs: performance.now() - started, error: String(error)};
        }
      }
      let terminal = null;
      for (let offset = 0; offset < 3000; offset += 100 * scenario.concurrency) {
        const batch = await Promise.all(Array.from({length: scenario.concurrency}, (_, i) => page(offset + i * 100)));
        pages.push(...batch);
        if (batch.some(p => p.error)) break;
        const short = batch.find(p => p.count < 100);
        if (short) {terminal = short.offset; break;}
      }
      return {scenario, timestamp: new Date().toISOString(), userAgent: navigator.userAgent,
        origin: location.origin, totalMs: performance.now() - started, firstGameMs, terminal, pages};
    })()`)
    for (const page of result.pages) {
      if (page.text !== undefined) {
        await writeFile(resolve(directory, `${scenario.name}-offset-${page.offset}.json`), page.text, { flag: 'wx' })
        delete page.text
      }
    }
    await writeFile(resolve(directory, `${scenario.name}-result.json`), JSON.stringify(result, null, 2), { flag: 'wx' })
    console.log(JSON.stringify({ name: scenario.name, totalMs: result.totalMs, firstGameMs: result.firstGameMs,
      terminal: result.terminal, pages: result.pages.map(({offset, count, gameCandidates, error}) => ({offset, count, gameCandidates, error})) }))
  }
  await writeFile(resolve(directory, `${config[0].name}-network.json`), JSON.stringify({ network, errors: browser.errors }, null, 2), { flag: 'wx' })
} finally {
  browser?.close()
  await new Promise(done => server.close(done))
}
