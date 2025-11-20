/**
 * Parser tests - Basic Parsing Functionality
 * Tests for basic parsing, jetton transfers, and DNS format validation
 */

import { describe, test, expect } from 'vitest'
import { parseDeepLink } from '../../src/parser'
import type { TransferParams, JettonTransferParams } from '../../src/types.js'

describe('Parser - Basic Parsing (Strings Only)', () => {
  describe('ton:// scheme', () => {
    test('should parse simple TON transfer', () => {
      const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')

      // Result should have address only (no amount = send-screen)
      expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
      expect(result.amount).toBeUndefined()
      expect('jetton' in result).toBe(false)
    })

    test('should parse TON transfer with amount', () => {
      const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000')

      expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
      expect(result.amount).toBe('1000000000') // STRING, not bigint
      expect('jetton' in result).toBe(false)
    })

    test('should parse TON transfer with text comment', () => {
      const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=Hello')

      expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
      expect(result.amount).toBe('1000000000')
      expect('text' in result && result.text).toBe('Hello')
      expect('bin' in result).toBe(false)
    })

    test('should parse TON transfer with bin payload', () => {
      const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&bin=te6cckEBAQEACQAADgAAAABiaW793PSE')

      expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
      expect(result.amount).toBe('1000000000')
      expect('bin' in result && result.bin).toBe('te6cckEBAQEACQAADgAAAABiaW793PSE') // STRING, not Cell
      expect('text' in result).toBe(false)
    })

    test('should parse TON transfer with exp', () => {
      const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&exp=1796015245')

      expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
      expect(result.amount).toBe('1000000000')
      expect('exp' in result && result.exp).toBe('1796015245') // STRING, not number
    })

    test('should parse TON transfer with init (StateInit)', () => {
      const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&init=te6cckEBAgEABwACATQBAQAAw3VFVg==')

      expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
      expect(result.amount).toBe('1000000000')
      expect('init' in result && result.init).toBe('te6cckEBAgEABwACATQBAQAAw3VFVg==') // STRING, not Cell
    })

    test('should parse raw address format', () => {
      const result = parseDeepLink('ton://transfer/0:6593630f7e87a51b5a6bb53f5d1b1bea7efcdf2428c676e98b1e1c30576ab0d4')

      expect(result.address).toBe('0:6593630f7e87a51b5a6bb53f5d1b1bea7efcdf2428c676e98b1e1c30576ab0d4')
    })

    test('should parse TON DNS address (without resolution)', () => {
      const result = parseDeepLink('ton://transfer/wallet.ton?amount=1000000000')

      // Parser should return DNS as-is (NOT resolve it)
      expect(result.dns).toBe('wallet.ton')
      expect(result.amount).toBe('1000000000')
    })
  })

  describe('wallet-specific prefixes', () => {
    test('should parse tonkeeper:// scheme', () => {
      const result = parseDeepLink('tonkeeper://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000', {
        walletSpecificPrefixes: ['tonkeeper://']
      })

      expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
      expect(result.amount).toBe('1000000000')
    })

    test('should parse https://app.tonkeeper.com/ universal link', () => {
      const result = parseDeepLink('https://app.tonkeeper.com/transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000', {
        walletSpecificPrefixes: ['https://app.tonkeeper.com/']
      })

      expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
      expect(result.amount).toBe('1000000000')
    })
  })

  describe('case-insensitive URL schemes', () => {
    test('should accept TON:// (uppercase)', () => {
      const result = parseDeepLink('TON://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000')

      expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    })

    test('should accept Ton:// (mixed case)', () => {
      const result = parseDeepLink('Ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000')

      expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    })
  })
})

describe('Parser - Jetton Transfers', () => {
  test('should parse jetton transfer (no amount)', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs') as JettonTransferParams

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.jetton).toBe('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')
    expect(result.amount).toBeUndefined()
  })

  test('should parse jetton transfer with amount', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&amount=1000000000') as JettonTransferParams

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.jetton).toBe('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')
    expect(result.amount).toBe('1000000000') // STRING
  })

  test('should parse jetton transfer with text', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&amount=1000000000&text=Hello') as JettonTransferParams

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.jetton).toBe('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')
    expect('text' in result && result.text).toBe('Hello')
  })

  test('should parse jetton transfer with bin', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&bin=te6cckEBAQEACQAADgAAAABiaW793PSE') as JettonTransferParams

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.jetton).toBe('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')
    expect('bin' in result && result.bin).toBe('te6cckEBAQEACQAADgAAAABiaW793PSE')
  })
})

describe('Parser - DNS Format Validation', () => {
  test('should accept valid .ton DNS name', () => {
    const result = parseDeepLink('ton://transfer/wallet.ton?amount=1000000000')

    expect(result.dns).toBe('wallet.ton')
  })

  test('should accept .ton DNS with hyphens', () => {
    const result = parseDeepLink('ton://transfer/my-wallet.ton?amount=1000000000')

    expect(result.dns).toBe('my-wallet.ton')
  })

  test('should accept .ton DNS with numbers', () => {
    const result = parseDeepLink('ton://transfer/wallet123.ton?amount=1000000000')

    expect(result.dns).toBe('wallet123.ton')
  })

  test('should throw on invalid DNS format (empty name)', () => {
    expect(() => {
      parseDeepLink('ton://transfer/.ton?amount=1000000000')
    }).toThrow('Invalid DNS name format')
  })

  test('should throw on invalid DNS format (special chars)', () => {
    expect(() => {
      parseDeepLink('ton://transfer/wallet@test.ton?amount=1000000000')
    }).toThrow('Invalid DNS name format')
  })

  test('should throw on DNS with hyphen at start', () => {
    expect(() => {
      parseDeepLink('ton://transfer/-wallet.ton?amount=1000000000')
    }).toThrow('Invalid DNS name format')
  })

  test('should throw on DNS with hyphen at end', () => {
    expect(() => {
      parseDeepLink('ton://transfer/wallet-.ton?amount=1000000000')
    }).toThrow('Invalid DNS name format')
  })

  test('should accept DNS name in uppercase with lowercase .ton', () => {
    const result = parseDeepLink('ton://transfer/WALLET.ton?amount=1000000000')
    expect(result.dns).toBe('WALLET.ton')
  })

  test('should accept DNS with mixed case', () => {
    const result = parseDeepLink('ton://transfer/MyWallet.ton?amount=1000000000')
    expect(result.dns).toBe('MyWallet.ton')
  })

  test('should accept single-character DNS', () => {
    const result = parseDeepLink('ton://transfer/a.ton?amount=1000000000')
    expect(result.dns).toBe('a.ton')
  })

  test('should accept DNS with hyphen in middle', () => {
    const result = parseDeepLink('ton://transfer/my-awesome-wallet.ton?amount=1000000000')
    expect(result.dns).toBe('my-awesome-wallet.ton')
  })
})

describe('Parser - Address Formats', () => {
  test('should accept masterchain address (workchain -1)', () => {
    const masterchainAddress = '-1:6593630f7e87a51b5a6bb53f5d1b1bea7efcdf2428c676e98b1e1c30576ab0d4'
    const result = parseDeepLink(`ton://transfer/${masterchainAddress}?amount=1000000000`)

    expect(result.address).toBe(masterchainAddress)
  })

  test('should accept testnet bounceable address (kQ prefix)', () => {
    const testnetBounceable = 'kQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfB-P'
    const result = parseDeepLink(`ton://transfer/${testnetBounceable}?amount=1000000000`)

    expect(result.address).toBe(testnetBounceable)
  })
})
