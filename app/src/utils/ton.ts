import { Cell, Address, loadStateInit } from '@ton/core';

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


export function parseInit(init: string): { codeHex: string; dataHex: string } | null {
  try {
    const buf = decodeBase64Url(init.trim());
    const boc = Cell.fromBoc(buf);
    const root = boc[0];
    if (!root) return null;
    const slice = root.beginParse();
    const si = loadStateInit(slice);
    const codeHex = si.code ? si.code.toBoc({ idx: false, crc32: false }).toString('hex') : '';
    const dataHex = si.data ? si.data.toBoc({ idx: false, crc32: false }).toString('hex') : '';
    return { codeHex, dataHex };
  } catch {
    return null;
  }
}

export function isValidStateInit(init: string | null | undefined): boolean {
  if (!init) return false;
  try {
    const buf = decodeBase64Url(init.trim());
    const boc = Cell.fromBoc(buf);
    const root = boc[0];
    if (!root) return false;
    const slice = root.beginParse();
    loadStateInit(slice);
    return true;
  } catch {
    return false;
  }
}

