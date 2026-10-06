import { memo, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { formatPrice, spread } from '../api/prices'
import { useMarketStore } from '../store/marketStore'

type Field = 'bid' | 'ask' | 'last' | 'spread'

export const PriceCell = memo(function PriceCell({
  assetId,
  field,
}: {
  assetId: string
  field: Field
}) {
  const [value, tick] = useMarketStore(
    useShallow((state) => {
      const quote = state.quotes[assetId]
      const price =
        field === 'spread'
          ? spread(quote?.bid ?? null, quote?.ask ?? null)
          : (quote?.[field] ?? null)
      return [price, quote?.tick ?? null]
    }),
  )
  const element = useRef<HTMLTableCellElement>(null)
  const previous = useRef<number | null>(null)
  useEffect(() => {
    const oldValue = previous.current
    previous.current = value
    if (oldValue === null || value === null || oldValue === value) return
    const color = value > oldValue ? 'rgba(36, 169, 104, 0.25)' : 'rgba(220, 75, 75, 0.23)'
    // A new animation restarts same-direction flashes. Cleanup cancels its predecessor.
    const animation = element.current?.animate(
      [{ backgroundColor: color }, { backgroundColor: 'transparent' }],
      { duration: 500, easing: 'ease-out' },
    )
    return () => animation?.cancel()
  }, [value])
  return (
    <td ref={element} className={`price-cell ${field}`} data-field={field}>
      <span className={value === null ? 'missing-price' : undefined}>
        {value === null ? (
          <span aria-label="Price unavailable">—</span>
        ) : (
          formatPrice(value, tick, field === 'last')
        )}
      </span>
    </td>
  )
})
