import type { TestItem } from '../data/tests';
import type { ResultItem } from './storage';

export type TestResultExport = {
  testId: string;
  title: string;
  status: 'ok' | 'partial' | 'not_ok' | null;
  note: string;
  testedAt?: string;
};

export type ExportData = {
  exportDate: string;
  scheme: string;
  address: string;
  testResults: TestResultExport[];
};

export function buildJsonExport(
  allTests: TestItem[],
  results: Record<string, ResultItem>,
  scheme: string,
  address: string
): ExportData {
  const exportDate = new Date().toISOString();

  const testResults: TestResultExport[] = allTests
    .map((test) => {
      const result = results[test.id];
      return {
        testId: test.id,
        title: test.title,
        status: result?.status ?? null,
        note: result?.note ?? '',
        testedAt: result ? exportDate : undefined,
      };
    })
    .filter((r) => r.status !== null); // Only export tested items

  return {
    exportDate,
    scheme,
    address,
    testResults,
  };
}

export function downloadJson(data: ExportData, scheme: string) {
  const now = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
  const filename = `deeplinks-results_${scheme}_${now}.json`;
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
