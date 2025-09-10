import { Cell } from '@ton/core';

function decodeBase64Url(input: string): Uint8Array {
  const decoded = decodeURIComponent(input.trim());
  const base64 = decoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function isValidInitBoc(init: string | null | undefined): boolean {
  if (!init) return false;
  try {
    const bytes = decodeBase64Url(init);
    // If parsing fails, an error will be thrown
    const boc = Cell.fromBoc(bytes);
    return Array.isArray(boc);
  } catch {
    return false;
  }
}

