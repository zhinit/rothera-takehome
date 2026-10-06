// Optional live connectivity check. Requires active games and access to Polymarket.
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchChrome } from './chrome.mjs'

const origin = process.env.DEMO_URL ?? 'http://127.0.0.1:5173'
const browser = await launchChrome()
const { output, errors, send, evaluate, screenshot } = browser
const waitFor = (expression) => browser.waitFor(expression, 45_000)
try {
  const socketIds = new Set()
  const sent = []
  const received = { book: 0, price_change: 0, last_trade_price: 0, tick_size_change: 0, PONG: 0 }
  const gammaOffsets = []
  browser.onEvent((message) => {
    const { method, params } = message
    if (
      method === 'Network.requestWillBeSent' &&
      params.request.url.startsWith('https://gamma-api.polymarket.com/events?')
    ) {
      gammaOffsets.push(new URL(params.request.url).searchParams.get('offset'))
    }
    if (method === 'Network.webSocketCreated' && params.url.includes('polymarket'))
      socketIds.add(params.requestId)
    if (!socketIds.has(params?.requestId)) return
    if (method === 'Network.webSocketFrameSent') sent.push(params.response.payloadData)
    if (method === 'Network.webSocketFrameReceived') {
      const raw = params.response.payloadData
      if (raw === 'PONG') {
        received.PONG++
        return
      }
      try {
        const parsed = JSON.parse(raw)
        for (const event of Array.isArray(parsed) ? parsed : [parsed]) {
          if (Object.hasOwn(received, event.event_type)) received[event.event_type]++
        }
      } catch {
        /* Heartbeats and unknown non-JSON frames are not market events. */
      }
    }
  })
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    window.testSockets = [];
    window.WebSocket = class extends WebSocket {
      constructor(...args) { super(...args); if (String(args[0]).includes('polymarket')) window.testSockets.push(this); }
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
  await waitFor("document.querySelectorAll('.game-option').length > 1")
  await waitFor(
    "document.querySelector('.connection-status')?.textContent === 'Live Feed for Selected Matchup'",
  )
  const initial = await evaluate(`({
    title: document.querySelector('.matchup h2').textContent,
    games: document.querySelectorAll('.game-option').length,
    rows: document.querySelectorAll('[data-asset-id]').length,
    quotedBids: [...document.querySelectorAll('.price-cell.bid')].filter(cell => !cell.querySelector('.missing-price')).length,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  })`)
  assert.ok(initial.rows > 0, 'The selected game displays outcome rows')
  assert.equal(initial.horizontalOverflow, false, 'Desktop layout fits')
  const initialSocketCount = socketIds.size
  assert.equal(initialSocketCount, 1, 'One market socket owns the dashboard')
  await screenshot('desktop')
  await evaluate("document.querySelectorAll('.game-option')[1].click()")
  await waitFor(
    `document.querySelector('.matchup h2')?.textContent !== ${JSON.stringify(initial.title)} && document.querySelector('.connection-status')?.textContent === 'Live Feed for Selected Matchup'`,
  )
  assert.equal(socketIds.size, initialSocketCount, 'Game switch keeps the same connection')
  assert.ok(
    sent.some((raw) => raw.includes('"unsubscribe"')),
    'Unsubscribe was sent',
  )
  assert.ok(
    sent.some((raw) => raw.includes('"operation":"subscribe"')),
    'Dynamic subscribe was sent',
  )
  await waitFor('window.testSockets[0].readyState === WebSocket.OPEN')
  // Wait for the real ten-second heartbeat before deliberately closing the socket.
  await evaluate('new Promise(resolve => setTimeout(resolve, 11_000))')
  assert.ok(sent.includes('PING'), 'Literal PING was sent')
  assert.ok(received.PONG > 0, 'PONG was received')
  await evaluate('window.testSockets[0].close()')
  await waitFor(
    "window.testSockets.length === 2 && document.querySelector('.connection-status')?.textContent === 'Live Feed for Selected Matchup'",
  )
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  })
  await evaluate(
    "const select = document.querySelector('#game-select'); select.value = select.options[0].value; select.dispatchEvent(new Event('change', { bubbles: true }))",
  )
  await waitFor(
    `document.querySelector('.matchup h2')?.textContent === ${JSON.stringify(initial.title)} && document.querySelector('.connection-status')?.textContent === 'Live Feed for Selected Matchup'`,
  )
  await screenshot('mobile')
  const mobile = await evaluate(`({
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    selectVisible: document.querySelector('#game-select').getBoundingClientRect().height > 0,
    columnsReachable: (() => {
      const region = document.querySelector('[role="region"][aria-label="Market prices, scroll to see all columns"]');
      region.scrollLeft = region.scrollWidth;
      return document.querySelector('th[scope="col"]:last-child').getBoundingClientRect().right <= region.getBoundingClientRect().right + 1;
    })(),
  })`)
  assert.equal(mobile.horizontalOverflow, false, 'Mobile page fits')
  assert.equal(mobile.selectVisible, true, 'Mobile game selector is available')
  assert.equal(
    mobile.columnsReachable,
    true,
    'Mobile price columns fit or can be scrolled into view',
  )
  assert.deepEqual(errors, [], 'No browser runtime errors')
  const report = {
    checkedAt: new Date().toISOString(),
    origin,
    initial,
    mobile,
    gammaOffsets,
    sockets: socketIds.size,
    received,
    sentFrames: sent.length,
    errors,
    output,
  }
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally {
  browser.close()
}
