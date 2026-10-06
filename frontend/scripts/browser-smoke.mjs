// Live browser verification, with no proxy or browser automation dependencies.
// Start `npm run dev`, then run `npm run test:browser` with Chrome installed.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const origin = process.env.DEMO_URL ?? 'http://127.0.0.1:5173'
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const output = await mkdtemp(join(tmpdir(), 'rothera-demo-'))
const chrome = spawn(chromePath, [
  '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${join(output, 'profile')}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] })
let connection
const deadline = setTimeout(() => { chrome.kill(); process.exitCode = 1 }, 120_000)

try {
  const debuggerUrl = await new Promise((resolve, reject) => {
    let logs = ''
    chrome.stderr.on('data', (data) => {
      logs += data.toString()
      const match = logs.match(/DevTools listening on (ws:\/\/\S+)/)
      if (match) resolve(match[1])
    })
    chrome.once('error', reject)
    chrome.once('exit', () => reject(new Error('Chrome exited before debugging became available')))
  })
  const debuggerOrigin = debuggerUrl.replace(/^ws:/, 'http:').split('/devtools/')[0]
  const targets = await (await fetch(`${debuggerOrigin}/json/list`)).json()
  const target = targets.find((item) => item.type === 'page')
  assert.ok(target, 'Chrome page exists')
  connection = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { connection.onopen = resolve; connection.onerror = reject })
  let nextId = 0
  const pending = new Map()
  const errors = []
  const socketIds = new Set()
  const sent = []
  const received = { book: 0, price_change: 0, last_trade_price: 0, tick_size_change: 0, PONG: 0 }
  const gammaOffsets = []
  connection.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) {
      pending.get(message.id)?.(message)
      pending.delete(message.id)
      return
    }
    const { method, params } = message
    if (method === 'Runtime.exceptionThrown') errors.push(params.exceptionDetails)
    if (method === 'Network.requestWillBeSent' && params.request.url.startsWith('https://gamma-api.polymarket.com/events?')) {
      gammaOffsets.push(new URL(params.request.url).searchParams.get('offset'))
    }
    if (method === 'Network.webSocketCreated' && params.url.includes('polymarket')) socketIds.add(params.requestId)
    if (!socketIds.has(params?.requestId)) return
    if (method === 'Network.webSocketFrameSent') sent.push(params.response.payloadData)
    if (method === 'Network.webSocketFrameReceived') {
      const raw = params.response.payloadData
      if (raw === 'PONG') { received.PONG++; return }
      try {
        const parsed = JSON.parse(raw)
        for (const event of Array.isArray(parsed) ? parsed : [parsed]) {
          if (Object.hasOwn(received, event.event_type)) received[event.event_type]++
        }
      } catch { /* Heartbeats and unknown non-JSON frames are not market events. */ }
    }
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, (message) => message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result))
    connection.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    assert.equal(result.exceptionDetails, undefined, 'Browser expression succeeds')
    return result.result.value
  }
  const waitFor = (expression, timeout = 45_000) => evaluate(`new Promise((resolve, reject) => {
    const started = Date.now(); const timer = setInterval(() => {
      if (${expression}) { clearInterval(timer); resolve(true) }
      else if (Date.now() - started > ${timeout}) { clearInterval(timer); reject(new Error('Timed out waiting for browser state')) }
    }, 100)
  })`)
  const screenshot = async (name) => {
    const result = await send('Page.captureScreenshot', { format: 'png' })
    await writeFile(join(output, `${name}.png`), Buffer.from(result.data, 'base64'))
  }
  await send('Runtime.enable')
  await send('Network.enable')
  await send('Page.enable')
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.testSockets = [];
    window.WebSocket = class extends WebSocket {
      constructor(...args) { super(...args); if (String(args[0]).includes('polymarket')) window.testSockets.push(this); }
    };
  ` })
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: origin })
  await waitFor("document.querySelectorAll('.game-option').length > 1")
  await waitFor("document.querySelector('.connection-status')?.textContent === 'Live feed'")
  const initial = await evaluate(`({
    title: document.querySelector('.matchup h2').textContent,
    games: document.querySelectorAll('.game-option').length,
    rows: document.querySelectorAll('[data-asset-id]').length,
    quotedBids: [...document.querySelectorAll('.price-cell.bid')].filter(cell => !cell.querySelector('.missing-price')).length,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    styled: getComputedStyle(document.querySelector('.workspace')).display === 'grid',
  })`)
  assert.equal(initial.quotedBids, initial.rows, 'Every initial outcome receives a bid')
  assert.equal(initial.horizontalOverflow, false, 'Desktop layout fits')
  assert.equal(initial.styled, true, 'Dashboard stylesheet is applied')
  const initialSocketCount = socketIds.size
  assert.equal(initialSocketCount, 1, 'One market socket owns the dashboard')
  await screenshot('desktop')
  await evaluate("document.querySelectorAll('.game-option')[1].click()")
  await waitFor(`document.querySelector('.matchup h2')?.textContent !== ${JSON.stringify(initial.title)} && document.querySelector('.connection-status')?.textContent === 'Live feed'`)
  assert.equal(socketIds.size, initialSocketCount, 'Game switch keeps the same connection')
  assert.ok(sent.some((raw) => raw.includes('"unsubscribe"')), 'Unsubscribe was sent')
  assert.ok(sent.some((raw) => raw.includes('"operation":"subscribe"')), 'Dynamic subscribe was sent')
  await waitFor("window.testSockets[0].readyState === WebSocket.OPEN")
  // Wait for the real ten-second heartbeat before deliberately closing the socket.
  await evaluate('new Promise(resolve => setTimeout(resolve, 11_000))')
  assert.ok(sent.includes('PING'), 'Literal PING was sent')
  assert.ok(received.PONG > 0, 'PONG was received')
  await evaluate('window.testSockets[0].close()')
  await waitFor("window.testSockets.length === 2 && document.querySelector('.connection-status')?.textContent === 'Live feed'")
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await evaluate("const select = document.querySelector('#game-select'); select.value = select.options[0].value; select.dispatchEvent(new Event('change', { bubbles: true }))")
  await waitFor(`document.querySelector('.matchup h2')?.textContent === ${JSON.stringify(initial.title)} && document.querySelector('.connection-status')?.textContent === 'Live feed'`)
  await screenshot('mobile')
  const mobile = await evaluate(`({
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    selectVisible: document.querySelector('#game-select').getBoundingClientRect().height > 0,
    tableScrollable: document.querySelector('.table-scroll').scrollWidth > document.querySelector('.table-scroll').clientWidth,
  })`)
  assert.equal(mobile.horizontalOverflow, false, 'Mobile page fits')
  assert.equal(mobile.selectVisible, true, 'Mobile game selector is available')
  assert.equal(mobile.tableScrollable, true, 'Mobile price columns can be scrolled')
  assert.deepEqual(errors, [], 'No browser runtime errors')
  const report = { checkedAt: new Date().toISOString(), origin, initial, mobile, gammaOffsets,
    sockets: socketIds.size, received, sentFrames: sent.length, errors, output }
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally {
  clearTimeout(deadline)
  connection?.close()
  chrome.kill()
}
