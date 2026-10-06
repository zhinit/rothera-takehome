import { Profiler } from 'react'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PriceCell } from './PriceCell'
import { useMarketStore } from '../store/marketStore'

beforeEach(() => {
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

  it('updates displayed precision and preserves historical trade precision', async () => {
    render(<Cells />)
    await act(() =>
      Promise.resolve(useMarketStore.getState().apply([{ assetId: 'a', tick: 0.001 }])),
    )
    expect(screen.getByText('0.400')).toBeInTheDocument()
    await act(() =>
      Promise.resolve(useMarketStore.getState().apply([{ assetId: 'a', last: 0.453 }])),
    )
    await act(() =>
      Promise.resolve(useMarketStore.getState().apply([{ assetId: 'a', tick: 0.01 }])),
    )
    expect(screen.getByText('0.40')).toBeInTheDocument()
    expect(screen.getByText('0.453')).toBeInTheDocument()
  })
})
