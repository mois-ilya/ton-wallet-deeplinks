/**
 * Parser Type Definitions
 * Types for URL parsing and validation (string-only, no @ton/core)
 */

/**
 * Transfer type
 */
export type TransferType = 'ton' | 'jetton'

// ============================================================================
// Recipient Types - DNS or Address (Mutually Exclusive)
// ============================================================================

/**
 * DNS-based recipient (.ton domain)
 * When present, address field must not be used
 */
export interface DnsRecipient {
  /** TON DNS domain (e.g., "wallet.ton") */
  dns: string
  /** Forbidden when dns is present */
  address?: never
}

/**
 * Address-based recipient (friendly or raw format)
 * When present, dns field must not be used
 */
export interface AddressRecipient {
  /** Recipient address (friendly: UQ/EQ/kQ/0Q or raw: 0:hex64) */
  address: string
  /** Forbidden when address is present */
  dns?: never
}

/**
 * Recipient union - either DNS or address, never both
 * This enforces the mutual exclusion at type level
 */
export type Recipient = DnsRecipient | AddressRecipient

// ============================================================================
// Payload Types - Text XOR Binary (Mutually Exclusive)
// ============================================================================

/**
 * Payload variant: text comment
 * When text is present, bin must not be used
 */
export interface TextPayload {
  /** Transfer comment (mutually exclusive with bin) */
  text?: string
  /** Forbidden when text is present */
  bin?: never
}

/**
 * Payload variant: binary BOC
 * When bin is present, text must not be used
 */
export interface BinaryPayload {
  /** Binary payload as base64 BoC (mutually exclusive with text) */
  bin?: string
  /** Forbidden when bin is present */
  text?: never
}

/**
 * Payload variant: no payload
 * Neither text nor bin is present
 */
export interface NoPayload {
  /** Forbidden when no payload */
  text?: never
  /** Forbidden when no payload */
  bin?: never
}

/**
 * Payload union - text, bin, or neither (never both)
 * This enforces the text XOR bin constraint at type level
 */
export type Payload = TextPayload | BinaryPayload | NoPayload

// ============================================================================
// Amount Types - Exp Requires Amount
// ============================================================================

/**
 * Amount without expiration
 * Amount is optional, exp is forbidden
 */
export interface AmountWithoutExp {
  /** Amount in nanotons (TON) or token atomic units (Jetton) */
  amount?: string
  /** Forbidden when exp is not needed */
  exp?: never
}

/**
 * Amount with expiration
 * When exp is present, amount becomes required (exp requires amount)
 */
export interface AmountWithExp {
  /** Amount in atomic units (required when exp is present) */
  amount: string
  /** Valid-until timestamp in UNIX seconds (requires amount) */
  exp?: string
}

/**
 * Amount params union - either with or without expiration
 * This enforces the "exp requires amount" constraint at type level
 */
export type AmountParams = AmountWithoutExp | AmountWithExp

// ============================================================================
// Transfer Parameters Types - TON and Jetton
// ============================================================================

/**
 * TON transfer parameters
 * - Can have init (StateInit)
 * - Cannot have jetton
 * - Combines Recipient + Payload + Amount constraints
 */
export type TonTransferParams = Recipient &
  Payload &
  AmountParams & {
    /** StateInit as base64 (TON only, not allowed for Jettons) */
    init?: string
    /** Forbidden for TON transfers */
    jetton?: never
  }

/**
 * Jetton transfer parameters
 * - Must have jetton (master contract address)
 * - Cannot have init (StateInit forbidden for Jettons)
 * - Combines Recipient + Payload + Amount constraints
 */
export type JettonTransferParams = Recipient &
  Payload &
  AmountParams & {
    /** Jetton master contract address (required for jetton transfers) */
    jetton: string
    /** StateInit is forbidden for Jetton transfers */
    init?: never
  }

/**
 * Combined transfer parameters - TON or Jetton
 * This is the main type returned by the parser
 */
export type TransferParams = TonTransferParams | JettonTransferParams

// ============================================================================
// Restricted Mode Types - Limited Feature Set
// ============================================================================

/**
 * Restricted TON transfer parameters (basic features only)
 * - Only text payload allowed (no bin)
 * - No StateInit (init)
 * - No expiration (exp)
 * - Can use DNS or address
 */
export type RestrictedTonTransferParams = Recipient &
  TextPayload &
  AmountWithoutExp & {
    /** Forbidden in restricted mode */
    init?: never
    /** Forbidden for TON transfers */
    jetton?: never
  }

/**
 * Restricted Jetton transfer parameters
 * - Only text payload allowed (no bin)
 * - No expiration (exp)
 * - Must have jetton
 * - Can use DNS or address
 */
export type RestrictedJettonTransferParams = Recipient &
  TextPayload &
  AmountWithoutExp & {
    /** Jetton master contract address (required for jetton transfers) */
    jetton: string
    /** Forbidden in restricted mode */
    init?: never
  }

/**
 * Combined restricted transfer parameters
 */
export type RestrictedTransferParams =
  | RestrictedTonTransferParams
  | RestrictedJettonTransferParams

// ============================================================================
// Parser Options
// ============================================================================

/**
 * Network type (used in validation)
 */
export type Network = 'mainnet' | 'testnet'

/**
 * Parser options
 */
export interface ParserOptions {
  /**
   * Restricted mode - only basic features (default: false)
   * - true: Only address, jetton, amount, text are allowed
   * - false: All features including bin, init, exp are allowed
   *
   * When restricted=true, bin, init, and exp parameters will be rejected with LogicError
   */
  restricted?: boolean

  /**
   * Wallet-specific deep link URL prefixes (optional)
   *
   * Additional URL prefixes supported by the wallet in addition to the universal 'ton://'.
   * The 'ton://' prefix is always supported by default and should NOT be included in this array.
   *
   * Examples:
   * - Tonkeeper: ['tonkeeper://', 'https://app.tonkeeper.com/']
   * - Custom wallet: ['mywallet://', 'https://app.mywallet.com/']
   *
   * When parsing, the parser accepts 'ton://' + any prefixes listed here.
   * When generating links, use 'ton://' for universal compatibility or wallet-specific prefix for direct app links.
   */
  walletSpecificPrefixes?: string[]

  /**
   * Expected network type for validation (optional)
   *
   * When specified, validates that the address network matches the expected network.
   * - If address is friendly and network doesn't match: throws LogicError
   * - If address is raw (no network info): no validation performed
   * - If not specified: no network validation, just extracts network from address
   *
   * Use this to prevent users from sending transactions to wrong network
   * (e.g., testnet address in mainnet wallet).
   *
   * Examples:
   * - Mainnet wallet: { network: 'mainnet' }
   * - Testnet wallet: { network: 'testnet' }
   */
  network?: Network
}
