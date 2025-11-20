import { useEffect, useMemo, useState } from 'react'
import { GROUPS, type TestItem, type TestGroup } from '../data/tests'
import TestCard from '../components/TestCard'
import { loadResults, saveResults, clearResults, type ResultItem } from '../utils/storage'
import { buildJsonExport, downloadJson } from '../utils/json-export'
import { isValidBoc, isValidStateInit, isLikelyValidAddress } from '../utils/ton'
import { Accordion } from '../components/ui/accordion'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'

type Scheme = 'ton' | 'tonkeeper' | 'https'

export default function TestsPage() {
  const [scheme, setScheme] = useState<Scheme>('ton')
  const [results, setResults] = useState<Record<string, ResultItem>>(() => loadResults())
  const [configExpanded, setConfigExpanded] = useState(false)
  const [address, setAddress] = useState<string>(() => {
    const saved = localStorage.getItem('deeplinks-stand-address')
    return saved || 'UQCae11h9N5znylEPRjmuLYGvIwnxkcCw4zVW4BJjVASi5eL'
  })
  const [bin, setBin] = useState<string>('te6cckEBAQEACQAADgAAAABiaW793PSE')
  const [dns, setDns] = useState<string>('subbotin.ton')
  const [init, setInit] = useState<string>('te6ccgEBAwEAEQACATQBAgAI_____wAIAAAAAA')

  const isInitValid = useMemo(() => isValidStateInit(init), [init])
  const isBinValid = useMemo(() => isValidBoc(bin), [bin])
  const isAddressValid = useMemo(() => isLikelyValidAddress(address), [address])

  useEffect(() => { saveResults(results) }, [results])
  useEffect(() => { localStorage.setItem('deeplinks-stand-address', address) }, [address])
  useEffect(() => { document.title = 'TON Wallets Deep Links Tester' }, [])

  function updateResult(testId: string, next: { status: 'ok' | 'partial' | 'not_ok' | null; note: string }) {
    setResults((prev) => ({ ...prev, [testId]: { testId, ...next } }))
  }

  function resetResults() {
    clearResults()
    setResults({})
  }

  const allTests = useMemo(() => GROUPS.flatMap((g) => g.items), [])

  function exportJson() {
    const data = buildJsonExport(allTests, results, scheme, address)
    downloadJson(data, scheme)
  }

  const testedCount = Object.values(results).filter(r => r.status !== null).length;
  const totalCount = allTests.length;
  const okCount = Object.values(results).filter(r => r.status === 'ok').length;
  const partialCount = Object.values(results).filter(r => r.status === 'partial').length;
  const notOkCount = Object.values(results).filter(r => r.status === 'not_ok').length;

  return (
    <div className="min-h-screen bg-white">
      {/* Config Header */}
      <div className="sticky top-14 z-40 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-2">
          {/* Config controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfigExpanded(!configExpanded)}
                className="text-gray-500 hover:text-gray-700 text-xs"
              >
                {configExpanded ? '▼' : '▶'} Config
              </button>
              <div className="text-xs text-gray-600">
                {testedCount} / {totalCount} tested
              </div>
              {testedCount > 0 && (
                <div className="flex items-center gap-1">
                  {okCount > 0 && <Badge variant="outline" className="border-green-500 text-green-700">✅{okCount}</Badge>}
                  {partialCount > 0 && <Badge variant="outline" className="border-yellow-500 text-yellow-700">⚠️{partialCount}</Badge>}
                  {notOkCount > 0 && <Badge variant="outline" className="border-red-500 text-red-700">❌{notOkCount}</Badge>}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Button onClick={exportJson} size="sm" disabled={testedCount === 0}>Export</Button>
              <Button onClick={resetResults} size="sm" variant="outline">Reset</Button>
            </div>
          </div>

          {/* Expanded config */}
          {configExpanded && (
            <div className="border-t mt-2 pt-2">
              <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <label className="font-medium w-12">Scheme:</label>
                  <ToggleGroup
                    type="single"
                    value={scheme}
                    onValueChange={(value) => value && setScheme(value as Scheme)}
                    variant="outline"
                    size="sm"
                  >
                    <ToggleGroupItem value="ton" className="text-[10px] px-2 h-6">
                      ton
                    </ToggleGroupItem>
                    <ToggleGroupItem value="tonkeeper" className="text-[10px] px-2 h-6">
                      tonkeeper
                    </ToggleGroupItem>
                    <ToggleGroupItem value="https" className="text-[10px] px-2 h-6">
                      https
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="flex items-center gap-1">
                  <label className="font-medium w-12">Address:</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`flex-1 font-mono text-[10px] h-6 ${!isAddressValid ? 'border-red-500' : ''}`}
                  />
                </div>

                <div className="flex items-center gap-1">
                  <label className="font-medium w-10">bin:</label>
                  <Input value={bin} onChange={(e) => setBin(e.target.value)} className={`flex-1 font-mono text-[10px] h-6 ${!isBinValid ? 'border-red-500' : ''}`} />
                </div>

                <div className="flex items-center gap-1">
                  <label className="font-medium w-10">dns:</label>
                  <Input value={dns} onChange={(e) => setDns(e.target.value)} className="flex-1 text-[10px] h-6" />
                </div>

                <div className="flex items-center gap-1 md:col-span-2">
                  <label className="font-medium w-10">init:</label>
                  <Input value={init} onChange={(e) => setInit(e.target.value)} className={`flex-1 font-mono text-[10px] h-6 ${!isInitValid ? 'border-red-500' : ''}`} />
                </div>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tests - Single Column of Groups */}
      <div className="max-w-6xl mx-auto px-4 py-2 space-y-3">
        {GROUPS.map((g: TestGroup) => (
          <div key={g.id} className="space-y-1">
            <h2 className="text-sm font-bold flex items-center gap-1">
              📑 {g.title} <Badge variant="outline" className="text-[10px]">{g.items.length}</Badge>
            </h2>
            <Accordion type="multiple" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 auto-rows-min">
              {g.items.map((t: TestItem) => (
                <TestCard
                  key={t.id}
                  item={t}
                  scheme={scheme}
                  address={address}
                  bin={bin}
                  dns={dns}
                  init={init}
                  initValid={isInitValid}
                  binValid={isBinValid}
                  result={results[t.id]}
                  onChange={updateResult}
                />
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  )
}
