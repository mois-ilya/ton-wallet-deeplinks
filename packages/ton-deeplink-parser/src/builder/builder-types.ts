/**
 * Builder Type Definitions (Phase 2 - NOT IMPLEMENTED)
 * Types for transaction building with @ton/core
 */

import type { DeepLinkError } from '../errors'
import type { TransferParams, JettonTransferParams, RestrictedTransferParams, RestrictedJettonTransferParams, Network } from '../types'
import { Address, Cell } from '@ton/core'

/**
 * Screen mode determined by parameters
 */
export type ScreenMode = 'send-screen' | 'confirmation-screen'

// ============================================================================
// Transaction Request Types - Hierarchical Structure
// ============================================================================

/**
 * BASE: Transaction request with all possible fields
 * This is the main type - all other types are modifications of this
 * Contains prepared fields ready for transaction building
 */
export interface BaseTransactionRequest {
  /** Recipient address (parsed Address object from @ton/core)
   * - Converted from raw/friendly string or TON DNS in URL
   */
  address: Address

  /** Network type extracted from address (optional)
   * - 'mainnet': Address is for production network
   * - 'testnet': Address is for test network
   * - undefined: Raw address without network info
   *
   * IMPORTANT: Bounceable flag from address is ALWAYS IGNORED.
   * Wallet should decide bounceable value based on its own logic.
   */
  network?: Network

  /** Amount in nanotons (TON) or token atomic units (Jetton)
   * - Parsed from string in URL to bigint
   * - Represents the exact amount in smallest units
   */
  amount?: bigint

  /** Cell payload - prepared field from URL parameters
   * - If text param: text comment encoded as Cell
   * - If bin param: binary payload decoded from base64 BoC and wrapped in Cell
   * - In restricted mode: only text-based payload allowed
   */
  payload?: Cell

  /** StateInit as Cell (parsed from base64 BoC in URL)
   * - TON only, not allowed for Jettons
   */
  stateInit?: Cell

  /** Valid-until timestamp in UNIX seconds
   * - Parsed from exp parameter (string → number)
   * - Represents UNIX timestamp when transaction expires
   */
  validUntil?: number
}

/**
 * MODIFIER: Send-screen transaction (editable)
 * - amount is forbidden (not in URL, user will enter)
 * - validUntil is forbidden (exp requires amount)
 */
export type SendScreenTransaction = Omit<BaseTransactionRequest, 'validUntil' | 'amount'> & {
  amount?: never
  validUntil?: never
}

/**
 * MODIFIER: Confirmation-screen transaction (non-editable)
 * - amount is required (present in URL)
 * - validUntil is allowed
 */
export type ConfirmationScreenTransaction = Omit<BaseTransactionRequest, 'amount'> & {
  amount: bigint
}

/**
 * MODIFIER: Restricted send-screen transaction (basic features only)
 * - amount is forbidden (not in URL, user will enter)
 * - stateInit is forbidden
 * - validUntil is forbidden
 */
export type RestrictedSendScreenTransaction = Omit<BaseTransactionRequest, 'amount' | 'stateInit' | 'validUntil'> & {
  amount?: never
  stateInit?: never
  validUntil?: never
}

/**
 * MODIFIER: Restricted confirmation-screen transaction (basic features only)
 * - amount is required (present in URL)
 * - stateInit is forbidden
 * - validUntil is forbidden
 */
export type RestrictedConfirmationScreenTransaction = Omit<BaseTransactionRequest, 'stateInit' | 'validUntil'> & {
  amount: bigint
  stateInit?: never
  validUntil?: never
}

/**
 * UNION: All restricted transaction request variants
 */
export type RestrictedTransactionRequest = RestrictedSendScreenTransaction | RestrictedConfirmationScreenTransaction

/**
 * UNION: All transaction request variants
 */
export type TransactionRequest = SendScreenTransaction | ConfirmationScreenTransaction

// ============================================================================
// Parse Result Types (Builder Output)
// ============================================================================

/**
 * Transfer parse result for send-screen mode
 */
export interface SendScreenResult {
  /** Screen mode (editable) */
  screenMode: 'send-screen'

  /** Transaction with optional amount */
  transaction: SendScreenTransaction

  /** Raw parameters from URL */
  params: TransferParams | JettonTransferParams
}

/**
 * Transfer parse result for confirmation-screen mode
 */
export interface ConfirmationScreenResult {
  /** Screen mode (non-editable) */
  screenMode: 'confirmation-screen'

  /** Transaction with required amount */
  transaction: ConfirmationScreenTransaction

  /** Raw parameters from URL */
  params: TransferParams | JettonTransferParams
}

/**
 * Transfer parse result (union of screen modes)
 */
export type TransferResult = SendScreenResult | ConfirmationScreenResult

/**
 * Restricted transfer parse result for send-screen mode
 */
export interface RestrictedSendScreenResult {
  /** Screen mode (editable) */
  screenMode: 'send-screen'

  /** Transaction with optional amount (restricted features) */
  transaction: RestrictedSendScreenTransaction

  /** Raw parameters from URL (restricted features) */
  params: RestrictedTransferParams | RestrictedJettonTransferParams
}

/**
 * Restricted transfer parse result for confirmation-screen mode
 */
export interface RestrictedConfirmationScreenResult {
  /** Screen mode (non-editable) */
  screenMode: 'confirmation-screen'

  /** Transaction with required amount (restricted features) */
  transaction: RestrictedConfirmationScreenTransaction

  /** Raw parameters from URL (restricted features) */
  params: RestrictedTransferParams | RestrictedJettonTransferParams
}

/**
 * Restricted transfer parse result (union of screen modes)
 */
export type RestrictedTransferResult = RestrictedSendScreenResult | RestrictedConfirmationScreenResult

/**
 * Parse result - XOR pattern (only one field is defined)
 * Full mode (all features)
 */
export type ParseResult =
  | { transfer: TransferResult; error?: never }
  | { error: DeepLinkError; transfer?: never }

/**
 * Parse result - XOR pattern (only one field is defined)
 * Restricted mode (basic features only)
 */
export type RestrictedParseResult =
  | { transfer: RestrictedTransferResult; error?: never }
  | { error: DeepLinkError; transfer?: never }
