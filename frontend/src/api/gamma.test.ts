import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchGames, parseGame } from './gamma'

const market = (question: string, id = '1') => ({
  id,
  question,
  outcomes: '["Over","Under"]',
  clobTokenIds: '["123","456"]',
  version: 'v1',
})
const game = {
  id: '1',
  slug: 'nfl-kc-mia-2026-09-27',
  title: 'Chiefs vs. Dolphins',
  startTime: '2026-09-27T17:00:00Z',
  markets: [market('Chiefs vs. Dolphins')],
}

afterEach(() => vi.unstubAllGlobals())

describe('game discovery', () => {
  it('orders the displayed matchup by home/away metadata while matching original market questions', () => {
    const result = parseGame({
      ...game,
      teams: [
        { alias: 'Chiefs', ordering: 'home' },
        { alias: 'Dolphins', ordering: 'away' },
      ],
      markets: [...game.markets, market('Chiefs vs. Dolphins: O/U 43.5', '2')],
    })
    expect(result?.title).toBe('Dolphins at Chiefs')
    expect(result?.markets.map((item) => item.kind)).toEqual(['moneyline', 'total'])
  })

  it('uses full team names when aliases are unavailable', () => {
    expect(
      parseGame({
        ...game,
        teams: [
          { name: 'Kansas City Chiefs', alias: ' ', ordering: 'away' },
          { name: 'Miami Dolphins', ordering: 'home' },
        ],
      })?.title,
    ).toBe('Kansas City Chiefs at Miami Dolphins')
  })

  it.each([
    undefined,
    null,
    {},
    [],
    [null, 'invalid'],
    [{ alias: 'Chiefs', ordering: 'away' }],
    [
      { alias: 'Chiefs', ordering: null },
      { alias: 'Dolphins', ordering: null },
    ],
    [
      { alias: 123, ordering: 'away' },
      { alias: 'Dolphins', ordering: 'home' },
    ],
  ])('preserves the original title when team metadata is incomplete: %j', (teams) => {
    expect(parseGame({ ...game, teams })?.title).toBe(game.title)
  })

  it('keeps the moneyline and every exact full-game total, sorted numerically', () => {
    const result = parseGame({
      ...game,
      markets: [
        market('Chiefs vs. Dolphins: O/U 50.5', '2'),
        ...game.markets,
        market('Chiefs vs. Dolphins: O/U 9.5', '3'),
        market('Chiefs Team Total: O/U 20.5'),
        market('Chiefs vs. Dolphins: O/U 21.5 1H'),
        market('Chiefs vs. Dolphins: O/U 21.5 '),
        market('1H Chiefs vs. Dolphins: O/U 21.5'),
        market('Chiefs vs. Dolphins: Spread 3.5'),
      ],
    })
    expect(result?.markets.map((item) => item.line)).toEqual([null, 9.5, 50.5])
    expect(result?.markets[0]?.outcomes).toEqual([
      { assetId: '123', label: 'Over' },
      { assetId: '456', label: 'Under' },
    ])
  })

  it('rejects companion events, ended games, unusable markets, and broken mappings', () => {
    expect(parseGame({ ...game, slug: `${game.slug}-player-props` })).toBeNull()
    expect(parseGame({ ...game, ended: true })).toBeNull()
    expect(parseGame({ ...game, markets: [{ ...game.markets[0], closed: true }] })).toBeNull()
    for (const clobTokenIds of [
      'broken',
      '["123"]',
      '["123","123"]',
      '[123,456]',
      '["abc","456"]',
    ]) {
      expect(parseGame({ ...game, markets: [{ ...game.markets[0], clobTokenIds }] })).toBeNull()
    }
    expect(parseGame({ ...game, markets: [{ ...game.markets[0], version: 'v2' }] })).toBeNull()
  })

  it('walks full pages without matching games, deduplicates, and stops on a short page', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(Array.from({ length: 100 }, (_, id) => ({ id, slug: 'future' }))),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(Array.from({ length: 100 }, () => game))))
      .mockResolvedValueOnce(new Response(JSON.stringify([game, { ...game, id: '2', live: true }])))
    vi.stubGlobal('fetch', fetchMock)
    const games = await fetchGames(new AbortController().signal)
    expect(games.map((item) => item.id)).toEqual(['2', '1'])
    expect(
      fetchMock.mock.calls.map(([url]) =>
        new URL(url instanceof Request ? url.url : url).searchParams.get('offset'),
      ),
    ).toEqual(['0', '100', '200'])
  })

  it('reports HTTP and malformed response failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 503 })),
    )
    await expect(fetchGames(new AbortController().signal)).rejects.toThrow('503')
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('{}')))
    await expect(fetchGames(new AbortController().signal)).rejects.toThrow('unexpected response')
  })
  it('preserves outcome-to-token pairing when provider ordering is reversed', () => {
    const result = parseGame({
      ...game,
      markets: [
        {
          ...market('Chiefs vs. Dolphins: O/U 43.5'),
          outcomes: ['Under', 'Over'],
          clobTokenIds: ['456', '123'],
        },
      ],
    })
    expect(result?.markets[0]?.outcomes).toEqual([
      { assetId: '456', label: 'Under' },
      { assetId: '123', label: 'Over' },
    ])
  })

  it.each([
    { active: false },
    { enableOrderBook: false },
    { outcomes: '["", "Under"]' },
    { outcomes: '["Over"]' },
    { outcomes: '{}' },
    { clobTokenIds: null },
  ])('skips an unusable market without discarding valid markets: %j', (invalid) => {
    const result = parseGame({
      ...game,
      markets: [...game.markets, { ...market('Chiefs vs. Dolphins: O/U 43.5', '2'), ...invalid }],
    })
    expect(result?.markets.map((item) => item.id)).toEqual(['1'])
  })

  it('fails discovery if a later page fails instead of returning an incomplete slate', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(Array.from({ length: 100 }, () => game))))
      .mockResolvedValueOnce(new Response('', { status: 502 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchGames(new AbortController().signal)).rejects.toThrow('502')
  })

  it('propagates cancellation during pagination', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(Array.from({ length: 100 }, () => game))),
        )
        .mockImplementationOnce(
          (_url, options) =>
            new Promise((_resolve, reject) => {
              options?.signal?.addEventListener('abort', () =>
                reject(new DOMException('Aborted', 'AbortError')),
              )
              controller.abort()
            }),
        ),
    )
    await expect(fetchGames(controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  })
})
