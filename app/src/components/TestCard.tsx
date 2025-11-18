import { useEffect, useMemo, useState } from 'react';
import type { TestItem } from '../data/tests';
import QrCode from './QrCode';
import { parseInit } from '../utils/ton';

type Scheme = 'ton' | 'tonkeeper' | 'https';

type Props = {
  item: TestItem;
  scheme: Scheme;
  address: string;
  bin: string;
  dns: string;
  init: string;
  initValid?: boolean;
  binValid?: boolean;
  expValue: number;
  result: { status: 'ok' | 'partial' | 'not_ok' | null; note: string } | undefined;
  onChange: (testId: string, next: { status: 'ok' | 'partial' | 'not_ok' | null; note: string }) => void;
};

export default function TestCard({ item, scheme, address, bin, dns, init, initValid = true, binValid = true, expValue, result, onChange }: Props) {
  const [showQr, setShowQr] = useState(false);

  // Per-test exp activation state
  const [armed, setArmed] = useState(false);
  const [armedAt, setArmedAt] = useState<number | null>(null);
  const [localExpValue, setLocalExpValue] = useState<number>(0);

  const prefix = scheme === 'https' ? 'https://app.tonkeeper.com/' : scheme + '://';

  // Determine exp mode
  const isStaticExp = item.expMode === 'static';
  const isDynamicExp = item.expMode === 'dynamic';
  const hasExp = isStaticExp || isDynamicExp;
  const expDuration = item.expDuration || 30;

  // For static exp: parse from template; for dynamic: use localExpValue
  const effectiveExp = useMemo(() => {
    if (isStaticExp) {
      // Parse static exp from linkTemplate
      const staticMatch = item.linkTemplate.match(/exp=(\d+)/);
      return staticMatch ? parseInt(staticMatch[1], 10) : 0;
    } else if (isDynamicExp) {
      return localExpValue;
    }
    return 0;
  }, [isStaticExp, isDynamicExp, item.linkTemplate, localExpValue]);

  const link = useMemo(() => {
    const processedLink = item.linkTemplate
      .replace('{PREFIX}', prefix)
      .replace('{ADDRESS}', address)
      .replace('{BIN}', bin)
      .replace('{DNS}', dns)
      .replace('{INIT}', init)
      .replace('{EXP}', String(effectiveExp));

    return processedLink;
  }, [item.linkTemplate, prefix, address, bin, dns, init, effectiveExp]);

  const usesInitPlaceholder = item.linkTemplate.includes('{INIT}');
  const usesBinPlaceholder = item.linkTemplate.includes('{BIN}');
  const disabledDueToInit = usesInitPlaceholder && !initValid;
  const disabledDueToBin = usesBinPlaceholder && !binValid;
  const disabledDueToDynamic = isDynamicExp && !armed;
  const disabled = disabledDueToInit || disabledDueToBin || disabledDueToDynamic;

  const parsedInit = useMemo(() => (usesInitPlaceholder && initValid ? parseInit(init) : null), [usesInitPlaceholder, initValid, init]);

  const remainingSec = Math.max(0, effectiveExp - Math.floor(Date.now() / 1000));

  // Arm dynamic exp test
  function armTest() {
    const now = Math.floor(Date.now() / 1000);
    setArmedAt(now);
    setLocalExpValue(now + expDuration);
    setArmed(true);
  }

  // Timer for dynamic exp: update countdown and check expiration
  useEffect(() => {
    if (!isDynamicExp || !armed || !armedAt) return;

    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = armedAt + expDuration;

      if (now >= expiresAt) {
        // Expired - disarm
        setArmed(false);
        setArmedAt(null);
        setLocalExpValue(0);
      } else {
        // Update exp value
        setLocalExpValue(expiresAt);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isDynamicExp, armed, armedAt, expDuration]);

  // Timer for static exp: just update countdown display
  useEffect(() => {
    if (!isStaticExp) return;
    const timer = setInterval(() => {
      setShowQr((v) => v); // force re-render
    }, 1000);
    return () => clearInterval(timer);
  }, [isStaticExp]);

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
          {isDynamicExp && (
            <span style={{
              background: armed ? '#e6ffe6' : '#f5f5f5',
              color: armed ? '#006600' : '#666',
              border: `1px solid ${armed ? '#91ff91' : '#ddd'}`,
              borderRadius: 12,
              fontSize: 12,
              padding: '2px 8px'
            }}>{armed ? `Armed: ${remainingSec}s` : 'Not armed'}</span>
          )}
          {hasExp && armed && (
            <span style={{
              background: '#fff7e6',
              color: '#ad6800',
              border: '1px solid #ffd591',
              borderRadius: 12,
              fontSize: 12,
              padding: '2px 8px'
            }}>expires in: {remainingSec}s</span>
          )}
          {isStaticExp && (
            <span style={{
              background: '#fff7e6',
              color: '#ad6800',
              border: '1px solid #ffd591',
              borderRadius: 12,
              fontSize: 12,
              padding: '2px 8px'
            }}>static exp: {remainingSec}s</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, justifySelf: 'end' }}>
          {isDynamicExp && !armed ? (
            <button onClick={armTest}>Arm ({expDuration}s)</button>
          ) : (
            <>
              <button onClick={openLink} disabled={disabled} aria-disabled={disabled}>Open</button>
              <button onClick={copyLink} disabled={disabled} aria-disabled={disabled}>Copy</button>
              <button onClick={() => setShowQr((v) => !v)} disabled={disabled} aria-disabled={disabled}>QR</button>
            </>
          )}
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
        </div>
      </div>

      {disabled && (
        <div style={{ marginTop: 8, background: '#fff1f0', color: '#cf1322', border: '1px solid #ffa39e', borderRadius: 6, padding: '6px 8px' }}>
          disabled: {[
            disabledDueToInit ? 'invalid init' : null,
            disabledDueToBin ? 'invalid bin' : null,
            disabledDueToDynamic ? 'not armed (click Arm button)' : null,
          ].filter(Boolean).join(', ')}
        </div>
      )}

      {parsedInit && (
        <div style={{ marginTop: 8, background: '#ffffff', color: '#135200' }}>
          init.code field present with value {parsedInit.codeHex}
          <br />
          init.data field present with value {parsedInit.dataHex}
        </div>
      )}

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

