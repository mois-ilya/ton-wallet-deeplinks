/**
 * Transaction Builder (Phase 2 - NOT IMPLEMENTED YET)
 *
 * Future responsibilities:
 * - Convert address string → Address (@ton/core)
 * - Convert amount string → bigint
 * - Convert text → Cell payload
 * - Convert bin/init → Cell
 * - Convert exp → validUntil number
 * - Resolve DNS (.ton domains)
 * - Determine screen mode
 * - Build TransactionRequest
 */

import type { TransferParams, JettonTransferParams, ParserOptions } from '../types'
import type { ParseResult } from './builder-types'

/**
 * Build a transaction request from validated parameters
 *
 * @param params - Validated transfer parameters (from parser)
 * @param options - Builder options
 * @returns Transaction request with @ton/core types
 *
 * TODO: Implement in Phase 2
 */
export function buildTransaction(
  params: TransferParams | JettonTransferParams,
  options?: ParserOptions
): ParseResult {
  throw new Error('Builder not implemented yet. Use parser only for now.')
}

/*
 * ============================================================================
 * OLD IMPLEMENTATION (COMMENTED OUT FOR PHASE 2)
 * ============================================================================
 *
 * This code was extracted from the monolithic parser.
 * It will be refactored and implemented in Phase 2.
 *
 * Key changes needed:
 * 1. Accept TransferParams (strings) as input
 * 2. Convert strings to @ton/core types (Address, Cell, bigint)
 * 3. Resolve DNS
 * 4. Build proper transaction types (SendScreenTransaction, ConfirmationScreenTransaction)
 * 5. Return ParseResult with XOR pattern
 *
 * ============================================================================
 */

/*
import { Address, Cell, beginCell } from '@ton/core'
import { FormatError, LogicError, ExpiredError } from '../errors.js'
import type { Network, BaseTransactionRequest } from '../types.js'

// Parse address and extract network type
function parseAddress(addressStr: string): { address: Address; network?: Network } {
  try {
    // Handle TON DNS
    if (addressStr.endsWith('.ton')) {
      const resolved = resolveDNS(addressStr)
      return parseAddress(resolved) // Recursive call with resolved address
    }

    // Check if friendly to extract network info
    if (Address.isFriendly(addressStr)) {
      const parsed = Address.parseFriendly(addressStr)
      const network: Network = parsed.isTestOnly ? 'testnet' : 'mainnet'
      return { address: parsed.address, network }
    }

    // Parse raw address (or throw)
    const address = Address.parse(addressStr)
    return { address, network: undefined }
  } catch (error) {
    // Re-throw FormatError, wrap others
    if (error instanceof FormatError) {
      throw error
    }
    throw new FormatError('invalid-address', `Invalid address format: ${addressStr}`, 'address')
  }
}

// Resolve TON DNS name to address
function resolveDNS(dnsName: string): string {
  // TODO: Implement actual DNS resolution
  // For now, validate format and return test address
  if (!dnsName.endsWith('.ton')) {
    throw new FormatError('invalid-address', `Invalid DNS name: ${dnsName}`, 'address')
  }

  const name = dnsName.substring(0, dnsName.length - 4)
  if (!name || !/^[a-z0-9-]+$/i.test(name)) {
    throw new FormatError('invalid-address', `Invalid DNS name format: ${dnsName}`, 'address')
  }

  // Mock: return a valid mainnet address for any valid DNS name
  return 'UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh'
}

// Build transaction request from parsed parameters
function buildTransaction(
  params: Record<string, string>,
  address: Address,
  network: Network | undefined,
  options: ParserOptions
): { transaction: BaseTransactionRequest; error?: FormatError | LogicError | ExpiredError } {
  const transaction: Partial<BaseTransactionRequest> = {
    address,
    network,
  }

  // Parse amount if present
  if (params.amount !== undefined) {
    const amountResult = parseAmount(params.amount)
    if (amountResult.error) {
      return {
        transaction: { address, network } as BaseTransactionRequest,
        error: amountResult.error,
      }
    }
    transaction.amount = amountResult.value
  }

  // Parse payload (text or bin)
  if (params.text !== undefined) {
    transaction.payload = beginCell().storeUint(0, 32).storeStringTail(params.text).endCell()
  } else if (params.bin !== undefined) {
    const payloadResult = parseBOC(params.bin, 'bin')
    if (payloadResult.error) {
      return {
        transaction: { address, network } as BaseTransactionRequest,
        error: payloadResult.error,
      }
    }
    transaction.payload = payloadResult.cell
  }

  // Parse stateInit if present
  if (params.init !== undefined) {
    const stateInitResult = parseStateInit(params.init)
    if (stateInitResult.error) {
      return {
        transaction: { address, network } as BaseTransactionRequest,
        error: stateInitResult.error,
      }
    }
    transaction.stateInit = stateInitResult.cell
  }

  // Parse exp (validUntil) if present
  if (params.exp !== undefined) {
    const expResult = parseTimestamp(params.exp)
    if (expResult.error) {
      return {
        transaction: { address, network } as BaseTransactionRequest,
        error: expResult.error,
      }
    }
    transaction.validUntil = expResult.value
  }

  return { transaction: transaction as BaseTransactionRequest }
}

// Parse amount string to bigint
function parseAmount(amountStr: string): { value: bigint; error?: FormatError } {
  try {
    if (!/^\d+$/.test(amountStr)) {
      return {
        value: 0n,
        error: new FormatError('invalid-amount', 'Amount must be a non-negative integer without decimals', 'amount'),
      }
    }

    const value = BigInt(amountStr)

    if (value < 0n) {
      return {
        value: 0n,
        error: new FormatError('invalid-amount', 'Amount must be non-negative', 'amount'),
      }
    }

    return { value }
  } catch (error) {
    return {
      value: 0n,
      error: new FormatError('invalid-amount', `Invalid amount format: ${amountStr}`, 'amount'),
    }
  }
}

// Parse BOC (base64) to Cell
function parseBOC(bocStr: string, paramName: string): { cell: Cell; error?: FormatError } {
  try {
    const cell = Cell.fromBase64(bocStr)
    return { cell }
  } catch (error) {
    return {
      cell: beginCell().endCell(),
      error: new FormatError('invalid-boc', `Invalid BOC format for ${paramName}: ${bocStr}`, paramName),
    }
  }
}

// Parse StateInit (base64) to Cell
function parseStateInit(stateInitStr: string): { cell: Cell; error?: FormatError } {
  try {
    const cell = Cell.fromBase64(stateInitStr)
    return { cell }
  } catch (error) {
    return {
      cell: beginCell().endCell(),
      error: new FormatError('invalid-state-init', `Invalid StateInit format: ${stateInitStr}`, 'init'),
    }
  }
}

// Parse timestamp string to number
function parseTimestamp(timestampStr: string): { value: number; error?: FormatError | ExpiredError } {
  try {
    if (!/^\d+$/.test(timestampStr)) {
      return {
        value: 0,
        error: new FormatError('invalid-timestamp', 'Timestamp must be a positive integer', 'exp'),
      }
    }

    const value = Number(timestampStr)

    // Check if expired
    const now = Math.floor(Date.now() / 1000)
    if (value < now) {
      return {
        value,
        error: new ExpiredError(`Transaction expired. exp=${value}, now=${now}`, 'exp'),
      }
    }

    return { value }
  } catch (error) {
    return {
      value: 0,
      error: new FormatError('invalid-timestamp', `Invalid timestamp format: ${timestampStr}`, 'exp'),
    }
  }
}

// Determine screen mode based on parameters
function determineScreenMode(params: Record<string, string>): ScreenMode {
  return params.amount !== undefined ? 'confirmation-screen' : 'send-screen'
}
*/
