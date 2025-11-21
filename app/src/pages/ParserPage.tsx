import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Checkbox } from '../components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'

// Import parser from the linked package
import { parseDeepLink } from '../../../packages/ton-deeplink-parser/src/index'
import type { ParserOptions, TransferParams } from '../../../packages/ton-deeplink-parser/src/types'
import {
  DeepLinkError,
  FormatError,
  LogicError,
  ExpiredError,
  ParseError,
  NetworkMismatchError
} from '../../../packages/ton-deeplink-parser/src/errors'

// Parser result type
type ParseResult =
  | { success: true; data: TransferParams }
  | {
      success: false
      error: {
        type: string
        name: string
        message: string
        param?: string
      }
    }

/**
 * Safe parser wrapper with error handling
 */
function parseDeepLinkSafe(url: string, options: ParserOptions): ParseResult {
  try {
    const result = parseDeepLink(url, options)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof Error) {
      let type = 'unknown-error'
      let param: string | undefined

      if (error instanceof FormatError || error instanceof LogicError || error instanceof ParseError) {
        type = error.type
        param = error.param
      } else if (error instanceof ExpiredError) {
        type = error.type
        param = error.param
      } else if (error instanceof NetworkMismatchError) {
        type = error.type
        param = error.param
      } else if (error instanceof DeepLinkError) {
        param = error.param
      }

      return {
        success: false,
        error: {
          type,
          name: error.name,
          message: error.message,
          param,
        },
      }
    }
    return {
      success: false,
      error: {
        type: 'unknown-error',
        name: 'UnknownError',
        message: String(error),
      },
    }
  }
}

/**
 * Parser Page - Test deep link parsing
 */
export default function ParserPage() {
  // Input state
  const [url, setUrl] = useState('')
  const [restricted, setRestricted] = useState(false)
  const [network, setNetwork] = useState<'auto' | 'mainnet' | 'testnet'>('auto')
  const [customPrefixes, setCustomPrefixes] = useState('')
  const [optionsExpanded, setOptionsExpanded] = useState(false)

  // Result state
  const [result, setResult] = useState<ParseResult | null>(null)

  // Build parser options
  const parserOptions: ParserOptions = useMemo(() => {
    const opts: ParserOptions = {}

    if (restricted) opts.restricted = true
    if (network !== 'auto') opts.network = network
    if (customPrefixes.trim()) {
      opts.walletSpecificPrefixes = customPrefixes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    return opts
  }, [restricted, network, customPrefixes])

  const handleParse = () => {
    if (!url.trim()) return
    const parseResult = parseDeepLinkSafe(url, parserOptions)
    setResult(parseResult)
  }

  const handleClear = () => {
    setUrl('')
    setResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Deep Link Parser</h1>
        <p className="text-sm text-muted-foreground">
          Parse and validate TON wallet deep links
        </p>
      </div>

      {/* Input Section */}
      <Card className="p-4 mb-4">
        <div className="space-y-3">
          {/* URL Input */}
          <div>
            <Label htmlFor="url-input" className="text-sm">Deep Link URL</Label>
            <Textarea
              id="url-input"
              placeholder="ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono text-xs mt-1.5"
              rows={3}
            />
          </div>

          {/* Parser Options - Collapsible */}
          <div className="border-t pt-2">
            <button
              onClick={() => setOptionsExpanded(!optionsExpanded)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {optionsExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Options
            </button>

            {optionsExpanded && (
              <div className="mt-2 space-y-2 pl-4">
                {/* Restricted Mode + Network on same line */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="restricted"
                      checked={restricted}
                      onCheckedChange={(checked) => setRestricted(checked as boolean)}
                    />
                    <Label htmlFor="restricted" className="text-xs cursor-pointer font-normal">
                      Restricted
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Network:</Label>
                    <ToggleGroup
                      type="single"
                      value={network}
                      onValueChange={(value) => value && setNetwork(value as typeof network)}
                      variant="outline"
                      size="sm"
                    >
                      <ToggleGroupItem value="auto" className="text-xs px-2 h-7">
                        Auto
                      </ToggleGroupItem>
                      <ToggleGroupItem value="mainnet" className="text-xs px-2 h-7">
                        Mainnet
                      </ToggleGroupItem>
                      <ToggleGroupItem value="testnet" className="text-xs px-2 h-7">
                        Testnet
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>

                {/* Custom Prefixes */}
                <div>
                  <Label htmlFor="prefixes" className="text-xs text-muted-foreground">Custom Prefixes (comma-separated)</Label>
                  <Textarea
                    id="prefixes"
                    placeholder="tonkeeper://, https://app.tonkeeper.com/"
                    value={customPrefixes}
                    onChange={(e) => setCustomPrefixes(e.target.value)}
                    className="font-mono text-xs mt-1.5"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleParse} disabled={!url.trim()} size="sm">
              Parse
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {result && !result.success && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle className="text-sm font-semibold">
            {result.error.name}
          </AlertTitle>
          <AlertDescription className="text-xs mt-1">
            <p>{result.error.message}</p>
            {result.error.param && (
              <p className="mt-1 opacity-80">
                Parameter: <code className="bg-background/20 px-1 rounded">{result.error.param}</code>
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Results Display */}
      {result && result.success && (
        <Card className="p-4 mb-4">
          <div className="space-y-1.5 text-xs">
            {/* Type */}
            <div>
              <span className="text-muted-foreground">Type:</span>
              <div className="bg-muted px-2 py-1 rounded mt-0.5">
                {'jetton' in result.data ? 'Jetton Transfer' : 'TON Transfer'}
              </div>
            </div>

            {/* Network */}
            <div>
              <span className="text-muted-foreground">Network:</span>
              <div className="bg-muted px-2 py-1 rounded mt-0.5">
                {result.data.network}
              </div>
            </div>

            {/* Recipient */}
            {'address' in result.data ? (
              <div>
                <span className="text-muted-foreground">Address:</span>
                <div className="font-mono bg-muted px-2 py-1 rounded mt-0.5 break-all">
                  {result.data.address}
                </div>
              </div>
            ) : (
              <div>
                <span className="text-muted-foreground">DNS:</span>
                <div className="font-mono bg-muted px-2 py-1 rounded mt-0.5">
                  {result.data.dns}
                </div>
              </div>
            )}

            {/* Amount */}
            {result.data.amount && (
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <div className="font-mono bg-muted px-2 py-1 rounded mt-0.5">
                  {result.data.amount}
                </div>
              </div>
            )}

            {/* Text */}
            {'text' in result.data && result.data.text && (
              <div>
                <span className="text-muted-foreground">Text:</span>
                <div className="bg-muted px-2 py-1 rounded mt-0.5 break-all">
                  {result.data.text}
                </div>
              </div>
            )}

            {/* Binary */}
            {'bin' in result.data && result.data.bin && (
              <div>
                <span className="text-muted-foreground">Binary (BOC):</span>
                <div className="font-mono bg-muted px-2 py-1 rounded mt-0.5 break-all text-[10px]">
                  {result.data.bin}
                </div>
              </div>
            )}

            {/* Jetton */}
            {'jetton' in result.data && result.data.jetton && (
              <div>
                <span className="text-muted-foreground">Jetton Master:</span>
                <div className="font-mono bg-muted px-2 py-1 rounded mt-0.5 break-all">
                  {result.data.jetton}
                </div>
              </div>
            )}

            {/* Init */}
            {'init' in result.data && result.data.init && (
              <div>
                <span className="text-muted-foreground">StateInit:</span>
                <div className="font-mono bg-muted px-2 py-1 rounded mt-0.5 break-all text-[10px]">
                  {result.data.init}
                </div>
              </div>
            )}

            {/* Expiration */}
            {result.data.exp && (
              <div>
                <span className="text-muted-foreground">Expires:</span>
                <div className="bg-muted px-2 py-1 rounded mt-0.5">
                  <span className="font-mono">{result.data.exp}</span>
                  <span className="text-muted-foreground ml-2">
                    ({new Date(parseInt(result.data.exp) * 1000).toLocaleString()})
                  </span>
                </div>
              </div>
            )}

            {/* No parameters message */}
            {!result.data.amount &&
              !('text' in result.data && result.data.text) &&
              !('bin' in result.data && result.data.bin) &&
              !result.data.exp && (
                <p className="text-muted-foreground pt-1">
                  Send-screen mode (no parameters)
                </p>
              )}

            {/* Raw JSON - Collapsible */}
            <div className="border-t pt-3 mt-3">
              <details className="group">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground list-none">
                  <span className="inline-flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                    Raw JSON
                  </span>
                </summary>
                <pre className="mt-2 bg-muted p-3 rounded text-[10px] overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </Card>
      )}

      {/* Examples */}
      {!result && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Examples</h3>
          <div className="space-y-2">
            {[
              {
                label: 'Basic transfer',
                url: 'ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000',
              },
              {
                label: 'With text',
                url: 'ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=Hello',
              },
              {
                label: 'DNS address',
                url: 'ton://transfer/wallet.ton?amount=1000000000',
              },
              {
                label: 'Jetton',
                url: 'ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
              },
              {
                label: 'Send-screen',
                url: 'ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh',
              },
            ].map(({ label, url: exampleUrl }) => (
              <button
                key={label}
                onClick={() => setUrl(exampleUrl)}
                className="block w-full text-left"
              >
                <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                <div className="text-xs text-primary hover:underline font-mono break-all">
                  {exampleUrl}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
