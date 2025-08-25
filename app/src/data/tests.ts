export type TestItem = {
  id: string;
  title: string;
  expected: string;
  linkTemplate: string; // contains {PREFIX} and may contain {ADDRESS}
  expectedReject?: boolean; // mark tests that must be rejected by wallet
};

export type TestGroup = {
  id: string;
  title: string;
  items: TestItem[];
};
export type TestSpec = TestGroup[];

// Grouped tests based on standart.md. {ADDRESS} will be substituted in runtime.
import rawSpec from '../../tests.json' with { type: 'json' };
export const GROUPS: TestGroup[] = rawSpec as TestSpec;

