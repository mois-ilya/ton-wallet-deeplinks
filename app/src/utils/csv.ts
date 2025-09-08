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
  expValue: number,
  address: string,
  bin: string,
  dns: string,
  initData: string
): string {
  const header = ['id', 'title', 'link', 'expected', 'status', 'note'];
  const rows = [header.join(',')];

  const prefix = scheme === 'https' ? 'https://app.tonkeeper.com/' : scheme + '://';

  for (const t of tests) {
    let link = t.linkTemplate
      .replace('{PREFIX}', prefix)
      .replace('{ADDRESS}', address)
      .replace('{BIN}', bin)
      .replace('{DNS}', dns)
      .replace('{INIT}', initData)
      .replace('{EXP}', String(expValue));

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

