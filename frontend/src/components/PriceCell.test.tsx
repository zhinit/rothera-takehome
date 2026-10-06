import { Profiler } from 'react'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PriceCell } from './PriceCell'
import { useMarketStore } from '../store/marketStore'

const cancellations: ReturnType<typeof vi.fn>[] = []
const animate = vi.fn(() => {
  const cancel = vi.fn()
  cancellations.push(cancel)
  return { cancel }
})
beforeEach(() => {
  animate.mockClear()
  cancellations.length = 0
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate })
  useMarketStore.getState().reset(['a', 'b'])
  useMarketStore.getState().apply([
    { assetId: 'a', snapshot: true, bid: 0.4, ask: 0.5, last: 0.45, tick: 0.01 },
    { assetId: 'b', snapshot: true, bid: 0.6, ask: 0.7, tick: 0.01 },
  ])
})

function Cells() {
  return (
    <table>
      <tbody>
        <tr>
          <PriceCell assetId="a" field="bid" />
          <PriceCell assetId="a" field="last" />
        </tr>
      </tbody>
    </table>
  )
}

describe('price cells', () => {
  it('only commits affected cells while the parent and unrelated token stay unchanged', async () => {
    const bid = vi.fn(),
      ask = vi.fn(),
      other = vi.fn(),
      parent = vi.fn()
    function Table() {
      parent()
      return (
        <table>
          <tbody>
            <tr>
              <Profiler id="bid" onRender={bid}>
                <PriceCell assetId="a" field="bid" />
              </Profiler>
              <Profiler id="ask" onRender={ask}>
                <PriceCell assetId="a" field="ask" />
              </Profiler>
              <Profiler id="other" onRender={other}>
                <PriceCell assetId="b" field="bid" />
              </Profiler>
            </tr>
          </tbody>
        </table>
      )
    }
    render(<Table />)
    bid.mockClear()
    ask.mockClear()
    other.mockClear()
    parent.mockClear()
    await act(() => Promise.resolve(useMarketStore.getState().apply([{ assetId: 'a', bid: 0.41 }])))
    expect(screen.getByText('0.41')).toBeInTheDocument()
    expect(bid).toHaveBeenCalledTimes(1)
    expect(ask).not.toHaveBeenCalled()
    expect(other).not.toHaveBeenCalled()
    expect(parent).not.toHaveBeenCalled()
  })

  it('restarts repeated same-direction flashes, reverses color, and cancels on unmount', async () => {
    const view = render(<Cells />)
    expect(animate).not.toHaveBeenCalled()
    await act(() => Promise.resolve(useMarketStore.getState().apply([{ assetId: 'a', bid: 0.41 }])))
    const first = cancellations[0]
    await act(() => Promise.resolve(useMarketStore.getState().apply([{ assetId: 'a', bid: 0.42 }])))
    expect(first).toHaveBeenCalledTimes(1)
    expect(animate).toHaveBeenCalledTimes(2)
    expect(animate).toHaveBeenLastCalledWith(
      [{ backgroundColor: 'rgba(36, 169, 104, 0.25)' }, { backgroundColor: 'transparent' }],
      { duration: 500, easing: 'ease-out' },
    )
    await act(() => Promise.resolve(useMarketStore.getState().apply([{ assetId: 'a', bid: 0.4 }])))
    expect(animate).toHaveBeenLastCalledWith(
      [{ backgroundColor: 'rgba(220, 75, 75, 0.23)' }, { backgroundColor: 'transparent' }],
      { duration: 500, easing: 'ease-out' },
    )
    const last = cancellations.at(-1)
    view.unmount()
    expect(last).toHaveBeenCalledTimes(1)
  })

  it('updates precision without flashing, preserves historical trades, and avoids a flash on new snapshots', async () => {
    render(<Cells />)
    await act(() =>
      Promise.resolve(useMarketStore.getState().apply([{ assetId: 'a', tick: 0.001 }])),
    )
    expect(screen.getByText('0.400')).toBeInTheDocument()
    expect(animate).not.toHaveBeenCalled()
    await act(() =>
      Promise.resolve(useMarketStore.getState().apply([{ assetId: 'a', last: 0.453 }])),
    )
    await act(() =>
      Promise.resolve(useMarketStore.getState().apply([{ assetId: 'a', tick: 0.01 }])),
    )
    expect(screen.getByText('0.453')).toBeInTheDocument()
    await act(() => Promise.resolve(useMarketStore.getState().reset(['a'])))
    animate.mockClear()
    await act(() =>
      Promise.resolve(
        useMarketStore.getState().apply([{ assetId: 'a', snapshot: true, bid: 0.2 }]),
      ),
    )
    expect(animate).not.toHaveBeenCalled()
  })
})
