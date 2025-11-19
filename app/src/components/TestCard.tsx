import { useEffect, useMemo, useState } from 'react';
import type { TestItem } from '../data/tests';
import QrCode from './QrCode';
import { parseInit } from '../utils/ton';
import { AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Input } from './ui/input';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Copy, ExternalLink } from 'lucide-react';
import { Separator } from './ui/separator';
import { Card, CardContent } from './ui/card';

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
  result: { status: 'ok' | 'partial' | 'not_ok' | null; note: string } | undefined;
  onChange: (testId: string, next: { status: 'ok' | 'partial' | 'not_ok' | null; note: string }) => void;
};

export default function TestCard({ item, scheme, address, bin, dns, init, initValid = true, binValid = true, result, onChange }: Props) {
  const [armed, setArmed] = useState(false);
  const [armedAt, setArmedAt] = useState<number | null>(null);
  const [localExpValue, setLocalExpValue] = useState<number>(0);
  const [, setTick] = useState(0);

  const prefix = scheme === 'https' ? 'https://app.tonkeeper.com/' : scheme + '://';

  const isStaticExp = item.expMode === 'static';
  const isDynamicExp = item.expMode === 'dynamic';
  const hasExp = isStaticExp || isDynamicExp;
  const expDuration = item.expDuration || 30;

  const effectiveExp = useMemo(() => {
    if (isStaticExp) {
      const staticMatch = item.linkTemplate.match(/exp=(\d+)/);
      return staticMatch ? parseInt(staticMatch[1], 10) : 0;
    } else if (isDynamicExp) {
      return localExpValue;
    }
    return 0;
  }, [isStaticExp, isDynamicExp, item.linkTemplate, localExpValue]);

  const link = useMemo(() => {
    return item.linkTemplate
      .replace('{PREFIX}', prefix)
      .replace('{ADDRESS}', address)
      .replace('{BIN}', bin)
      .replace('{DNS}', dns)
      .replace('{INIT}', init)
      .replace('{EXP}', String(effectiveExp));
  }, [item.linkTemplate, prefix, address, bin, dns, init, effectiveExp]);

  const usesInitPlaceholder = item.linkTemplate.includes('{INIT}');
  const usesBinPlaceholder = item.linkTemplate.includes('{BIN}');
  const disabledDueToInit = usesInitPlaceholder && !initValid;
  const disabledDueToBin = usesBinPlaceholder && !binValid;
  const disabledDueToDynamic = isDynamicExp && !armed;
  const disabled = disabledDueToInit || disabledDueToBin || disabledDueToDynamic;

  const parsedInit = useMemo(() => (usesInitPlaceholder && initValid ? parseInit(init) : null), [usesInitPlaceholder, initValid, init]);
  const remainingSec = Math.max(0, effectiveExp - Math.floor(Date.now() / 1000));

  function armTest() {
    const now = Math.floor(Date.now() / 1000);
    setArmedAt(now);
    setLocalExpValue(now + expDuration);
    setArmed(true);
  }

  useEffect(() => {
    if (!isDynamicExp || !armed || !armedAt) return;
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = armedAt + expDuration;
      if (now >= expiresAt) {
        setArmed(false);
        setArmedAt(null);
        setLocalExpValue(0);
      } else {
        setTick((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isDynamicExp, armed, armedAt, expDuration]);

  useEffect(() => {
    if (!isStaticExp) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
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

  const statusIcon = status === 'ok' ? '✅' : status === 'partial' ? '⚠️' : status === 'not_ok' ? '❌' : '⚪';

  return (
    <AccordionItem value={item.id}>
      <AccordionTrigger className="hover:no-underline bg-gray-50 m-0">
        <div className="flex items-center gap-2 w-full text-left">
          <span>{statusIcon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <code className="text-[10px] font-mono">{item.id}</code>
              <div className="flex items-center gap-1 ml-auto">
                {item.expectedReject && <span className="text-[10px] text-destructive font-medium">×Reject</span>}
                {item.editable && <span className="text-[10px] text-muted-foreground font-medium">Edit</span>}
                {isDynamicExp && armed && <Badge variant="warning">🔥{remainingSec}s</Badge>}
              </div>
            </div>
            <div className="text-xs mt-0.5">{item.title}</div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto] gap-3 text-xs">
          {/* QR code - first on mobile, right on desktop */}
          {!disabledDueToDynamic && (
            <div className="flex items-start justify-center lg:justify-end lg:order-2">
              <div className="border rounded">
                <QrCode value={link} />
              </div>
            </div>
          )}

          {/* Main content - second on mobile, left on desktop */}
          <div className="flex flex-col gap-2 lg:order-1">
            {/* Expected */}
            <div>
              <p className="text-xs text-muted-foreground leading-relaxed"><b>Expected:</b> {item.expected}</p>
            </div>

            {/* Errors */}
            {(disabledDueToInit || disabledDueToBin) && (
              <Alert variant="destructive">
                <AlertDescription>
                  ❌ {[disabledDueToInit ? 'invalid init' : null, disabledDueToBin ? 'invalid bin' : null].filter(Boolean).join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {/* Not armed */}
            {disabledDueToDynamic && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-medium mb-0.5">Dynamic expiration test</p>
                      <p className="text-[10px] text-muted-foreground">
                        Activate {expDuration}s timer to generate link
                      </p>
                    </div>
                    <Button onClick={armTest} size="sm">Arm</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Link & Buttons */}
            {!disabledDueToDynamic && (
              <div className="space-y-2">
                {hasExp && armed && (
                  <Badge variant="warning">
                    ⏱️ {remainingSec}s left
                  </Badge>
                )}

                <div className="flex flex-col sm:flex-row gap-1 items-stretch sm:items-center">
                  <Input
                    readOnly
                    value={link}
                    className="text-xs font-mono flex-1"
                  />
                  <div className="flex gap-1">
                    <Button onClick={copyLink} disabled={disabled} size="sm" variant="outline" className="flex-1 sm:flex-none">
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button onClick={openLink} disabled={disabled} size="sm" className="flex-1 sm:flex-none">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Init info */}
            {parsedInit && (
              <Alert variant="success">
                <AlertTitle className="text-xs">Init StateInit</AlertTitle>
                <AlertDescription className="text-[10px] font-mono space-y-1">
                  <div><strong>code:</strong> {parsedInit.codeHex}</div>
                  <div><strong>data:</strong> {parsedInit.dataHex}</div>
                </AlertDescription>
              </Alert>
            )}

            {/* Status */}
            <Separator className="my-2 mt-auto" />
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <ToggleGroup
                type="single"
                value={status ?? undefined}
                onValueChange={(value) => setStatus(value as 'ok' | 'partial' | 'not_ok' | null || null)}
                variant="outline"
                size="sm"
                className="grid grid-cols-3 sm:flex"
              >
                <ToggleGroupItem value="ok" className="text-xs">
                  ✅ OK
                </ToggleGroupItem>
                <ToggleGroupItem value="partial" className="text-xs">
                  ⚠️ Part
                </ToggleGroupItem>
                <ToggleGroupItem value="not_ok" className="text-xs">
                  ❌ Fail
                </ToggleGroupItem>
              </ToggleGroup>
              <Input
                placeholder="Note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-xs flex-1"
              />
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
