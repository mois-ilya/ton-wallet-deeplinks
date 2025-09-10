import { Cell, Address } from '@ton/core';

function decodeBase64Url(input: string): Buffer {
  const decoded = decodeURIComponent(input.trim());
  const base64 = decoded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64');
}

export function isValidBoc(init: string | null | undefined): boolean {
  if (!init) return false;
  try {
    const buf = decodeBase64Url(init);
    // If parsing fails, an error will be thrown
    const boc = Cell.fromBoc(buf);
    return Array.isArray(boc);
  } catch {
    return false;
  }
}

export function isLikelyValidAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  return Address.isFriendly(address) || Address.isRaw(address);
}


export function parseInit(init: string): { codeHex: string; dataHex: string; splitDepth: number | null } | null {
  try {
    const buf = decodeBase64Url(init);
    const boc = Cell.fromBoc(buf);
    const slice = boc[0]?.beginParse();
    if (!slice) return null;
    const code = slice.loadRef().toBoc({ idx: false, crc32: false }).toString('hex');
    const data = slice.loadRef().toBoc({ idx: false, crc32: false }).toString('hex');
    const splitDepth = slice.remainingBits >= 4 ? slice.loadUint(4) : null;
    return { codeHex: code, dataHex: data, splitDepth };
  } catch {
    return null;
  }
}

