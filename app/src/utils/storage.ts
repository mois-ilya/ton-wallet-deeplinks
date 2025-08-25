export type ResultItem = {
  testId: string;
  status: 'ok' | 'not_ok' | null;
  note: string;
};

const KEY = 'deeplinks-stand-results-v1';

export function loadResults(): Record<string, ResultItem> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveResults(map: Record<string, ResultItem>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function clearResults() {
  localStorage.removeItem(KEY);
}

