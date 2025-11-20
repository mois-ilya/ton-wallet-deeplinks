/**
 * Type-level tests for TON Wallet Deep Link Parser
 *
 * Strategy: Test types directly, not through instance objects
 * - Use Type['field'] to test field types
 * - Use Extract<> to isolate union variants
 * - Use .not.toMatchTypeOf() for negative tests
 * - NO @ts-expect-error directives
 * - NO instance object field checks (they don't work for optional never fields)
 */

import { describe, test, expectTypeOf } from 'vitest'
import type {
  TransferParams,
  JettonTransferParams,
  SendScreenTransaction,
  ConfirmationScreenTransaction,
  RestrictedSendScreenTransaction,
  RestrictedConfirmationScreenTransaction,
  TransferResult,
  ParseResult,
  RestrictedParseResult,
} from '../src/types.js'

describe('TransferParams - text/bin mutual exclusivity', () => {
  test('type with both text and bin is not assignable', () => {
    type WithBoth = { address: string; text: string; bin: string }
    expectTypeOf<WithBoth>().not.toMatchTypeOf<TransferParams>()
  })
})

describe('TransferParams - exp requires amount', () => {
  test('type with exp but no amount is not assignable', () => {
    type ExpNoAmount = { address: string; exp: string }
    expectTypeOf<ExpNoAmount>().not.toMatchTypeOf<TransferParams>()
  })
})

describe('TransferParams - amount type', () => {
  test('amount in TransferParams is string (from URL)', () => {
    type AmountType = NonNullable<TransferParams['amount']>
    expectTypeOf<AmountType>().toEqualTypeOf<string>()
  })
})

describe('JettonTransferParams - init forbidden', () => {
  test('init field is never', () => {
    expectTypeOf<JettonTransferParams['init']>().toEqualTypeOf<never | undefined>()
  })

  test('type with init is not assignable', () => {
    type WithInit = { address: string; jetton: string; init: string }
    expectTypeOf<WithInit>().not.toMatchTypeOf<JettonTransferParams>()
  })

  test('jetton field is required', () => {
    expectTypeOf<JettonTransferParams['jetton']>().toEqualTypeOf<string>()
  })
})

describe('SendScreenTransaction - amount and validUntil forbidden', () => {
  test('amount field is never', () => {
    expectTypeOf<SendScreenTransaction['amount']>().toEqualTypeOf<never | undefined>()
  })

  test('validUntil field is never', () => {
    expectTypeOf<SendScreenTransaction['validUntil']>().toEqualTypeOf<never | undefined>()
  })

  test('type with amount is not assignable', () => {
    type WithAmount = { address: string; amount: bigint }
    expectTypeOf<WithAmount>().not.toMatchTypeOf<SendScreenTransaction>()
  })

  test('type with validUntil is not assignable', () => {
    type WithValidUntil = { address: string; validUntil: number }
    expectTypeOf<WithValidUntil>().not.toMatchTypeOf<SendScreenTransaction>()
  })
})

describe('ConfirmationScreenTransaction - amount required as bigint', () => {
  test('amount field is required bigint', () => {
    expectTypeOf<ConfirmationScreenTransaction['amount']>().toEqualTypeOf<bigint>()
  })

  test('amount is not optional', () => {
    expectTypeOf<ConfirmationScreenTransaction['amount']>().not.toEqualTypeOf<bigint | undefined>()
  })

  test('type without amount is not assignable', () => {
    type NoAmount = { address: string }
    expectTypeOf<NoAmount>().not.toMatchTypeOf<ConfirmationScreenTransaction>()
  })

  test('type with string amount is not assignable', () => {
    type StringAmount = { address: string; amount: string }
    expectTypeOf<StringAmount>().not.toMatchTypeOf<ConfirmationScreenTransaction>()
  })

  test('validUntil is optional number', () => {
    expectTypeOf<ConfirmationScreenTransaction['validUntil']>().toEqualTypeOf<number | undefined>()
  })
})

describe('RestrictedSendScreenTransaction - amount, stateInit, validUntil forbidden', () => {
  test('amount field is never', () => {
    expectTypeOf<RestrictedSendScreenTransaction['amount']>().toEqualTypeOf<never | undefined>()
  })

  test('stateInit field is never', () => {
    expectTypeOf<RestrictedSendScreenTransaction['stateInit']>().toEqualTypeOf<never | undefined>()
  })

  test('validUntil field is never', () => {
    expectTypeOf<RestrictedSendScreenTransaction['validUntil']>().toEqualTypeOf<never | undefined>()
  })

  test('type with amount is not assignable', () => {
    type WithAmount = { address: string; amount: bigint }
    expectTypeOf<WithAmount>().not.toMatchTypeOf<RestrictedSendScreenTransaction>()
  })

  test('type with stateInit is not assignable', () => {
    type WithStateInit = { address: string; stateInit: string }
    expectTypeOf<WithStateInit>().not.toMatchTypeOf<RestrictedSendScreenTransaction>()
  })

  test('type with validUntil is not assignable', () => {
    type WithValidUntil = { address: string; validUntil: number }
    expectTypeOf<WithValidUntil>().not.toMatchTypeOf<RestrictedSendScreenTransaction>()
  })
})

describe('RestrictedConfirmationScreenTransaction - amount required, stateInit and validUntil forbidden', () => {
  test('amount field is required bigint', () => {
    expectTypeOf<RestrictedConfirmationScreenTransaction['amount']>().toEqualTypeOf<bigint>()
  })

  test('amount is not optional', () => {
    expectTypeOf<RestrictedConfirmationScreenTransaction['amount']>().not.toEqualTypeOf<bigint | undefined>()
  })

  test('stateInit field is never', () => {
    expectTypeOf<RestrictedConfirmationScreenTransaction['stateInit']>().toEqualTypeOf<never | undefined>()
  })

  test('validUntil field is never', () => {
    expectTypeOf<RestrictedConfirmationScreenTransaction['validUntil']>().toEqualTypeOf<never | undefined>()
  })

  test('type without amount is not assignable', () => {
    type NoAmount = { address: string }
    expectTypeOf<NoAmount>().not.toMatchTypeOf<RestrictedConfirmationScreenTransaction>()
  })

  test('type with stateInit is not assignable', () => {
    type WithStateInit = { address: string; amount: bigint; stateInit: string }
    expectTypeOf<WithStateInit>().not.toMatchTypeOf<RestrictedConfirmationScreenTransaction>()
  })
})

describe('TransferResult - screen mode discrimination', () => {
  test('send-screen variant has SendScreenTransaction', () => {
    type SendResult = Extract<TransferResult, { screenMode: 'send-screen' }>
    expectTypeOf<SendResult['transaction']>().toMatchTypeOf<SendScreenTransaction>()
    expectTypeOf<SendResult['screenMode']>().toEqualTypeOf<'send-screen'>()
  })

  test('confirmation-screen variant has ConfirmationScreenTransaction', () => {
    type ConfirmResult = Extract<TransferResult, { screenMode: 'confirmation-screen' }>
    expectTypeOf<ConfirmResult['transaction']>().toMatchTypeOf<ConfirmationScreenTransaction>()
    expectTypeOf<ConfirmResult['screenMode']>().toEqualTypeOf<'confirmation-screen'>()
  })

  test('confirmation-screen transaction has required bigint amount', () => {
    type ConfirmResult = Extract<TransferResult, { screenMode: 'confirmation-screen' }>
    expectTypeOf<ConfirmResult['transaction']['amount']>().toEqualTypeOf<bigint>()
  })

  test('send-screen transaction has amount as never', () => {
    type SendResult = Extract<TransferResult, { screenMode: 'send-screen' }>
    expectTypeOf<SendResult['transaction']['amount']>().toEqualTypeOf<never | undefined>()
  })
})

describe('ParseResult - XOR pattern', () => {
  test('variant with transfer has error as never', () => {
    type WithTransfer = Extract<ParseResult, { transfer: TransferResult }>
    expectTypeOf<WithTransfer['error']>().toEqualTypeOf<never | undefined>()
  })

  test('variant with error has transfer as never', () => {
    type WithError = Extract<ParseResult, { error: any }>
    expectTypeOf<WithError['transfer']>().toEqualTypeOf<never | undefined>()
  })

  test('type with both transfer and error is not assignable', () => {
    type WithBoth = { transfer: TransferResult; error: any }
    expectTypeOf<WithBoth>().not.toMatchTypeOf(expectTypeOf<ParseResult>())
  })
})

describe('RestrictedParseResult - XOR pattern', () => {
  test('variant with transfer has error as never', () => {
    type WithTransfer = Extract<RestrictedParseResult, { transfer: any }>
    expectTypeOf<WithTransfer['error']>().toEqualTypeOf<never | undefined>()
  })

  test('variant with error has transfer as never', () => {
    type WithError = Extract<RestrictedParseResult, { error: any }>
    expectTypeOf<WithError['transfer']>().toEqualTypeOf<never | undefined>()
  })
})

describe('Network type', () => {
  test('BaseTransactionRequest network field is optional Network', () => {
    type NetworkType = NonNullable<SendScreenTransaction['network']>
    expectTypeOf<NetworkType>().toEqualTypeOf<'mainnet' | 'testnet'>()
  })

  test('network field can be undefined', () => {
    expectTypeOf<SendScreenTransaction['network']>().toEqualTypeOf<'mainnet' | 'testnet' | undefined>()
    expectTypeOf<ConfirmationScreenTransaction['network']>().toEqualTypeOf<'mainnet' | 'testnet' | undefined>()
  })

  test('ParserOptions network field is optional Network', () => {
    type OptionsNetworkType = NonNullable<import('../src/types.js').ParserOptions['network']>
    expectTypeOf<OptionsNetworkType>().toEqualTypeOf<'mainnet' | 'testnet'>()
  })

  test('network type with wrong value is not assignable', () => {
    type WrongNetwork = { address: import('@ton/core').Address; network: 'invalid' }
    expectTypeOf<WrongNetwork>().not.toMatchTypeOf<SendScreenTransaction>()
  })
})
