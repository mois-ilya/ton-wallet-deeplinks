# @ton-deeplinks/parser

String-only parser for TON wallet deep links. Validates URLs and returns parameters as strings without type conversion.

## Installation

```bash
npm install @ton-deeplinks/parser
```

## Quick Start

```typescript
import { parseDeepLink } from '@ton-deeplinks/parser'

const { address, amount, text, network } = parseDeepLink(
  'ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=Hello'
)

console.log(address)  // 'UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh'
console.log(amount)   // '1000000000' (string)
console.log(text)     // 'Hello'
console.log(network)  // 'mainnet'
```

## API Reference

### `parseDeepLink(url: string, options?: ParserOptions): TransferParams`

Parses and validates a TON wallet transfer deep link. Throws errors on invalid input.

**Options:**

```typescript
interface ParserOptions {
  restricted?: boolean              // Only basic features (default: false)
  network?: 'mainnet' | 'testnet'   // Validate address network
  walletSpecificPrefixes?: string[] // Additional URL prefixes
}
```

- **`restricted`** - Only allows `address`, `jetton`, `amount`, `text`. Rejects `bin`, `init`, `exp`
- **`network`** - Validates that address network matches wallet network (prevents cross-network transactions)
- **`walletSpecificPrefixes`** - Custom URL prefixes (e.g., `['tonkeeper://', 'https://app.tonkeeper.com/']`). The `ton://` prefix is always supported

**Returns:**

```typescript
// TON transfer
type TonTransferParams = {
  address?: string      // Or dns (mutually exclusive)
  dns?: string          // TON DNS domain
  amount?: string       // Nanotons as string
  text?: string         // Comment (or bin, mutually exclusive)
  bin?: string          // Binary payload as base64 BOC
  init?: string         // StateInit as base64 BOC (TON only)
  exp?: string          // UNIX timestamp (requires amount)
  network: 'mainnet' | 'testnet'
}

// Jetton transfer
type JettonTransferParams = {
  address?: string      // Or dns
  dns?: string
  jetton: string        // Jetton master contract address (required)
  amount?: string       // Token units as string
  text?: string         // Comment (or bin)
  bin?: string
  exp?: string          // UNIX timestamp (requires amount)
  network: 'mainnet' | 'testnet'
}
```

## Parameters

| Parameter | Type | Description | TON | Jetton | Restricted |
|-----------|------|-------------|-----|--------|------------|
| `address` | string | Recipient address (friendly/raw, XOR with dns) | ✅ | ✅ | ✅ |
| `dns` | string | TON DNS domain (XOR with address) | ✅ | ✅ | ✅ |
| `amount` | string | Amount in atomic units (nanotons/tokens) | ✅ | ✅ | ✅ |
| `text` | string | Text comment (XOR with bin) | ✅ | ✅ | ✅ |
| `bin` | string | Binary payload as base64 BOC (XOR with text) | ✅ | ✅ | ❌ |
| `init` | string | StateInit as base64 BOC | ✅ | ❌ | ❌ |
| `exp` | string | Valid-until UNIX timestamp (requires amount) | ✅ | ✅ | ❌ |
| `jetton` | string | Jetton master contract address | ❌ | ✅ | ✅ |

## Usage Examples

### Basic TON Transfer (Send Screen)

```typescript
// No amount - wallet shows send screen for user input
const { address, network } = parseDeepLink(
  'ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh'
)
// address: 'UQA...'
// network: 'mainnet'
```

### TON Transfer with Amount (Confirmation Screen)

```typescript
const { address, amount, text, network } = parseDeepLink(
  'ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=Payment'
)
// amount: '1000000000' (string, convert to bigint for processing)
// text: 'Payment'
```

### Jetton Transfer

```typescript
const { address, jetton, amount, network } = parseDeepLink(
  'ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&amount=1000000'
)
// jetton: 'EQCxE6...' (jetton master contract)
// amount: '1000000' (token atomic units)
```

### DNS Address

```typescript
const { dns, amount, network } = parseDeepLink(
  'ton://transfer/wallet.ton?amount=1000000000'
)
// dns: 'wallet.ton'
// network: 'mainnet' (DNS always mainnet)
// Note: Parser doesn't resolve DNS - do it separately
```

### Binary Payload

```typescript
const { address, bin, network } = parseDeepLink(
  'ton://transfer/UQA...?bin=te6cckEBAQEACQAADgAAAABiaW793PSE'
)
// bin: 'te6cckEBAQEACQAADgAAAABiaW793PSE' (base64 BOC)
```

### StateInit

```typescript
const { address, init, network } = parseDeepLink(
  'ton://transfer/UQA...?init=te6ccgEBAwEAEQACATQBAgAI_____wAIAAAAAA'
)
// init: 'te6ccgEB...' (StateInit as base64 BOC)
```

### Expiration Time

```typescript
const { address, amount, exp, network } = parseDeepLink(
  'ton://transfer/UQA...?amount=1000000000&exp=1796015245'
)
// exp: '1796015245' (UNIX timestamp)
// Note: exp requires amount to be present
```

### Network Validation

```typescript
// Mainnet wallet - validate addresses
try {
  const result = parseDeepLink(
    'ton://transfer/kQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsIaw?amount=1',
    { network: 'mainnet' }
  )
} catch (error) {
  // Throws NetworkMismatchError
  // Testnet address (kQ...) can't be used in mainnet wallet
}

// Correct usage
const { address } = parseDeepLink(
  'ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1',
  { network: 'mainnet' }
)
// ✅ Mainnet address in mainnet wallet
```

### Restricted Mode

```typescript
// For wallets implementing only basic features
try {
  const result = parseDeepLink(
    'ton://transfer/UQA...?bin=te6...',
    { restricted: true }
  )
} catch (error) {
  // Throws LogicError: 'bin' not allowed in restricted mode
}

// Allowed in restricted mode
const { address, amount, text } = parseDeepLink(
  'ton://transfer/UQA...?amount=1000000000&text=Hello',
  { restricted: true }
)
// ✅ Only address, jetton, amount, text allowed
```

### Wallet-Specific Prefixes

```typescript
// ton:// is always supported
const result1 = parseDeepLink('ton://transfer/UQA...')
// ✅ Works

// Add custom prefixes for your wallet
const { address } = parseDeepLink(
  'tonkeeper://transfer/UQA...',
  {
    walletSpecificPrefixes: [
      'tonkeeper://',
      'https://app.tonkeeper.com/'
    ]
  }
)
// ✅ Both ton:// and custom prefixes work

// HTTPS deep link
const result2 = parseDeepLink(
  'https://app.tonkeeper.com/transfer/UQA...',
  {
    walletSpecificPrefixes: ['https://app.tonkeeper.com/']
  }
)
// ✅ Works
```

## Error Handling

The parser throws typed errors. All errors extend `DeepLinkError`:

```typescript
import {
  parseDeepLink,
  ParseError,
  FormatError,
  LogicError,
  ExpiredError,
  NetworkMismatchError
} from '@ton-deeplinks/parser'

try {
  const result = parseDeepLink(url, options)
} catch (error) {
  if (error instanceof ParseError) {
    // URL structure errors
    console.error('Parse error:', error.type)
    // Types: 'unknown-scheme', 'invalid-url', 'malformed-params'
  }

  if (error instanceof FormatError) {
    // Parameter format errors
    console.error('Format error:', error.type, error.param)
    // Types: 'invalid-boc', 'invalid-state-init', 'invalid-address',
    //        'invalid-amount', 'invalid-timestamp'
  }

  if (error instanceof LogicError) {
    // Parameter combination errors
    console.error('Logic error:', error.type, error.param)
    // Types: 'mutually-exclusive', 'missing-required', 'invalid-combination',
    //        'unknown-parameter', 'duplicate-parameter'
  }

  if (error instanceof ExpiredError) {
    // Transaction expired (exp < now)
    console.error('Transaction expired')
  }

  if (error instanceof NetworkMismatchError) {
    // Address network doesn't match wallet network
    console.error(`Expected ${error.expected}, got ${error.actual}`)
  }
}
```

### Error Types

**ParseError** (URL structure):
- `unknown-scheme` - Unsupported URL scheme
- `invalid-url` - Malformed URL structure
- `malformed-params` - Invalid query string format

**FormatError** (parameter format):
- `invalid-boc` - Invalid BOC format
- `invalid-state-init` - Invalid StateInit format
- `invalid-address` - Invalid address format (not friendly/raw/DNS)
- `invalid-amount` - Invalid amount (not positive integer, has decimals)
- `invalid-timestamp` - Invalid timestamp (not positive integer)

**LogicError** (parameter combinations):
- `mutually-exclusive` - `text` and `bin` both present
- `missing-required` - `exp` without `amount`
- `invalid-combination` - `init` with `jetton`, or restricted mode violation, or DNS on testnet
- `unknown-parameter` - Unknown parameter in URL
- `duplicate-parameter` - Same parameter specified multiple times

**ExpiredError**:
- `expired` - `exp` timestamp is in the past

**NetworkMismatchError**:
- `network-mismatch` - Address network doesn't match expected wallet network

## Validation Rules

### Format Validation

**Address formats:**
- Friendly: `UQ...`, `EQ...` (mainnet), `kQ...`, `0Q...` (testnet)
- Raw: `0:hex64`, `-1:hex64` (masterchain)
- DNS: `name.ton` (alphanumeric + hyphens, no leading/trailing hyphens)
- DNS not supported on testnet

**Amount:**
- Positive integer only (no decimals, no leading zeros)
- Maximum: `18446744073709551615` (uint64)

**Timestamp (exp):**
- Positive integer (UNIX seconds)
- Must be in the future

**BOC (bin):**
- Valid base64 encoding
- Valid BOC structure (validated with `@ton/core`)

**StateInit (init):**
- Valid base64 encoding
- Valid StateInit structure (validated with `@ton/core`)

### Logic Validation

**Mutually exclusive:**
- `text` XOR `bin` (never both)
- `address` XOR `dns` (never both)

**Dependencies:**
- `exp` requires `amount`

**Restrictions:**
- `init` not allowed with `jetton`
- In restricted mode: `bin`, `init`, `exp` forbidden
- DNS not allowed on testnet
- Unknown parameters always rejected
- Duplicate parameters rejected

**Network consistency:**
- When `options.network` specified: address network must match
- For jetton transfers: recipient and jetton addresses must have same network
- Raw addresses (`0:hex`) bypass network validation
- DNS addresses bypass network validation (assumed mainnet)

## Network Detection

Network is detected from friendly addresses:
- `UQ...`, `EQ...` → mainnet
- `kQ...`, `0Q...` → testnet
- `0:hex...` → undefined (raw address)
- `name.ton` → mainnet (DNS)

When `options.network` is specified, the parser validates that:
1. Address network matches expected wallet network
2. For jetton transfers, both recipient and jetton networks match

This prevents cross-network transactions (e.g., testnet address in mainnet wallet).

## Development

```bash
# Build
npm run build

# Run tests
npm test

# Watch mode
npm run dev
```

## License

MIT
