/**
 * TON Wallet Deep Link Parser - Validation Utilities
 * Internal validators that return Error | null for use in parser
 */

import { Cell, Address, loadStateInit } from '@ton/core'
import { FormatError, ExpiredError, NetworkMismatchError, LogicError } from './errors.js'
import type { ParserOptions, Network } from './types.js'

/**
 * Validate address format (friendly, raw, or DNS) using @ton/core
 * Also validates network for friendly addresses if options.network is provided
 */
export function validateAddressFormat(
  address: string,
  options?: ParserOptions
): FormatError | NetworkMismatchError | LogicError | null {
  // 1. Check for empty address
  if (!address || address.trim() === '') {
    return new FormatError('invalid-address', 'Address cannot be empty', 'address')
  }

  // 2. TON DNS validation (custom - no @ton/core support)
  if (address.endsWith('.ton')) {
    const name = address.substring(0, address.length - 4)
    // DNS name must start and end with alphanumeric, hyphens only in middle
    // Allows single character names (e.g., 'a.ton')
    if (!name || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(name)) {
      return new FormatError('invalid-address', `Invalid DNS name format: ${address}`, 'address')
    }

    // DNS is not supported on testnet
    if (options?.network === 'testnet') {
      return new LogicError(
        'invalid-combination',
        'DNS addresses (.ton domains) are not supported on testnet',
        'address'
      )
    }

    return null // DNS - no network validation possible
  }

  // 3. Try parsing as friendly address (includes checksum validation)
  if (Address.isFriendly(address)) {
    const parsed = Address.parseFriendly(address)

    const optionsNetwork = options?.network
    const addressNetwork = parsed.isTestOnly ? 'testnet' : 'mainnet'

    if (optionsNetwork && addressNetwork !== optionsNetwork) {
      return new NetworkMismatchError(
        `Address network (${addressNetwork}) doesn't match expected network (${optionsNetwork})`,
        optionsNetwork,
        addressNetwork,
        'address'
      )
    }

    return null
  }

  if (Address.isRaw(address)) {
    return null // Raw address - no network validation possible
  }

  // 5. Not DNS, not friendly, not raw - invalid format
  return new FormatError('invalid-address', `Invalid address format: ${address}`, 'address')
}

/**
 * Validate amount format (string of digits, must be positive)
 */
export function validateAmountFormat(amount: string): FormatError | null {
  if (!amount) {
    return new FormatError('invalid-amount', 'amount cannot be empty', 'amount')
  }

  // Must be digits only
  if (!/^\d+$/.test(amount)) {
    return new FormatError('invalid-amount', 'amount must be a positive integer without decimals', 'amount')
  }

  // amount must be positive (0 is not allowed)
  if (amount === '0') {
    return new FormatError('invalid-amount', 'amount must be greater than 0', 'amount')
  }

  // No leading zeros
  if (amount.startsWith('0')) {
    return new FormatError('invalid-amount', 'amount cannot have leading zeros', 'amount')
  }

  // Check uint64 max (2^64 - 1 = 18446744073709551615)
  const UINT64_MAX = '18446744073709551615'
  if (amount.length > UINT64_MAX.length || (amount.length === UINT64_MAX.length && amount > UINT64_MAX)) {
    return new FormatError('invalid-amount', 'amount must be a valid uint64 (maximum 18446744073709551615)', 'amount')
  }

  return null
}

/**
 * Validate BOC format using @ton/core Cell parsing
 */
export function validateBOCFormat(boc: string): FormatError | null {
  if (!boc || boc.trim() === '') {
    return new FormatError('invalid-boc', 'BOC cannot be empty', 'bin')
  }

  // Use @ton/core for proper BOC validation (magic bytes, structure, etc.)
  try {
    Cell.fromBase64(boc)
    return null
  } catch (error) {
    return new FormatError('invalid-boc', `Invalid BOC format: ${boc}`, 'bin')
  }
}

/**
 * Validate StateInit format using @ton/core
 * Validates both BOC structure and StateInit content
 */
export function validateStateInitFormat(stateInit: string): FormatError | null {
  if (!stateInit || stateInit.trim() === '') {
    return new FormatError('invalid-state-init', 'StateInit cannot be empty', 'init')
  }

  // Validate full StateInit structure (code/data/library fields)
  try {
    const cell = Cell.fromBase64(stateInit)
    loadStateInit(cell.beginParse()) // Full StateInit validation
    return null
  } catch (error) {
    return new FormatError('invalid-state-init', `Invalid StateInit format: ${stateInit}`, 'init')
  }
}

/**
 * Validate timestamp format and check expiration
 */
export function validateTimestampFormat(timestamp: string): FormatError | ExpiredError | null {
  if (!timestamp) {
    return new FormatError('invalid-timestamp', 'timestamp cannot be empty', 'exp')
  }

  // Must be digits only
  if (!/^\d+$/.test(timestamp)) {
    return new FormatError('invalid-timestamp', 'timestamp must be a positive integer', 'exp')
  }

  const value = Number(timestamp)

  // Check if expired
  const now = Math.floor(Date.now() / 1000)
  if (value < now) {
    return new ExpiredError(`Transaction expired. exp=${value}, now=${now}`, 'exp')
  }

  return null
}

/**
 * Extract network from address for parser return value
 * - Friendly address: detect from isTestOnly flag → 'mainnet' | 'testnet'
 * - Raw address: return undefined (caller defaults to mainnet)
 * - DNS: return undefined (caller defaults to mainnet)
 */
export function extractNetworkFromAddress(address: string): Network {
  // Friendly address - extract network from isTestOnly flag
  if (Address.isFriendly(address) && Address.parseFriendly(address).isTestOnly) {
    return 'testnet'
  }

  // Raw address or DNS - return mainnet
  return 'mainnet'
}
