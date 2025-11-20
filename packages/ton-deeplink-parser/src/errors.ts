/**
 * TON Wallet Deep Link Parser - Error Definitions
 */

/**
 * Base class for all deep link errors
 */
export abstract class DeepLinkError extends Error {
  constructor(message: string, public readonly param?: string) {
    super(message)
    this.name = this.constructor.name
  }
}

/**
 * Format validation errors
 * Used when parameter value doesn't match expected format
 */
export class FormatError extends DeepLinkError {
  public readonly type:
    | 'invalid-boc'
    | 'invalid-state-init'
    | 'invalid-address'
    | 'invalid-amount'
    | 'invalid-timestamp'

  constructor(
    type: FormatError['type'],
    message: string,
    param?: string
  ) {
    super(message, param)
    this.type = type
  }
}

/**
 * Logic validation errors
 * Used when parameter combinations violate rules
 */
export class LogicError extends DeepLinkError {
  public readonly type:
    | 'mutually-exclusive'
    | 'missing-required'
    | 'invalid-combination'
    | 'unknown-parameter'
    | 'duplicate-parameter'

  constructor(
    type: LogicError['type'],
    message: string,
    param?: string
  ) {
    super(message, param)
    this.type = type
  }
}

/**
 * Expiration error
 * Used when exp parameter is in the past
 */
export class ExpiredError extends DeepLinkError {
  public readonly type: 'expired' = 'expired'

  constructor(message: string, param?: string) {
    super(message, param)
  }
}

/**
 * Parse errors
 * Used when URL structure is invalid
 */
export class ParseError extends DeepLinkError {
  public readonly type:
    | 'unknown-scheme'
    | 'invalid-url'
    | 'malformed-params'

  constructor(
    type: ParseError['type'],
    message: string,
    param?: string
  ) {
    super(message, param)
    this.type = type
  }
}

/**
 * Network mismatch error
 * Used when address network doesn't match expected wallet network
 */
export class NetworkMismatchError extends DeepLinkError {
  public readonly type: 'network-mismatch' = 'network-mismatch'

  constructor(
    message: string,
    public readonly expected: 'mainnet' | 'testnet',
    public readonly actual: 'mainnet' | 'testnet',
    param?: string
  ) {
    super(message, param)
  }
}
