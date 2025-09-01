import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GROUPS } from '../data/tests'

type Status = '' | 'ok' | 'partial' | 'not_ok'

type ParsedResults = {
  wallets: string[]
  rows: Array<{
    id: string
    title: string
    link: string
    expected: string
    note: string
    statuses: Record<string, Status>
  }>
}

function parseCsv(text: string): ParsedResults {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return { wallets: [], rows: [] }
  const header = splitCsvLine(lines[0])
  // Fixed columns
  const iId = header.indexOf('id')
  const iTitle = header.indexOf('title')
  const iLink = header.indexOf('link')
  const iExpected = header.indexOf('expected')
  const iNote = header.indexOf('note')
  // Wallet columns are all columns after 'note'
  const walletStart = iNote + 1
  const wallets = header.slice(walletStart)

  const rows: ParsedResults['rows'] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    const statuses: Record<string, Status> = {}
    for (let w = 0; w < wallets.length; w++) {
      const name = wallets[w]
      const val = (cols[walletStart + w] || '') as Status
      statuses[name] = val
    }
    rows.push({
      id: cols[iId] || '',
      title: cols[iTitle] || '',
      link: cols[iLink] || '',
      expected: cols[iExpected] || '',
      note: cols[iNote] || '',
      statuses,
    })
  }
  return { wallets, rows }
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === ',') {
        result.push(current)
        current = ''
      } else if (ch === '"') {
        inQuotes = true
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}

function StatusBadge({ status, title }: { status: Status; title?: string }) {
  let bg = '#eee', color = '#444', label = '—'
  if (status === 'ok') { bg = '#e6ffed'; color = '#067d28'; label = 'OK' }
  if (status === 'partial') { bg = '#fff7e6'; color = '#ad6800'; label = 'Partial' }
  if (status === 'not_ok') { bg = '#ffe6e6'; color = '#b00000'; label = 'Not OK' }
  return (
    <span title={title} style={{ background: bg, color, border: '1px solid #ddd', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>
      {label}
    </span>
  )
}

export default function ResultsPage() {
  const [wallets, setWallets] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedResults['rows']>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'results.csv')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.text()
      })
      .then((t) => {
        const parsed = parseCsv(t)
        setWallets(parsed.wallets)
        setRows(parsed.rows)
      })
      .catch((e) => setError('Failed to load results.csv: ' + e.message))
  }, [])

  const idToGroup = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>()
    for (const g of GROUPS) {
      for (const it of g.items) {
        map.set(it.id, { id: g.id, title: g.title })
      }
    }
    return map
  }, [])

  const orderedGroups = useMemo(() => GROUPS.filter((g) => g.id !== 'other').map((g) => ({ id: g.id, title: g.title })), [])

  const byGroup = useMemo(() => {
    const map = new Map<string, { id: string; title: string; items: ParsedResults['rows'] }>()
    for (const g of orderedGroups) {
      map.set(g.id, { id: g.id, title: g.title, items: [] })
    }
    for (const r of rows) {
      const g = idToGroup.get(r.id)
      if (!g || g.id === 'other') continue
      const bucket = map.get(g.id)
      if (bucket) bucket.items.push(r)
    }
    return Array.from(map.values())
  }, [rows, idToGroup, orderedGroups])

  function computeWalletGroupStatus(items: ParsedResults['rows'], wallet: string): Status {
    let hasOk = false
    let hasPartial = false
    let hasNotOk = false
    for (const it of items) {
      const s = it.statuses[wallet] || ''
      if (s === 'ok') hasOk = true
      else if (s === 'partial') hasPartial = true
      else hasNotOk = true // treat '' and 'not_ok' as not_ok for summary purposes
    }
    if (hasOk && !hasPartial && !hasNotOk) return 'ok'
    if (!hasOk && (hasPartial || hasNotOk)) return 'not_ok'
    return 'partial'
  }

  const groupSummaries = useMemo(() => {
    return byGroup.map(({ id, title, items }) => {
      const perWallet: Record<string, Status> = {}
      for (const w of wallets) {
        perWallet[w] = computeWalletGroupStatus(items, w)
      }
      return { id, title, perWallet }
    })
  }, [byGroup, wallets])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', padding: '8px 0', borderBottom: '1px solid #eee', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Compatibility Results</div>
          <Link to="/tests" style={{ color: '#0366d6' }}>Go to tests</Link>
        </div>
        <div style={{ marginTop: 6, color: '#666', fontSize: 12 }}>
          Hover over yellow badges (Partial) or info icons to see details
        </div>
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>}

      {/* Group-level summary table */}
      <div style={{ marginBottom: 20, width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '2px solid #ddd', width: '24%' }}>Group</th>
              {wallets.map((w) => (
                <th key={w} style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '2px solid #ddd', whiteSpace: 'nowrap' }}>{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupSummaries.map(({ id, title, perWallet }) => (
              <tr key={id}>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #f2f2f2', fontWeight: 600 }}>{title}</td>
                {wallets.map((w) => (
                  <td key={w} style={{ padding: '8px 6px', borderBottom: '1px solid #f2f2f2', textAlign: 'center' }}>
                    <StatusBadge status={perWallet[w]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {byGroup.map((g) => (
        <div key={g.id} style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{g.title}</div>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee', width: '30%' }}>Test</th>
                  {wallets.map((w) => (
                    <th key={w} style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.items.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #f2f2f2', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontWeight: 600 }}>{r.title}</div>
                        {r.note && (
                          <span title={r.note} style={{ color: '#666', fontSize: 12, border: '1px solid #ddd', borderRadius: 10, padding: '0 6px', cursor: 'help' }}>i</span>
                        )}
                      </div>
                    </td>
                    {wallets.map((w) => (
                      <td key={w} style={{ padding: '8px 6px', borderBottom: '1px solid #f2f2f2', textAlign: 'center' }}>
                        <StatusBadge status={r.statuses[w]} title={r.statuses[w] === 'partial' ? (r.note || 'Partially supported') : undefined} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

