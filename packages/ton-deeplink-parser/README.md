# @ton-deeplinks/parser

Reference implementation of TON Wallet Deep Link Parser based on the [TON Wallet Deep Links Standard](../../standart.md).

## Features

- ✅ Parse `ton://`, `tonkeeper://`, and `https://` schemes
- ✅ Validate all parameters according to the standard
- ✅ Detect screen mode (send-screen vs confirmation-screen)
- ✅ TypeScript-first with full type definitions
- ✅ XOR pattern for type-safe results
- ✅ Typed error hierarchy with semantic grouping
- ✅ Restricted mode for basic feature set

## Installation

```bash
npm install @ton-deeplinks/parser
```

## Usage

### Transfer Links

```typescript
import { parseDeepLink } from '@ton-deeplinks/parser'

// Parse a transfer deep link (full mode - default)
const result = parseDeepLink(
  'ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=Hello'
)

// XOR pattern - only one field is defined
if (result.error) {
  console.error('Parse error:', result.error.message)
  console.error('Error type:', result.error.type)
} else {
  console.log('Screen mode:', result.transfer.screenMode)
  console.log('Transaction:', result.transfer.transaction)

  // TypeScript discriminates based on screenMode
  if (result.transfer.screenMode === 'confirmation-screen') {
    // TypeScript knows this is ConfirmationScreenResult
    // amount is guaranteed to be bigint (not undefined)
    console.log('Amount:', result.transfer.transaction.amount)
  } else {
    // TypeScript knows this is SendScreenResult
    // amount is never (user will enter it in UI)
    // result.transfer.transaction.amount is not accessible
  }
}
```

### Type Safety Examples

```typescript
import { parseDeepLink } from '@ton-deeplinks/parser'

// Example 1: Mutually exclusive text/bin
const params1 = {
  address: "UQA...",
  text: "hello",
  bin: "te6..." // ❌ TypeScript error: text and bin are mutually exclusive
}

// Example 2: exp requires amount
const params2 = {
  address: "UQA...",
  exp: "1796015245" // ❌ TypeScript error: exp requires amount
}

// ✅ Correct
const params3 = {
  address: "UQA...",
  amount: "1000000000",
  exp: "1796015245"
}

// Example 3: Screen mode guarantees
const result = parseDeepLink('ton://transfer/UQA...?amount=100')
if (result.transfer && result.transfer.screenMode === 'confirmation-screen') {
  const amount: bigint = result.transfer.transaction.amount // ✅ guaranteed to exist as bigint
}
```

### Error Handling

```typescript
import { FormatError, LogicError, ExpiredError } from '@ton-deeplinks/parser'

const result = parseDeepLink(url)

if (result.error) {
  if (result.error instanceof FormatError) {
    switch (result.error.type) {
      case 'invalid-boc':
        console.error('Invalid BOC format')
        break
      case 'invalid-address':
        console.error('Invalid address')
        break
    }
  }

  if (result.error instanceof LogicError) {
    switch (result.error.type) {
      case 'mutually-exclusive':
        console.error('text and bin cannot be used together')
        break
      case 'missing-required':
        console.error('exp requires amount')
        break
    }
  }

  if (result.error instanceof ExpiredError) {
    console.error('Transaction expired')
  }
}
```

### Restricted Mode

```typescript
// For wallets implementing basic feature set only
const result = parseDeepLink(url, {
  restricted: true  // Only address, jetton, amount, text
})

// TypeScript enforces restricted types!
if (result.transfer) {
  const tx = result.transfer.transaction
  // ✅ tx.address is available
  // ✅ tx.amount is available
  // ✅ tx.payload is available (text only)
  // ❌ tx.stateInit is never (TypeScript error if you try to access)
  // ❌ tx.validUntil is never (TypeScript error if you try to access)

  // Params also restricted
  const params = result.transfer.params
  // ✅ params.text is available
  // ❌ params.bin is never (TypeScript prevents usage)
  // ❌ params.init is never
  // ❌ params.exp is never
}

// bin, init, exp parameters will be rejected with LogicError at runtime
// TypeScript prevents them at compile time in restricted mode
```

### Jetton Transfers

```typescript
// Jetton transfer
const result = parseDeepLink('ton://transfer/UQA...?jetton=EQC...&amount=1000000000')

if (result.transfer) {
  // Check if it's a jetton transfer
  if ('jetton' in result.transfer.params) {
    const jettonParams = result.transfer.params
    console.log('Jetton master:', jettonParams.jetton)

    // ❌ TypeScript error: init is forbidden for jetton transfers
    // jettonParams.init will cause compile error
  }
}
```

### Deep Link Bases

```typescript
// ton:// is always supported by default
const result1 = parseDeepLink('ton://transfer/UQA...')
// ✅ Works without any options

// Tonkeeper adds its wallet-specific deep link bases
const result2 = parseDeepLink('tonkeeper://transfer/UQA...', {
  walletSpecificPrefixes: [
    'tonkeeper://',
    'https://app.tonkeeper.com/'
  ]
  // ton:// is implicitly supported, no need to include it
})

// Custom wallet with its own deep link bases
const result3 = parseDeepLink('https://app.mywallet.com/transfer/UQA...', {
  walletSpecificPrefixes: [
    'mywallet://',
    'https://app.mywallet.com/'
  ]
  // ton:// always works in addition to these
})

// Summary:
// - ton:// is universal and always supported (implicit)
// - walletSpecificPrefixes adds wallet-specific bases on top of ton://
// - Don't include 'ton://' in walletSpecificPrefixes array
```

### Network Detection and Validation

The parser automatically detects network type (mainnet/testnet) from friendly addresses and can validate against the wallet's network to prevent cross-network transactions.

```typescript
// Network is extracted from friendly address
const mainnetResult = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdtnJ44cMFdqsIaw?amount=1')
console.log(mainnetResult.transfer?.transaction.network) // 'mainnet'

const testnetResult = parseDeepLink('ton://transfer/0QAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdtnJ44cMFdqsD06?amount=1')
console.log(testnetResult.transfer?.transaction.network) // 'testnet'

const rawResult = parseDeepLink('ton://transfer/0:1964d8f037e87a51b5a6bb53f5d1b1bea7efcdfc94a319db67278e1c30576ab0?amount=1')
console.log(rawResult.transfer?.transaction.network) // undefined (raw address has no network info)

// Validate against wallet's network
const mainnetWallet = parseDeepLink('ton://transfer/UQA...?amount=1', {
  network: 'mainnet' // ✅ OK - address matches wallet network
})

const testnetAddressInMainnetWallet = parseDeepLink('ton://transfer/0QA...?amount=1', {
  network: 'mainnet' // ❌ Error - testnet address in mainnet wallet
})
// Error: Address network 'testnet' does not match expected network 'mainnet'

// Raw addresses bypass network validation (wallet uses current network mode)
const rawInMainnet = parseDeepLink('ton://transfer/0:...?amount=1', {
  network: 'mainnet' // ✅ OK - raw addresses have no network info
})
```

**Important:**
- **Bounceable flag is ALWAYS ignored** - wallet decides bounceable value based on its logic
- **Network validation prevents cross-network sends** - testnet address can't be used in mainnet wallet
- **Raw addresses** have no network info and bypass validation

## API

### `parseDeepLink(url: string, options?: ParserOptions): ParseResult`

Parse and validate a TON wallet transfer deep link.

**Options:**
- `restricted` - Restricted mode: only basic features (default: `false`)
- `walletSpecificPrefixes` - Wallet-specific deep link bases in addition to `ton://` (optional, e.g., `['tonkeeper://', 'https://app.tonkeeper.com/']`)
- `network` - Expected network type for validation (optional: `'mainnet' | 'testnet'`). Validates address network matches wallet network to prevent cross-network transactions

**Returns:** ParseResult with XOR pattern
- `{ transfer: TransferResult }` - Valid transfer link
- `{ error: DeepLinkError }` - Parse/validation error

### Types

Types are organized hierarchically with enforced constraints:

```typescript
// ============ BASE TYPE (main) ============

interface BaseTransactionRequest {
  address: string
  amount?: bigint  // Parsed from string in URL
  payload?: string
  stateInit?: string
  validUntil?: number  // Parsed from exp parameter
}

// ============ MODIFIERS (derived from base) ============

// Send-screen: amount forbidden (not in URL), validUntil forbidden
type SendScreenTransaction = Omit<BaseTransactionRequest, 'amount' | 'validUntil'> & {
  amount?: never
  validUntil?: never
}

// Confirmation-screen: amount required
type ConfirmationScreenTransaction = Omit<BaseTransactionRequest, 'amount'> & {
  amount: bigint
}

// Restricted send-screen: amount forbidden, no stateInit, no validUntil
type RestrictedSendScreenTransaction = Omit<BaseTransactionRequest, 'amount' | 'stateInit' | 'validUntil'> & {
  amount?: never
  stateInit?: never
  validUntil?: never
}

// Restricted confirmation-screen: amount required, no stateInit, no validUntil
type RestrictedConfirmationScreenTransaction = Omit<BaseTransactionRequest, 'stateInit' | 'validUntil'> & {
  amount: bigint
  stateInit?: never
  validUntil?: never
}

// ============ UNIONS ============

type TransactionRequest = SendScreenTransaction | ConfirmationScreenTransaction
type RestrictedTransactionRequest = RestrictedSendScreenTransaction | RestrictedConfirmationScreenTransaction

// ============ TRANSFER PARAMETERS (with constraints) ============

// text and bin are mutually exclusive
type TransferParams = BaseTransferParams &
  (TextPayload | BinaryPayload | NoPayload) &
  (AmountWithoutExp | AmountWithExp)  // exp requires amount

// Restricted params: only text allowed (no bin, init, exp)
type RestrictedTransferParams = BaseTransferParams &
  TextPayload &
  AmountWithoutExp & {
    init?: never
  }

// ============ RESULTS (discriminated by screen mode) ============

interface SendScreenResult {
  screenMode: 'send-screen'
  transaction: SendScreenTransaction
  params: TransferParams | JettonTransferParams
}

interface ConfirmationScreenResult {
  screenMode: 'confirmation-screen'
  transaction: ConfirmationScreenTransaction
  params: TransferParams | JettonTransferParams
}

type TransferResult = SendScreenResult | ConfirmationScreenResult

// Restricted results
type RestrictedTransferResult = RestrictedSendScreenResult | RestrictedConfirmationScreenResult

// ============ PARSE RESULTS (XOR pattern) ============

type ParseResult =
  | { transfer: TransferResult; error?: never }
  | { error: DeepLinkError; transfer?: never }

type RestrictedParseResult =
  | { transfer: RestrictedTransferResult; error?: never }
  | { error: DeepLinkError; transfer?: never }
```

**Key Type Safety Features:**

1. **Mutually Exclusive Fields**: `text` and `bin` cannot both be present
2. **Linked Constraints**: `exp` requires `amount` at type level
3. **Screen Mode Discrimination**: `screenMode: 'confirmation-screen'` guarantees `amount: bigint`
4. **Restricted Mode Enforcement**: `bin`, `init`, `exp` forbidden at compile time
5. **Type Parsing**: Amount parsed from `string` (URL) to `bigint` (transaction)

See [types.ts](./src/types.ts) for full type definitions.

## Error Hierarchy

### Format Errors
- `invalid-boc` - Invalid BOC format
- `invalid-state-init` - Invalid StateInit format
- `invalid-address` - Invalid address format
- `invalid-amount` - Invalid amount format
- `invalid-timestamp` - Invalid timestamp format

### Logic Errors
- `mutually-exclusive` - text and bin used together
- `missing-required` - exp without amount
- `invalid-combination` - init with jetton
- `unknown-parameter` - Unknown parameter (always strict)
- `duplicate-parameter` - Duplicate parameter

### Expired Error
- `expired` - Transaction expired (exp < current time)

### Parse Errors
- `unknown-scheme` - Unknown URI scheme
- `invalid-url` - Malformed URL
- `malformed-params` - Invalid parameter format

## Validation Rules

### Full Mode (default: restricted=false)
- ✅ `exp` requires `amount`
- ✅ `text` and `bin` are mutually exclusive
- ✅ `init` not allowed in Jetton transfers
- ✅ Amount must be non-negative integer
- ✅ Exp must be valid UNIX timestamp
- ✅ BOC and StateInit must be valid base64
- ✅ Address format validation
- ✅ Unknown parameters always rejected (strict by default)

### Restricted Mode (restricted=true)
Only supports: `address`, `jetton`, `amount`, `text`

Rejects: `bin`, `init`, `exp` with LogicError

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev
```

## License

MIT
