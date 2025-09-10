import { useEffect, useMemo, useState } from 'react';
import type { TestItem } from '../data/tests';
import QrCode from './QrCode';

type Scheme = 'ton' | 'tonkeeper' | 'https';

type Props = {
  item: TestItem;
  scheme: Scheme;
  address: string;
  bin: string;
  dns: string;
  init: string;
  initValid?: boolean;
  expValue: number;
  result: { status: 'ok' | 'partial' | 'not_ok' | null; note: string } | undefined;
  onChange: (testId: string, next: { status: 'ok' | 'partial' | 'not_ok' | null; note: string }) => void;
};

export default function TestCard({ item, scheme, address, bin, dns, init, initValid = true, expValue, result, onChange }: Props) {
  const [showQr, setShowQr] = useState(false);
  const prefix = scheme === 'https' ? 'https://app.tonkeeper.com/' : scheme + '://';
  const link = useMemo(() => {
    const processedLink = item.linkTemplate
      .replace('{PREFIX}', prefix)
      .replace('{ADDRESS}', address)
      .replace('{BIN}', bin)
      .replace('{DNS}', dns)
      .replace('{INIT}', init)
      .replace('{EXP}', String(expValue));
    
    return processedLink;
  }, [item.linkTemplate, prefix, address, bin, dns, init, expValue]);

  const usesInitPlaceholder = item.linkTemplate.includes('{INIT}');
  const disabled = usesInitPlaceholder && !initValid;

  // Expiration helpers
  const hasExp = item.linkTemplate.includes('{EXP}') || item.linkTemplate.includes('exp=');
  const usesExpPlaceholder = item.linkTemplate.includes('{EXP}');
  // If template uses {EXP}, use dynamic value; otherwise parse static value from built link
  const staticExpMatch = !usesExpPlaceholder ? link.match(/exp=(\d+)/) : null;
  const effectiveExp = usesExpPlaceholder ? expValue : (staticExpMatch ? parseInt(staticExpMatch[1], 10) : expValue);
  const remainingSec = Math.max(0, effectiveExp - Math.floor(Date.now() / 1000));

  // Rerender every second for items with exp to update remaining seconds
  useEffect(() => {
    if (!hasExp) return;
    const t = setInterval(() => {
      // force re-render
      setShowQr((v) => v);
    }, 1000);
    return () => clearInterval(t);
  }, [hasExp]);

  const status = result?.status ?? null;
  const note = result?.note ?? '';

  function setStatus(next: 'ok' | 'partial' | 'not_ok' | null) {
    onChange(item.id, { status: next, note });
  }

  function setNote(next: string) {
    onChange(item.id, { status, note: next });
  }

  function openLink() {
    if (disabled) return;
    if (scheme === 'https') {
      window.open(link, '_blank');
    } else {
      window.location.href = link;
    }
  }

  async function copyLink() {
    if (disabled) return;
    await navigator.clipboard.writeText(link);
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, columnGap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>{item.title}</span>
          {item.expectedReject && (
            <span style={{
              background: '#ffe6e6',
              color: '#b00000',
              border: '1px solid #ffb3b3',
              borderRadius: 12,
              fontSize: 12,
              padding: '2px 8px'
            }}>Expected: Reject</span>
          )}
          {item.editable !== undefined && (
            <span style={{
              background: item.editable ? '#e6f4ff' : '#f5f5f5',
              color: item.editable ? '#0958d9' : '#555',
              border: `1px solid ${item.editable ? '#91caff' : '#ddd'}`,
              borderRadius: 12,
              fontSize: 12,
              padding: '2px 8px'
            }}>{item.editable ? 'Editable' : 'Non-editable'}</span>
          )}
          {hasExp && (
            <span style={{
              background: '#fff7e6',
              color: '#ad6800',
              border: '1px solid #ffd591',
              borderRadius: 12,
              fontSize: 12,
              padding: '2px 8px'
            }}>expires in: {remainingSec}s</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, justifySelf: 'end' }}>
          <button onClick={openLink} disabled={disabled} aria-disabled={disabled}>Open</button>
          <button onClick={copyLink} disabled={disabled} aria-disabled={disabled}>Copy</button>
          <button onClick={() => setShowQr((v) => !v)} disabled={disabled} aria-disabled={disabled}>QR</button>
        </div>
        <a
          href={link}
          target={scheme === 'https' ? '_blank' : undefined}
          rel="noreferrer"
          style={{
            gridColumn: '1 / -1',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
            color: disabled ? '#999' : '#0366d6',
            textDecoration: 'underline',
            pointerEvents: disabled ? 'none' : undefined
          }}
        >
          {link}
        </a>
        <div style={{ gridColumn: '1 / -1' }}>
          {item.expected}
          {disabled && (
            <span style={{ marginLeft: 8, background: '#fff1f0', color: '#cf1322', border: '1px solid #ffa39e', borderRadius: 12, fontSize: 12, padding: '2px 8px' }}>
              disabled: invalid init
            </span>
          )}
        </div>
      </div>

      {showQr && (
        <div style={{ marginTop: 8 }}>
          <QrCode value={link} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <label>
          <input type="radio" name={`status-${item.id}`} checked={status === 'ok'} onChange={() => setStatus('ok')} disabled={disabled} /> OK
        </label>
        <label>
          <input type="radio" name={`status-${item.id}`} checked={status === 'partial'} onChange={() => setStatus('partial')} disabled={disabled} /> Partially OK
        </label>
        <label>
          <input type="radio" name={`status-${item.id}`} checked={status === 'not_ok'} onChange={() => setStatus('not_ok')} disabled={disabled} /> Not OK
        </label>
        <input
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={disabled}
          style={{ flex: '1 1 320px', padding: 6 }}
        />
      </div>
    </div>
  );
}

