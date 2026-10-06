// Repeatable browser regressions. Only HTTP and WebSocket boundaries are controlled.
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchChrome } from './chrome.mjs'

const games = JSON.parse(await readFile(new URL('../src/test/games.json', import.meta.url), 'utf8'))
const browser = await launchChrome()
const { send, evaluate, waitFor } = browser
const passed = []
const origin = process.env.DEMO_URL ?? 'http://127.0.0.1:5173'
const snapshot = (id, bid = '0.40', ask = '0.50') => ({
  event_type: 'book',
  asset_id: id,
  bids: [{ price: bid }],
  asks: [{ price: ask }],
  last_trade_price: '0.45',
  tick_size: '0.01',
})
const delta = (id, bid) => ({
  event_type: 'price_change',
  price_changes: [{ asset_id: id, best_bid: bid }],
})
const receive = (messages) => evaluate(`window.feed.receive(${JSON.stringify(messages)})`)
const row = (name) => `window.readRow(${JSON.stringify(name)})`
const expectRow = async (name, prices) => {
  await waitFor(`JSON.stringify(${row(name)}) === ${JSON.stringify(JSON.stringify(prices))}`)
  assert.deepEqual(await evaluate(row(name)), prices)
}
const status = (label) =>
  waitFor(
    `[...document.querySelectorAll('[role="status"]')].some(el => el.textContent.trim() === ${JSON.stringify(label)})`,
  )
const check = (name) => {
  passed.push(name)
  console.log(`PASS ${name}`)
}

try {
  await send('Network.setBlockedURLs', {
    urls: ['*://fonts.googleapis.com/*', '*://fonts.gstatic.com/*'],
  })
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    const games = ${JSON.stringify(games)};
    const nativeFetch = window.fetch.bind(window);
    const NativeSocket = window.WebSocket;
    window.feed = {
      sockets: [], requests: [], failDiscovery: true,
      receive(messages) { this.sockets.at(-1).receive(messages); }
    };
    window.fetch = (input, options) => {
      const url = typeof input === 'string' ? input : input.url ?? String(input);
      if (!url.startsWith('https://gamma-api.polymarket.com/events?')) return nativeFetch(input, options);
      if (window.feed.failDiscovery) return Promise.resolve(new Response('', { status: 503 }));
      return Promise.resolve(new Response(JSON.stringify(games)));
    };
    window.WebSocket = class {
      static OPEN = 1;
      readyState = 0;
      constructor(url, protocols) {
        if (url !== 'wss://ws-subscriptions-clob.polymarket.com/ws/market') return new NativeSocket(url, protocols);
        window.feed.sockets.push(this);
        queueMicrotask(() => {
          if (this.readyState !== 0) return;
          this.readyState = 1;
          this.onopen?.();
        });
      }
      send(raw) {
        window.feed.requests.push(raw);
        if (raw === 'PING') queueMicrotask(() => this.onmessage?.({ data: 'PONG' }));
      }
      receive(messages) { this.onmessage?.({ data: typeof messages === 'string' ? messages : JSON.stringify(messages) }); }
      close() { if (this.readyState === 3) return; this.readyState = 3; this.onclose?.(); }
    };
  `,
  })
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', { url: origin })
  await waitFor(`document.querySelector('[role="alert"]')?.textContent.includes('503')`)
  await evaluate(`window.feed.failDiscovery = false;
    [...document.querySelectorAll('button')].find(el => el.textContent.trim() === 'Try again').click()`)
  await status('Syncing 0/4')
  await evaluate(`
    window.outcomeRow = (name) => [...document.querySelectorAll('th[scope="row"]')]
      .find(el => {
        const label = el.cloneNode(true);
        label.querySelectorAll('[aria-hidden="true"]').forEach(icon => icon.remove());
        return label.textContent.trim() === name;
      })?.closest('tr');
    window.readRow = (name) => [...(window.outcomeRow(name)?.querySelectorAll('td') ?? [])].map(el => el.textContent.trim());
    window.bidCell = () => window.outcomeRow('Chiefs').querySelector('td');
    window.flashColor = () => getComputedStyle(window.bidCell()).backgroundColor;
    window.clearFlash = () => {
      const color = window.flashColor();
      return color === 'transparent' || color === 'rgba(0, 0, 0, 0)';
    };
  `)
  await expectRow('Chiefs', ['—', '—', '—', '—'])
  check('discovery error, retry and initial missing prices')

  await receive([
    snapshot('101'),
    snapshot('102'),
    snapshot('103', '0.60', '0.70'),
    snapshot('104', '0.20', '0.30'),
  ])
  await status('Live Feed for Selected Matchup')
  await expectRow('Over 43.5', ['0.60', '0.70', '0.45', '0.10'])
  await expectRow('Under 43.5', ['0.20', '0.30', '0.45', '0.10'])
  assert.equal(await evaluate('window.clearFlash()'), true, 'Initial snapshots do not flash')
  check('snapshot display and reversed outcome mapping')

  // Inspect rendered colors, without inspecting animation objects, keyframes or calls.
  // Sample inside the fade and allow scheduling tolerance when waiting for it to clear.
  const repeated = await evaluate(`(async () => {
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    const change = bid => window.feed.receive({event_type:'price_change',price_changes:[{asset_id:'101',best_bid:bid}]});
    const green = () => {
      const channels = window.flashColor().match(/[0-9.]+/g)?.map(Number) ?? [];
      return channels[1] > channels[0] && channels[1] > channels[2] && (channels[3] ?? 1) > 0;
    };
    change('0.41'); await pause(300);
    const first = green();
    change('0.42'); await pause(300);
    return { first, restarted: green(), prices: window.readRow('Chiefs') };
  })()`)
  assert.equal(repeated.first, true, 'Increases visibly flash green')
  assert.equal(
    repeated.restarted,
    true,
    'A repeated increase extends the visible flash past the first fade',
  )
  assert.deepEqual(repeated.prices, ['0.42', '0.50', '0.45', '0.08'])
  // Reverse direction while the restarted green flash is still active.
  await receive(delta('101', '0.39'))
  await waitFor(`(() => {
    const c = window.flashColor().match(/[0-9.]+/g)?.map(Number) ?? [];
    return c[0] > c[1] && c[0] > c[2] && (c[3] ?? 1) > 0;
  })()`)
  await waitFor('window.clearFlash()', 800)
  await receive(delta('101', '0.39'))
  await evaluate(
    'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
  )
  assert.equal(await evaluate('window.clearFlash()'), true, 'An unchanged price does not flash')
  check('visible flashes, repeated increases, direction reversal, fade and unchanged prices')

  await receive({ event_type: 'tick_size_change', asset_id: '101', new_tick_size: '0.001' })
  await expectRow('Chiefs', ['0.390', '0.500', '0.450', '0.110'])
  assert.equal(await evaluate('window.clearFlash()'), true, 'Precision-only changes do not flash')
  await receive([
    null,
    { event_type: 'last_trade_price', asset_id: '101', price: '0.453' },
    { event_type: 'price_change', price_changes: [{ asset_id: '101', best_ask: '' }] },
  ])
  await expectRow('Chiefs', ['0.390', '—', '0.453', '—'])
  check('tick precision, trade updates and explicit empty quotes')
  await browser.screenshot('controlled-desktop')

  await evaluate(
    `[...document.querySelectorAll('button')].find(el => el.textContent.includes('Bills at Rams')).click()`,
  )
  await status('Syncing 0/2')
  await expectRow('Bills', ['—', '—', '—', '—'])
  await receive([snapshot('101', '0.99'), snapshot('201'), snapshot('202')])
  await status('Live Feed for Selected Matchup')
  await expectRow('Bills', ['0.40', '0.50', '0.45', '0.10'])
  assert.equal(await evaluate(`window.outcomeRow('Chiefs') === undefined`), true)
  assert.equal(
    await evaluate('window.feed.sockets.length'),
    1,
    'Game switching reuses the connection',
  )
  const operations = await evaluate(
    `window.feed.requests.filter(raw => raw !== 'PING').map(raw => JSON.parse(raw))`,
  )
  assert.deepEqual(
    operations.map(({ type, operation, assets_ids }) => ({
      operation: operation ?? type,
      assets: [...assets_ids].sort(),
    })),
    [
      { operation: 'market', assets: ['101', '102', '103', '104'] },
      { operation: 'unsubscribe', assets: ['101', '102', '103', '104'] },
      { operation: 'subscribe', assets: ['201', '202'] },
    ],
  )
  check('desktop selection, stale game messages and subscription protocol')

  await evaluate('window.feed.sockets.at(-1).close()')
  await status('Reconnecting')
  await expectRow('Bills', ['—', '—', '—', '—'])
  await status('Syncing 0/2')
  await evaluate(`window.feed.sockets[0].receive(${JSON.stringify(snapshot('201', '0.99'))})`)
  await expectRow('Bills', ['—', '—', '—', '—'])
  await receive([snapshot('201', '0.60', '0.70'), snapshot('202')])
  await status('Live Feed for Selected Matchup')
  await expectRow('Bills', ['0.60', '0.70', '0.45', '0.10'])
  check('disconnect clears stale prices and reconnect restores current prices')

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  })
  await evaluate(`const label = [...document.querySelectorAll('label')].find(el => el.textContent === 'Select a game');
    const select = document.getElementById(label.htmlFor);
    select.focus(); select.value = '1'; select.dispatchEvent(new Event('change', { bubbles: true }));`)
  await status('Syncing 0/4')
  await receive(['101', '102', '103', '104'].map((id) => snapshot(id)))
  await status('Live Feed for Selected Matchup')
  await expectRow('Chiefs', ['0.40', '0.50', '0.45', '0.10'])
  assert.equal(
    await evaluate('window.clearFlash()'),
    true,
    'Returning to a game starts without a flash',
  )
  const mobile = await evaluate(`({
    fits: document.documentElement.scrollWidth <= innerWidth,
    selectVisible: document.querySelector('select').getBoundingClientRect().height > 0,
    tableAccessible: [...document.querySelectorAll('th[scope="col"]')].map(el => el.textContent.trim()),
  })`)
  assert.equal(mobile.fits, true, 'Mobile layout fits the viewport')
  assert.equal(mobile.selectVisible, true, 'Mobile selector is visible')
  assert.deepEqual(mobile.tableAccessible, [
    'Outcome',
    'Best bid',
    'Best ask',
    'Last traded',
    'Spread',
  ])
  await browser.screenshot('controlled-mobile')
  check('mobile selection, table headings and viewport fit')

  assert.deepEqual(browser.errors, [], 'No browser runtime exceptions')
  const report = {
    checkedAt: new Date().toISOString(),
    passed,
    errors: browser.errors,
    output: browser.output,
  }
  await writeFile(join(browser.output, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`Browser report and screenshots: ${browser.output}`)
} finally {
  browser.close()
}
