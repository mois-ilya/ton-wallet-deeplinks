import { useEffect, useMemo, useState } from 'react'
import { GROUPS } from '../data/tests'

type Status = '' | 'ok' | 'partial' | 'not_ok' | 'unknown'

type WalletTestResult = {
  exportDate: string
  scheme: string
  wallet: string
  testResults: Array<{
    testId: string
    title: string
    status: 'ok' | 'partial' | 'not_ok' | null
    note: string
    testedAt: string
  }>
}

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

function StatusBadge({ status, title }: { status: Status; title?: string }) {
  let className = 'bg-gray-200 text-gray-600', label = '—'
  if (status === 'ok') { className = 'bg-green-50 text-green-700'; label = 'OK' }
  if (status === 'partial') { className = 'bg-yellow-50 text-yellow-700'; label = 'Partial' }
  if (status === 'not_ok') { className = 'bg-red-50 text-red-700'; label = 'Not OK' }
  return (
    <span aria-label={label} title={title} className={`inline-block border border-gray-300 rounded-xl px-2 py-0.5 text-xs ${className}`}>
      {label}
    </span>
  )
}

export default function ResultsPage() {
  const [wallets, setWallets] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedResults['rows']>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'TON Wallets Deep Links Tester – Results'

    // Load all wallet JSON files
    const walletFiles = ['Tonkeeper_JS.json', 'Tonkeeper_IOS.json', '_Wallet.json', 'MyTonWallet.json']
    const baseUrl = import.meta.env.BASE_URL + 'test-results/'

    Promise.all(
      walletFiles.map(file =>
        fetch(baseUrl + file).then(r => {
          if (!r.ok) throw new Error(`Failed to load ${file}: ${r.status}`)
          return r.json() as Promise<WalletTestResult>
        })
      )
    )
      .then((walletResults) => {
        // Extract wallet names
        const walletNames = walletResults.map(w => w.wallet)
        setWallets(walletNames)

        // Build rows from GROUPS as the source of truth
        const allItems: Array<{ id: string; title: string }> = []
        for (const g of GROUPS) {
          for (const it of g.items) {
            allItems.push({ id: it.id, title: it.title })
          }
        }

        const normalizedRows: ParsedResults['rows'] = allItems.map((it) => {
          const statuses: Record<string, Status> = {}

          for (const walletResult of walletResults) {
            const test = walletResult.testResults.find(t => t.testId === it.id)
            const status = test?.status ?? null
            const normalized: Status = status === 'ok' || status === 'partial' || status === 'not_ok' ? status : 'unknown'
            statuses[walletResult.wallet] = normalized
          }

          return {
            id: it.id,
            title: it.title,
            link: '',
            expected: '',
            note: '',
            statuses,
          }
        })

        setRows(normalizedRows)
      })
      .catch((e) => setError('Failed to load test results: ' + e.message))
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
    <main className="max-w-6xl mx-auto px-4 py-4">
      <header className="sticky top-14 z-10 bg-white py-2 border-b border-border mb-4">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-2xl font-bold">Compatibility Results</h1>
        </div>
        <p className="mt-1.5 text-muted-foreground text-xs">Hover over yellow badges (Partial) or info icons to see details</p>
      </header>

      {error && <div className="text-destructive mb-3">{error}</div>}

      {/* Feature summary */}
      <section aria-labelledby="feature-summary-heading">
        <h2 id="feature-summary-heading" className="m-0 mb-2 text-xl font-semibold">Feature support summary</h2>
        <p className="m-0 mb-3 text-muted-foreground">
          Rule: per wallet, a feature is <strong>OK</strong> if all its tests are OK;
          <strong> Not OK</strong> if there are no OK results and at least one Partial/Not OK/missing;
          otherwise <strong>Partial</strong>.
        </p>
        <div role="region" aria-label="Feature summary table" className="mb-6 w-full overflow-x-auto border border-border rounded-lg">
          <table role="table" className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className="text-left p-2 border-b border-border w-1/4">Feature</th>
                {wallets.map((w) => (
                  <th scope="col" key={w} className="text-center p-2 border-b border-border whitespace-nowrap">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupSummaries.map(({ id, title, perWallet }) => (
                <tr key={id}>
                  <th scope="row" className="p-2 border-b border-gray-100 font-semibold text-left">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(`group-${id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="text-primary hover:underline"
                    >
                      {title}
                    </a>
                  </th>
                  {wallets.map((w) => (
                    <td key={w} className="p-2 border-b border-gray-100 text-center">
                      <StatusBadge status={perWallet[w]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <h2 className="my-5 mb-2 text-xl font-semibold">Detailed tests</h2>
      <hr aria-hidden="true" className="h-0.5 bg-border border-0 mb-3" />

      {byGroup.map((g) => (
        <section key={g.id} aria-labelledby={`group-${g.id}`} className="mb-5">
          <h3 id={`group-${g.id}`} className="mb-2 text-lg font-semibold">{g.title}</h3>
          <div role="region" aria-label={`${g.title} results`} className="w-full overflow-x-auto">
            <table role="table" className="w-full border-collapse">
              <thead>
                <tr>
                  <th scope="col" className="text-left p-2 border-b border-border w-[30%]">Test</th>
                  {wallets.map((w) => (
                    <th scope="col" key={w} className="text-center p-2 border-b border-border whitespace-nowrap">{w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.items.map((r) => (
                  <tr key={r.id}>
                    <th scope="row" className="p-2 border-b border-gray-50 align-top text-left font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span>{r.title}</span>
                      </div>
                    </th>
                    {wallets.map((w) => (
                      <td key={w} className="p-2 border-b border-gray-50 text-center">
                        <StatusBadge status={r.statuses[w]} title={r.statuses[w] === 'partial' ? (r.note || 'Partially supported') : undefined} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </main>
  )
}

