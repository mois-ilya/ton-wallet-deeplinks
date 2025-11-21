/**
 * TON Wallet Deep Link Parser
 * Parses URL → validates format → returns string parameters
 * Does NOT convert types or resolve DNS
 */

import { Address } from '@ton/core'
import type { ParserOptions, TransferParams, JettonTransferParams, TransferType } from './types.js'
import { ParseError, FormatError, LogicError } from './errors.js'
import {
  validateAddressFormat,
  validateAmountFormat,
  validateBOCFormat,
  validateStateInitFormat,
  validateTimestampFormat,
  extractNetworkFromAddress,
} from './validators.js'

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse a TON wallet transfer deep link
 *
 * Returns validated parameters (all strings):
 * - address: string (friendly, raw, or DNS)
 * - amount: string (atomic units)
 * - text: string (comment)
 * - bin: string (base64 BOC)
 * - init: string (base64 BOC, TON only)
 * - exp: string (UNIX timestamp)
 * - jetton: string (jetton master address)
 *
 * Does NOT:
 * - Resolve DNS (returns "wallet.ton" as-is)
 * - Convert types (no Address, Cell, bigint)
 * - Build transactions
 *
 * @throws ParseError - Invalid URL structure
 * @throws FormatError - Invalid parameter format
 * @throws LogicError - Invalid parameter combination
 * @throws ExpiredError - Transaction expired
 */
export function parseDeepLink(
  url: string,
  options: ParserOptions = {}
): TransferParams {
  // 1. Detect and validate scheme
  const base = detectDeepLinkBase(url, options)
  if (!base) {
    throw new ParseError(
      'unknown-scheme',
      `Unsupported URL scheme. Expected ton:// or wallet-specific prefixes`
    )
  }

  // 2. Remove base prefix and split into path and query
  const withoutBase = url.substring(base.length)

  // Check for transfer/ prefix
  if (!withoutBase.startsWith('transfer/')) {
    throw new ParseError('invalid-url', `URL must start with ${base}transfer/`)
  }

  const withoutTransfer = withoutBase.substring('transfer/'.length)
  const [addressPart, queryString] = withoutTransfer.split('?')

  if (!addressPart) {
    throw new FormatError('invalid-address', 'Address is required in URL path', 'address')
  }

  // 3. Parse query parameters
  const params = parseQueryParams(queryString || '')

  // Check for duplicate parameters
  const duplicateError = checkDuplicateParams(queryString || '')
  if (duplicateError) {
    throw duplicateError
  }

  // Add address/dns to params (distinguish DNS from regular address)
  const decodedAddress = decodeURIComponent(addressPart)
  const isDns = decodedAddress.endsWith('.ton')

  const allParams: Record<string, string> = {
    ...(isDns ? { dns: decodedAddress } : { address: decodedAddress }),
    ...params,
  }

  // 4. Determine transfer type (TON or Jetton)
  const isJetton = 'jetton' in allParams

  // 5. Check restricted mode
  if (options.restricted) {
    if (allParams.bin) {
      throw new LogicError('invalid-combination', 'bin parameter is not allowed in restricted mode', 'bin')
    }
    if (allParams.init) {
      throw new LogicError('invalid-combination', 'init parameter is not allowed in restricted mode', 'init')
    }
    if (allParams.exp) {
      throw new LogicError('invalid-combination', 'exp parameter is not allowed in restricted mode', 'exp')
    }
  }

  // 6. Validate parameter combinations and formats
  const validationError = validateTransferParams(allParams, isJetton ? 'jetton' : 'ton', options)
  if (validationError) {
    throw validationError
  }

  // 7. Determine network from addresses
  const recipientAddress = isDns ? allParams.dns : allParams.address
  const recipientIsFriendly = Address.isFriendly(recipientAddress)
  const jettonIsFriendly = isJetton && allParams.jetton ? Address.isFriendly(allParams.jetton) : false

  // Extract networks from friendly addresses
  const recipientNetwork = recipientIsFriendly ? extractNetworkFromAddress(recipientAddress) : null
  const jettonNetwork = jettonIsFriendly ? extractNetworkFromAddress(allParams.jetton!) : null

  // Check network consistency for jetton transfers (only if both are friendly)
  if (recipientNetwork && jettonNetwork && recipientNetwork !== jettonNetwork) {
    throw new LogicError(
      'invalid-combination',
      `Recipient network (${recipientNetwork}) doesn't match jetton network (${jettonNetwork})`,
      'jetton'
    )
  }

  // Final network: friendly address → options → default mainnet
  const network = recipientNetwork ?? jettonNetwork ?? options.network ?? 'mainnet'

  // 8. Build and return typed parameters (all strings)
  if (isJetton) {
    // Jetton transfer - set dns or address (mutually exclusive)
    const result: Partial<JettonTransferParams> = isDns
      ? { dns: allParams.dns, jetton: allParams.jetton, network }
      : { address: allParams.address, jetton: allParams.jetton, network }

    // Optional fields
    if (allParams.amount !== undefined) result.amount = allParams.amount
    if (allParams.text !== undefined) result.text = allParams.text
    if (allParams.bin !== undefined && !options.restricted) result.bin = allParams.bin
    if (allParams.exp !== undefined && !options.restricted) result.exp = allParams.exp

    return result as JettonTransferParams
  } else {
    // TON transfer - set dns or address (mutually exclusive)
    const result: Partial<TransferParams> = isDns
      ? { dns: allParams.dns, network }
      : { address: allParams.address, network }

    // Optional fields
    if (allParams.amount !== undefined) result.amount = allParams.amount
    if (allParams.text !== undefined) result.text = allParams.text
    if (allParams.bin !== undefined && !options.restricted) result.bin = allParams.bin
    if (allParams.init !== undefined && !options.restricted) result.init = allParams.init
    if (allParams.exp !== undefined && !options.restricted) result.exp = allParams.exp

    return result as TransferParams
  }
}

// ============================================================================
// URL Parsing Utilities
// ============================================================================

/**
 * Parse query parameters from query string
 * Correctly handles multiple '=' in values (e.g., text=foo=bar)
 */
function parseQueryParams(queryString: string): Record<string, string> {
  if (!queryString) return {}

  const params: Record<string, string> = {}
  const pairs = queryString.split('&')

  for (const pair of pairs) {
    if (!pair) continue

    // Use indexOf to handle multiple '=' correctly
    const eqIndex = pair.indexOf('=')
    if (eqIndex === -1) {
      // Parameter without value: skip
      continue
    }

    const key = pair.substring(0, eqIndex)
    const value = pair.substring(eqIndex + 1)

    if (!key || key.trim() === '') continue

    params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : ''
  }

  return params
}

/**
 * Check for duplicate parameters in query string
 */
function checkDuplicateParams(queryString: string): LogicError | null {
  if (!queryString) return null

  const seen = new Set<string>()
  const pairs = queryString.split('&')

  for (const pair of pairs) {
    if (!pair) continue

    const [key] = pair.split('=')
    if (!key) continue

    const decodedKey = decodeURIComponent(key)
    if (seen.has(decodedKey)) {
      return new LogicError('duplicate-parameter', `Duplicate parameter: ${decodedKey}`, decodedKey)
    }
    seen.add(decodedKey)
  }

  return null
}

/**
 * Detect deep link base from URL
 * URL schemes are case-insensitive per RFC 3986
 */
function detectDeepLinkBase(url: string, options: ParserOptions): string | null {
  // Always support ton://
  const allPrefixes = ['ton://', ...(options.walletSpecificPrefixes ?? [])]

  // URL schemes are case-insensitive
  const urlLower = url.toLowerCase()

  for (const prefix of allPrefixes) {
    const prefixLower = prefix.toLowerCase()
    if (urlLower.startsWith(prefixLower)) {
      // Return the original prefix format from options, not the lowercased one
      return prefix
    }
  }

  return null
}

// ============================================================================
// Parameter Validation
// ============================================================================

/**
 * Validate transfer parameters according to the standard
 * All validations work with strings (no type conversion)
 */
function validateTransferParams(
  params: Record<string, string>,
  type: TransferType,
  options: ParserOptions
): Error | null {
  // Known parameters (dns and address are mutually exclusive)
  const knownParams = ['address', 'dns', 'amount', 'text', 'bin', 'init', 'exp', 'jetton']

  // Check for unknown parameters (always strict)
  for (const key of Object.keys(params)) {
    if (!knownParams.includes(key)) {
      return new LogicError('unknown-parameter', `Unknown parameter: ${key}`, key)
    }
  }

  // Check mutually exclusive: text and bin
  if (params.text !== undefined && params.bin !== undefined) {
    return new LogicError('mutually-exclusive', 'text and bin parameters are mutually exclusive', 'text')
  }

  // Check exp requires amount
  if (params.exp !== undefined && params.amount === undefined) {
    return new LogicError('missing-required', 'exp parameter requires amount to be specified', 'exp')
  }

  // Check init not allowed with jetton
  if (type === 'jetton' && params.init !== undefined) {
    return new LogicError('invalid-combination', 'init parameter is not allowed for jetton transfers', 'init')
  }

  // Validate formats (strings only, no parsing)
  // Check either address or dns (mutually exclusive)
  if (params.address !== undefined) {
    const addressError = validateAddressFormat(params.address, options)
    if (addressError) return addressError
  } else if (params.dns !== undefined) {
    const dnsError = validateAddressFormat(params.dns, options)
    if (dnsError) return dnsError
  }

  if (params.amount !== undefined) {
    const amountError = validateAmountFormat(params.amount)
    if (amountError) return amountError
  }

  if (params.bin !== undefined) {
    const binError = validateBOCFormat(params.bin)
    if (binError) return binError
  }

  if (params.init !== undefined) {
    const initError = validateStateInitFormat(params.init)
    if (initError) return initError
  }

  if (params.exp !== undefined) {
    const expError = validateTimestampFormat(params.exp)
    if (expError) return expError
  }

  // Validate jetton master address (format and network)
  if (params.jetton !== undefined) {
    const jettonError = validateAddressFormat(params.jetton, options)
    if (jettonError) return jettonError
  }

  return null
}
