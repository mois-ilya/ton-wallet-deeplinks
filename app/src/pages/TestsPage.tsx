import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'
import { GROUPS, type TestItem, type TestGroup } from '../data/tests'
import TestCard from '../components/TestCard'
import { loadResults, saveResults, clearResults, type ResultItem } from '../utils/storage'
import { buildCsv } from '../utils/csv'

type Scheme = 'ton' | 'tonkeeper' | 'https'

export default function TestsPage() {
  const [scheme, setScheme] = useState<Scheme>('ton')
  const [results, setResults] = useState<Record<string, ResultItem>>(() => loadResults())
  const [address, setAddress] = useState<string>(() => {
    const saved = localStorage.getItem('deeplinks-stand-address')
    return saved || 'UQCae11h9N5znylEPRjmuLYGvIwnxkcCw4zVW4BJjVASi5eL'
  })
  const [bin, setBin] = useState<string>(() => {
    return 'te6cckEBAQEACQAADgAAAABiaW793PSE'
  })
  const [dns, setDns] = useState<string>('subbotin.ton')
  const [initData, setInitData] = useState<string>(() => {
    return 'te6ccgEBAgEACwACATQBAQAI_____w%3D%3D'
  })
  
  // exp offset (seconds into the future)
  const [expOffsetSec, setExpOffsetSec] = useState<number>(() => {
    const saved = localStorage.getItem('deeplinks-stand-expOffsetSec')
    return saved ? Math.max(1, parseInt(saved, 10) || 30) : 30
  })

  // Dynamic exp parameter: 30 seconds in future, updates every 10 seconds
  const [expValue, setExpValue] = useState<number>(() => Math.floor(Date.now() / 1000) + (localStorage.getItem('deeplinks-stand-expOffsetSec') ? Math.max(1, parseInt(localStorage.getItem('deeplinks-stand-expOffsetSec') as string, 10) || 30) : 30))
  const [countdown, setCountdown] = useState<number>(10)

  useEffect(() => {
    saveResults(results)
  }, [results])

  useEffect(() => {
    localStorage.setItem('deeplinks-stand-address', address)
  }, [address])

  useEffect(() => {
    localStorage.setItem('deeplinks-stand-expOffsetSec', String(expOffsetSec))
    // Recompute exp immediately when offset changes and reset countdown
    setExpValue(Math.floor(Date.now() / 1000) + expOffsetSec)
    setCountdown(10)
  }, [expOffsetSec])

  // Timer for exp updates and countdown
  useEffect(() => {
    document.title = 'TON Wallets Deep Links Tester – Tests'
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Reset countdown and update exp
          setExpValue(Math.floor(Date.now() / 1000) + expOffsetSec)
          return 10
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [expOffsetSec])

  function updateResult(testId: string, next: { status: 'ok' | 'partial' | 'not_ok' | null; note: string }) {
    setResults((prev) => ({ ...prev, [testId]: { testId, ...next } }))
  }

  function resetResults() {
    clearResults()
    setResults({})
  }

  const allTests = useMemo(() => GROUPS.flatMap((g) => g.items), [])
  const csv = useMemo(() => buildCsv(allTests, results, scheme, expValue, address, bin, dns, initData), [results, scheme, expValue, address, bin, dns, initData, allTests])

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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.2 }}>TON Wallets Deep Links Tester</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 14, color: '#666' }}>
              exp updates in: {countdown}s
            </div>
            <button onClick={downloadCsv}>Export CSV</button>
            <button onClick={resetResults}>Reset</button>
            <Link to="/" style={{ color: '#0366d6', textDecoration: 'underline' }}>Results</Link>
          </div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap', flex: '2 1 480px' }}>
            <label>Recipient:</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ minWidth: 260, flex: '1 1 360px', padding: 6 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
            <label>Scheme:</label>
            <select value={scheme} onChange={(e) => setScheme(e.target.value as Scheme)}>
              <option value="ton">ton://</option>
              <option value="tonkeeper">tonkeeper://</option>
              <option value="https">https://app.tonkeeper.com/</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
            <label>exp offset (s):</label>
            <input
              type="number"
              min={1}
              value={expOffsetSec}
              onChange={(e) => setExpOffsetSec(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: 110, padding: 6 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap', flex: '2 1 480px' }}>
            <label>bin:</label>
            <input value={bin} onChange={(e) => setBin(e.target.value)} style={{ minWidth: 260, flex: '1 1 360px', padding: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
            <label>dns:</label>
            <input value={dns} onChange={(e) => setDns(e.target.value)} style={{ minWidth: 180, padding: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap', flex: '2 1 480px' }}>
            <label>initData:</label>
            <input value={initData} onChange={(e) => setInitData(e.target.value)} style={{ minWidth: 260, flex: '1 1 360px', padding: 6 }} />
          </div>
        </div>
      </div>

      {GROUPS.map((g: TestGroup) => (
        <div key={g.id} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{g.title}</div>
          {g.items.map((t: TestItem) => (
            <TestCard key={t.id} item={t} scheme={scheme} address={address} bin={bin} dns={dns} initData={initData} expValue={expValue} result={results[t.id]} onChange={updateResult} />
          ))}
        </div>
      ))}
    </div>
  )
}

