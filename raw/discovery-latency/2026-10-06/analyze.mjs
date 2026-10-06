import { readFile, writeFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import ts from '../../../frontend/node_modules/typescript/lib/typescript.js'

const directory = dirname(fileURLToPath(import.meta.url))
const read = name => readFile(join(directory, name), 'utf8')
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
}).outputText
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
const typesUrl = moduleUrl(compile(await read('types-source.ts')))
const gammaSource = (await read('gamma-source.ts')).replace("from '../types'", `from '${typesUrl}'`)
const { parseGame } = await import(moduleUrl(compile(gammaSource)))
const scenarios = []
for (const file of (await readdir(directory)).filter(name => name.endsWith('-result.json') && name !== 'analysis-result.json').sort()) {
  const run = JSON.parse(await read(file))
  if (!run.scenario) continue
  const events = []
  let bytes = 0
  const parsedPages = []
  for (const page of run.pages.filter(page => !page.error && page.offset <= run.terminal)) {
    const text = await read(`${run.scenario.name}-offset-${page.offset}.json`)
    bytes += Buffer.byteLength(text)
    const data = JSON.parse(text)
    const games = data.map(parseGame).filter(Boolean)
    parsedPages.push({ offset: page.offset, count: data.length, games: games.length,
      bodyMs: page.bodyMs, parseMs: page.parseMs, elapsedMs: page.elapsedMs })
    events.push(...data)
  }
  const games = [...new Map(events.map(parseGame).filter(Boolean).map(game => [game.id, game])).values()]
  const mappings = games.flatMap(game => game.markets.map(market =>
    JSON.stringify([game.id, market.id, market.question, market.outcomes.map(o => [o.label, o.assetId])]))).sort()
  scenarios.push({ name: run.scenario.name, params: run.scenario.params, terminal: run.terminal,
    totalMs: run.totalMs, firstGameMs: run.firstGameMs, firstUsableGameMs: Math.min(...parsedPages.filter(p => p.games).map(p => p.elapsedMs)),
    pages: parsedPages, requests: run.pages.length, failures: run.pages.filter(p => p.error),
    events: events.length, uniqueEventIds: new Set(events.map(e => e.id)).size, bytes,
    gameIds: games.map(g => g.id).sort(), games: games.length,
    markets: games.reduce((n,g) => n + g.markets.length, 0), mappings,
    totalLines: games.reduce((n,g) => n + g.markets.filter(m => m.kind === 'total').length, 0),
    tokens: games.flatMap(g => g.markets.flatMap(m => m.outcomes.map(o => o.assetId))).sort(),
    mappingHash: createHash('sha256').update(JSON.stringify(mappings)).digest('hex') })
  if (run.scenario.name === 'baseline-serial') {
    await writeFile(join(directory, 'normalized-games.json'), JSON.stringify(games), { flag: 'wx' })
    const metadata = JSON.stringify({ version: 1, savedAt: run.timestamp, complete: true, games })
    await writeFile(join(directory, 'metadata-cache-fixture.json'), metadata, { flag: 'wx' })
  }
}
const baseline = scenarios.find(run => run.name === 'baseline-serial')
for (const run of scenarios) {
  run.missingGames = baseline.gameIds.filter(id => !run.gameIds.includes(id))
  run.extraGames = run.gameIds.filter(id => !baseline.gameIds.includes(id))
  run.missingMappings = baseline.mappings.filter(mapping => !run.mappings.includes(mapping))
  run.extraMappings = run.mappings.filter(mapping => !baseline.mappings.includes(mapping))
  run.sameCoverage = run.missingGames.length === 0 && run.extraGames.length === 0 && run.missingMappings.length === 0 && run.extraMappings.length === 0
}
const baselineEvents = []
for (const page of baseline.pages) baselineEvents.push(...JSON.parse(await read(`baseline-serial-offset-${page.offset}.json`)))
const gameDates = baselineEvents.filter(e => baseline.gameIds.includes(e.id)).map(e => ({id:e.id,slug:e.slug,startDate:e.startDate,startTime:e.startTime,endDate:e.endDate,tags:e.tags.map(t=>({id:t.id,slug:t.slug}))}))
const report = {scenarios, gameDates, normalizedBytes: Buffer.byteLength(await read('normalized-games.json')),
  cacheFixtureBytes: Buffer.byteLength(await read('metadata-cache-fixture.json'))}
await writeFile(join(directory, 'analysis-result.json'), JSON.stringify(report, null, 2), { flag: 'wx' })
console.log(JSON.stringify({ normalizedBytes: report.normalizedBytes, cacheFixtureBytes: report.cacheFixtureBytes,
  scenarios: scenarios.map(({mappings,tokens,gameIds,pages,...summary}) => ({...summary, missingMappings:summary.missingMappings.length, extraMappings:summary.extraMappings.length})) }, null, 2))
