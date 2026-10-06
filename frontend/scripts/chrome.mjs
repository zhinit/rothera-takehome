// Shared Chrome DevTools transport for controlled and live browser checks.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export async function launchChrome() {
  const output = await mkdtemp(join(tmpdir(), 'rothera-browser-'))
  const chrome = spawn(
    process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      `--user-data-dir=${join(output, 'profile')}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  )
  let connection
  const pending = new Map()
  const listeners = new Set()
  const errors = []
  let nextId = 0
  const close = () => {
    clearTimeout(deadline)
    connection?.close()
    chrome.kill()
  }
  const deadline = setTimeout(() => {
    for (const reject of pending.values()) reject(new Error('Browser check exceeded 120 seconds'))
    close()
    process.exitCode = 1
  }, 120_000)
  try {
    const debuggerUrl = await new Promise((resolve, reject) => {
      let logs = ''
      chrome.stderr.on('data', (data) => {
        logs += data.toString()
        const match = logs.match(/DevTools listening on (ws:\/\/\S+)/)
        if (match) resolve(match[1])
      })
      chrome.once('error', reject)
      chrome.once('exit', () =>
        reject(new Error('Chrome exited before debugging became available')),
      )
    })
    const debuggerOrigin = debuggerUrl.replace(/^ws:/, 'http:').split('/devtools/')[0]
    const targets = await (await fetch(`${debuggerOrigin}/json/list`)).json()
    const target = targets.find((item) => item.type === 'page')
    assert.ok(target, 'Chrome page exists')
    connection = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      connection.onopen = resolve
      connection.onerror = reject
    })
    const responses = new Map()
    connection.onmessage = ({ data }) => {
      const message = JSON.parse(data)
      if (message.id) {
        responses.get(message.id)?.(message)
        responses.delete(message.id)
        pending.delete(message.id)
        return
      }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
      for (const listener of listeners) listener(message)
    }
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++nextId
        pending.set(id, reject)
        responses.set(id, (message) =>
          message.error
            ? reject(new Error(JSON.stringify(message.error)))
            : resolve(message.result),
        )
        connection.send(JSON.stringify({ id, method, params }))
      })
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      })
      assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails))
      return result.result.value
    }
    const waitFor = (expression, timeout = 5_000) =>
      evaluate(`new Promise((resolve, reject) => {
      const started = Date.now(); const timer = setInterval(() => {
        if (${expression}) { clearInterval(timer); resolve(true) }
        else if (Date.now() - started > ${timeout}) { clearInterval(timer); reject(new Error(${JSON.stringify(`Timed out: ${expression}`)})) }
      }, 25)
    })`)
    const screenshot = async (name) => {
      const result = await send('Page.captureScreenshot', { format: 'png' })
      await writeFile(join(output, `${name}.png`), Buffer.from(result.data, 'base64'))
    }
    await send('Runtime.enable')
    await send('Network.enable')
    await send('Page.enable')
    return {
      output,
      errors,
      send,
      evaluate,
      waitFor,
      screenshot,
      close,
      onEvent: (listener) => listeners.add(listener),
    }
  } catch (error) {
    close()
    throw error
  }
}
