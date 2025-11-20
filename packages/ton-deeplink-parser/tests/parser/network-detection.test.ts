/**
 * Parser tests - Network Detection
 * Tests that network field is always returned and correctly detected
 */

import { describe, test, expect } from 'vitest'
import { parseDeepLink } from '../../src/parser'

describe('Parser - Network Detection from Friendly Addresses', () => {
  test('should detect mainnet from EQ prefix', () => {
    const result = parseDeepLink('ton://transfer/EQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfKQF?amount=1000')
    expect(result.network).toBe('mainnet')
  })

  test('should detect mainnet from UQ prefix', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000')
    expect(result.network).toBe('mainnet')
  })

  test('should detect testnet from kQ prefix', () => {
    const result = parseDeepLink('ton://transfer/kQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfB-P?amount=1000')
    expect(result.network).toBe('testnet')
  })
})

describe('Parser - Network Default for Raw/DNS', () => {
  test('should default to mainnet for raw address', () => {
    const result = parseDeepLink('ton://transfer/0:6593630f7e87a51b5a6bb53f5d1b1bea7efcdf2428c676e98b1e1c30576ab0d4?amount=1000')
    expect(result.network).toBe('mainnet')
  })

  test('should default to mainnet for DNS address', () => {
    const result = parseDeepLink('ton://transfer/wallet.ton?amount=1000')
    expect(result.network).toBe('mainnet')
  })

  test('should use options.network for raw address if provided', () => {
    const result = parseDeepLink(
      'ton://transfer/0:6593630f7e87a51b5a6bb53f5d1b1bea7efcdf2428c676e98b1e1c30576ab0d4?amount=1000',
      { network: 'testnet' }
    )
    expect(result.network).toBe('testnet')
  })
})

describe('Parser - Jetton Network Detection', () => {
  test('should detect network from friendly recipient in jetton transfer', () => {
    const result = parseDeepLink(
      'ton://transfer/EQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfKQF?jetton=EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA&amount=1000'
    )
    expect(result.network).toBe('mainnet')
  })

  test('should detect network from friendly jetton when recipient is raw', () => {
    const result = parseDeepLink(
      'ton://transfer/0:6593630f7e87a51b5a6bb53f5d1b1bea7efcdf2428c676e98b1e1c30576ab0d4?jetton=kQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwpAK&amount=1000'
    )
    expect(result.network).toBe('testnet')
  })

  test('should default to mainnet for DNS recipient with raw jetton', () => {
    const rawJetton = '0:c5d209e76fa73987c78b3826ab63d34af454f3d320ec1bcd8fb5c6d24d082068'
    const result = parseDeepLink(
      `ton://transfer/wallet.ton?jetton=${rawJetton}&amount=1000`
    )
    expect(result.network).toBe('mainnet')
  })
})

describe('Parser - Network Field in All Scenarios', () => {
  test('should include network in send-screen transfer (no amount)', () => {
    const result = parseDeepLink('ton://transfer/EQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfKQF')
    expect(result.network).toBe('mainnet')
    expect(result.amount).toBeUndefined()
  })

  test('should include network with text comment', () => {
    const result = parseDeepLink('ton://transfer/kQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfB-P?amount=1000&text=Hello')
    expect(result.network).toBe('testnet')
  })

  test('should include network in restricted mode', () => {
    const result = parseDeepLink(
      'ton://transfer/EQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfKQF?amount=1000&text=Hi',
      { restricted: true }
    )
    expect(result.network).toBe('mainnet')
  })
})
