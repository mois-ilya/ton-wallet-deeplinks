import type { TestItem } from '../data/tests';
import type { ResultItem } from './storage';

function escapeCsv(value: string): string {
  const needs = /[",\n]/.test(value);
  if (!needs) return value;
  return '"' + value.replace(/"/g, '""') + '"';
}

export function buildCsv(
  tests: TestItem[],
  results: Record<string, ResultItem>,
  scheme: 'ton' | 'tonkeeper' | 'https',
  address: string,
  bin: string,
  dns: string,
  init: string
): string {
  const header = ['id', 'title', 'link', 'expected', 'status', 'note'];
  const rows = [header.join(',')];

  const prefix = scheme === 'https' ? 'https://app.tonkeeper.com/' : scheme + '://';

  for (const t of tests) {
    // Calculate exp value for this specific test
    let effectiveExp = 0;
    if (t.expMode === 'static') {
      // Parse static exp from template
      const staticMatch = t.linkTemplate.match(/exp=(\d+)/);
      effectiveExp = staticMatch ? parseInt(staticMatch[1], 10) : 0;
    } else if (t.expMode === 'dynamic') {
      // For CSV export, use current time + duration (snapshot)
      const now = Math.floor(Date.now() / 1000);
      effectiveExp = now + (t.expDuration || 30);
    }

    const link = t.linkTemplate
      .replace('{PREFIX}', prefix)
      .replace('{ADDRESS}', address)
      .replace('{BIN}', bin)
      .replace('{DNS}', dns)
      .replace('{INIT}', init)
      .replace('{EXP}', String(effectiveExp));

    const r = results[t.id];
    const status = r?.status ?? '';
    const note = r?.note ?? '';
    const row = [
      t.id,
      escapeCsv(t.title),
      escapeCsv(link),
      escapeCsv(t.expected),
      status,
      escapeCsv(note),
    ].join(',');
    rows.push(row);
  }

  return rows.join('\n');
}

