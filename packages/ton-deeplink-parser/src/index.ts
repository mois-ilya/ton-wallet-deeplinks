/**
 * @ton-deeplinks/parser
 *
 * Reference implementation of TON Wallet Deep Link Parser
 * Based on the TON Wallet Deep Links standard
 *
 * Phase 1: Parser only (string validation)
 * Phase 2: Builder (type conversion) - not implemented yet
 */

// Parser types (Phase 1)
export * from './types'

// Builder types (Phase 2 - for future use)
export * from './builder/builder-types'

// Errors
export * from './errors'

// Parser (Phase 1): URL → validated string parameters
export { parseDeepLink } from './parser'

// Builder (Phase 2): Parameters → transaction request (NOT IMPLEMENTED)
// export { buildTransaction } from './builder'

// Validators (keep for backward compatibility)
export * from './validators'
