import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { GROUPS, type TestItem, type TestGroup } from './data/tests'
import TestCard from './components/TestCard'
import { loadResults, saveResults, clearResults, type ResultItem } from './utils/storage'
import { buildCsv } from './utils/csv'

type Scheme = 'ton' | 'tonkeeper' | 'https'

export default function App() {
  const [scheme, setScheme] = useState<Scheme>('ton')
  const [results, setResults] = useState<Record<string, ResultItem>>(() => loadResults())
  const [address, setAddress] = useState<string>(() => {
    const saved = localStorage.getItem('deeplinks-stand-address')
    return saved || 'UQCae11h9N5znylEPRjmuLYGvIwnxkcCw4zVW4BJjVASi5eL'
  })

  useEffect(() => {
    saveResults(results)
  }, [results])

  useEffect(() => {
    localStorage.setItem('deeplinks-stand-address', address)
  }, [address])

  function updateResult(testId: string, next: { status: 'ok' | 'not_ok' | null; note: string }) {
    setResults((prev) => ({ ...prev, [testId]: { testId, ...next } }))
  }

  function resetResults() {
    clearResults()
    setResults({})
  }

  const allTests = useMemo(() => GROUPS.flatMap((g) => g.items), [])
  const csv = useMemo(() => buildCsv(allTests, results, scheme), [results, scheme, allTests])

  function downloadCsv() {
    const now = new Date().toISOString().replace(/[:]/g, '-')
    const file = `deeplinks-results_${scheme}_${now}.csv`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', paddingBottom: 8, borderBottom: '1px solid #eee', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 18, flex: '1 1 auto' }}>Tonkeeper Deep Links Tester</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '2 1 600px' }}>
            <label>Recipient:</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ minWidth: 260, flex: '1 1 360px', padding: 6 }}
            />
            <label>Scheme:</label>
            <select value={scheme} onChange={(e) => setScheme(e.target.value as Scheme)}>
              <option value="ton">ton://</option>
              <option value="tonkeeper">tonkeeper://</option>
              <option value="https">https://app.tonkeeper.com/</option>
            </select>
            <button onClick={downloadCsv}>Export CSV</button>
            <button onClick={resetResults}>Reset</button>
          </div>
        </div>
      </div>

      {GROUPS.map((g: TestGroup) => (
        <div key={g.id} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{g.title}</div>
          {g.items.map((t: TestItem) => (
            <TestCard key={t.id} item={t} scheme={scheme} address={address} result={results[t.id]} onChange={updateResult} />
          ))}
        </div>
      ))}
    </div>
  )
}
