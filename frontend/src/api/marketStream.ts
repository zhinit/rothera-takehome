import { useMarketStore } from '../store/marketStore'
import { parseMessages } from './messages'

const STREAM_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market'

/** One owner per mounted dashboard. Selections change subscriptions, not sockets. */
export class MarketStream {
  private socket: WebSocket | null = null
  private assets: string[] = []
  private subscribed = false
  private disposed = false
  private failures = 0
  private lastPong = 0
  private heartbeat: ReturnType<typeof setInterval> | undefined
  private retry: ReturnType<typeof setTimeout> | undefined
  private connectTimeout: ReturnType<typeof setTimeout> | undefined

  setAssets(assets: string[]) {
    if (this.disposed) return
    const previous = this.assets
    this.assets = [...new Set(assets)]
    useMarketStore.getState().reset(this.assets)
    if (this.socket?.readyState === WebSocket.OPEN) {
      if (this.subscribed && previous.length) this.send({ operation: 'unsubscribe', assets_ids: previous })
      this.subscribe()
    } else if (!this.socket && !this.retry && this.assets.length) {
      this.connect()
    }
  }

  dispose() {
    this.disposed = true
    clearInterval(this.heartbeat)
    clearTimeout(this.retry)
    clearTimeout(this.connectTimeout)
    const socket = this.socket
    this.socket = null
    socket?.close()
    useMarketStore.getState().reset([])
    useMarketStore.getState().setStatus('idle')
  }

  private send(message: object) {
    this.socket?.send(JSON.stringify(message))
  }

  private subscribe() {
    if (!this.assets.length) return
    this.send(this.subscribed
      ? { operation: 'subscribe', assets_ids: this.assets, initial_dump: true }
      : { type: 'market', assets_ids: this.assets, initial_dump: true })
    this.subscribed = true
  }

  private scheduleReconnect() {
    if (this.disposed || !this.assets.length) return
    useMarketStore.getState().setStatus('reconnecting')
    const delay = Math.min(30_000, 1_000 * 2 ** Math.min(this.failures++, 5))
    this.retry = setTimeout(() => {
      this.retry = undefined
      this.connect()
    }, delay + Math.random() * 250)
  }

  private connect() {
    if (this.disposed || !this.assets.length) return
    useMarketStore.getState().setStatus(this.failures ? 'reconnecting' : 'connecting')
    let socket: WebSocket
    try { socket = new WebSocket(STREAM_URL) } catch { this.scheduleReconnect(); return }
    this.socket = socket
    this.subscribed = false
    const isCurrent = () => !this.disposed && this.socket === socket
    this.connectTimeout = setTimeout(() => { if (isCurrent()) socket.close() }, 15_000)
    socket.onopen = () => {
      if (!isCurrent()) return
      clearTimeout(this.connectTimeout)
      useMarketStore.getState().reset(this.assets)
      useMarketStore.getState().setStatus('connected')
      this.lastPong = Date.now()
      this.subscribe()
      this.heartbeat = setInterval(() => {
        if (!isCurrent() || socket.readyState !== WebSocket.OPEN) return
        if (Date.now() - this.lastPong > 30_000) { socket.close(); return }
        socket.send('PING')
      }, 10_000)
    }
    socket.onmessage = (event: MessageEvent<unknown>) => {
      if (!isCurrent() || typeof event.data !== 'string') return
      if (event.data === 'PONG') {
        this.lastPong = Date.now()
        this.failures = 0
        return
      }
      useMarketStore.getState().apply(parseMessages(event.data))
    }
    socket.onerror = () => { if (isCurrent()) socket.close() }
    socket.onclose = () => {
      if (!isCurrent()) return
      clearInterval(this.heartbeat)
      clearTimeout(this.connectTimeout)
      this.socket = null
      useMarketStore.getState().reset(this.assets)
      this.scheduleReconnect()
    }
  }
}
