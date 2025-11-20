import { useState } from 'react'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'

/**
 * Parser Page - Test deep link parsing
 *
 * Allows users to input a TON wallet deep link and see how it's parsed
 * according to the standard.
 */
export default function ParserPage() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleParse = () => {
    // TODO: Use @ton-deeplinks/parser package here
    // For now, this is just a stub showing the UI structure

    setResult({
      url,
      scheme: 'ton',
      type: 'ton',
      screenMode: 'confirmation-screen',
      valid: true,
      params: {
        address: 'UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh',
        amount: '1000000000',
        text: 'Hello',
      },
      errors: [],
      warnings: [],
    })
  }

  const handleClear = () => {
    setUrl('')
    setResult(null)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Deep Link Parser</h1>
        <p className="text-muted-foreground">
          Test and validate TON wallet deep links according to the standard
        </p>
      </header>

      {/* Input Section */}
      <Card className="p-4 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Deep Link URL</label>
            <Input
              type="text"
              placeholder="ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleParse} disabled={!url}>
              Parse
            </Button>
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Validation Status */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">Validation Status</h2>
            <div className="flex items-center gap-2">
              <Badge variant={result.valid ? 'success' : 'destructive'}>
                {result.valid ? '✅ Valid' : '❌ Invalid'}
              </Badge>
              {result.errors?.length > 0 && (
                <Badge variant="destructive">{result.errors.length} errors</Badge>
              )}
              {result.warnings?.length > 0 && (
                <Badge variant="warning">{result.warnings.length} warnings</Badge>
              )}
            </div>
          </Card>

          {/* Parsed Details */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">Parsed Details</h2>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Scheme:</span>
                <code className="bg-muted px-2 py-0.5 rounded">{result.scheme}</code>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Type:</span>
                <code className="bg-muted px-2 py-0.5 rounded">{result.type}</code>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Screen Mode:</span>
                <code className="bg-muted px-2 py-0.5 rounded">{result.screenMode}</code>
              </div>
            </div>
          </Card>

          {/* Parameters */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">Parameters</h2>
            <div className="space-y-2 text-sm font-mono">
              {Object.entries(result.params).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-medium text-foreground">{key}:</span>
                  <span className="text-muted-foreground break-all">{String(value)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <Card className="p-4 border-destructive">
              <h2 className="text-lg font-semibold mb-3 text-destructive">Errors</h2>
              <ul className="space-y-2 text-sm">
                {result.errors.map((error: any, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono text-destructive">[{error.code}]</span>
                    <span>{error.message}</span>
                    {error.param && (
                      <code className="bg-muted px-1 rounded">({error.param})</code>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <Card className="p-4 border-yellow-500">
              <h2 className="text-lg font-semibold mb-3 text-yellow-700">Warnings</h2>
              <ul className="space-y-2 text-sm">
                {result.warnings.map((warning: any, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono text-yellow-700">[{warning.code}]</span>
                    <span>{warning.message}</span>
                    {warning.param && (
                      <code className="bg-muted px-1 rounded">({warning.param})</code>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Examples */}
      {!result && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">Example Links</h2>
          <div className="space-y-2">
            <button
              onClick={() => setUrl('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000')}
              className="block w-full text-left text-sm text-primary hover:underline font-mono"
            >
              ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000
            </button>
            <button
              onClick={() => setUrl('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&text=test')}
              className="block w-full text-left text-sm text-primary hover:underline font-mono"
            >
              ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&text=test
            </button>
            <button
              onClick={() => setUrl('ton://transfer/example.ton?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')}
              className="block w-full text-left text-sm text-primary hover:underline font-mono"
            >
              ton://transfer/example.ton?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
