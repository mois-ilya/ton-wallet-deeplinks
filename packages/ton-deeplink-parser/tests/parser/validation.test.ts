/**
 * Parser tests - Validation Errors
 * Tests for validation errors that should throw exceptions
 */

import { describe, test, expect } from 'vitest'
import { parseDeepLink } from '../../src/parser'
import type { TransferParams, JettonTransferParams } from '../../src/types.js'
import { FormatError, NetworkMismatchError } from '../../src/errors'

describe('Parser - Validation Errors (Throws)', () => {
  test('should throw on text + bin (mutually exclusive)', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=hello&bin=te6cckEBAQEACQAADgAAAABiaW793PSE')
    }).toThrow('mutually exclusive')
  })

  test('should throw on exp without amount', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?exp=1796015245')
    }).toThrow('exp parameter requires amount')
  })

  test('should throw on init with jetton', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&init=te6cckEBAgEABwACATQBAQAAw3VFVg==')
    }).toThrow('init parameter is not allowed for jetton transfers')
  })

  test('should throw on unknown parameter', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&foo=bar')
    }).toThrow('Unknown parameter: foo')
  })

  test('should throw on duplicate parameters', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=100&amount=200')
    }).toThrow('Duplicate parameter: amount')
  })

  test('should throw on invalid address format', () => {
    expect(() => {
      parseDeepLink('ton://transfer/invalid-address?amount=1000000000')
    }).toThrow('Invalid address format')
  })

  test('should throw on empty address', () => {
    expect(() => {
      parseDeepLink('ton://transfer/?amount=1000000000')
    }).toThrow('Address is required in URL path')
  })

  test('should throw on invalid amount format (letters)', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=abc')
    }).toThrow('amount must be a positive integer')
  })

  test('should throw on invalid amount format (decimals)', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1.5')
    }).toThrow('amount must be a positive integer')
  })

  test('should throw on amount with leading zeros', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=0123')
    }).toThrow('amount cannot have leading zeros')
  })

  test('should throw on invalid BOC format', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&bin=invalid!!!')
    }).toThrow('Invalid BOC format')
  })

  test('should throw on invalid timestamp format', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&exp=abc')
    }).toThrow('timestamp must be a positive integer')
  })

  test('should throw on expired transaction', () => {
    // Use timestamp from 2020 (definitely expired)
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&exp=1600000000')
    }).toThrow('Transaction expired')
  })

  test('should throw on unknown URL scheme', () => {
    expect(() => {
      parseDeepLink('unknown://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    }).toThrow('Unsupported URL scheme')
  })

  test('should throw on invalid URL structure (no transfer/)', () => {
    expect(() => {
      parseDeepLink('ton://UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    }).toThrow('URL must start with ton://transfer/')
  })

  // Empty parameters
  test('should throw on empty amount parameter', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=')
    }).toThrow('amount cannot be empty')
  })

  test('should throw on empty bin parameter', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&bin=')
    }).toThrow('BOC cannot be empty')
  })

  test('should throw on empty init parameter', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&init=')
    }).toThrow('StateInit cannot be empty')
  })

  test('should throw on empty exp parameter', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&exp=')
    }).toThrow('timestamp cannot be empty')
  })

  // Jetton address validation
  test('should throw on invalid jetton address format', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=invalid&amount=1000000')
    }).toThrow(FormatError)
  })

  test('should throw on jetton address with wrong network (testnet in mainnet)', () => {
    const testnetJetton = 'kQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwpAK'
    expect(() => {
      parseDeepLink(`ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=${testnetJetton}&amount=1000000`, {
        network: 'mainnet',
      })
    }).toThrow(NetworkMismatchError)
  })

  test('should throw on jetton address with wrong network (mainnet in testnet)', () => {
    const mainnetJetton = 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA'
    expect(() => {
      parseDeepLink(`ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=${mainnetJetton}&amount=1000000`, {
        network: 'testnet',
      })
    }).toThrow(NetworkMismatchError)
  })

  // Amount edge cases
  test('should throw on amount with leading zeros (000)', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=000')
    }).toThrow('amount cannot have leading zeros')
  })

  test('should throw on amount with leading zero (01)', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=01')
    }).toThrow('amount cannot have leading zeros')
  })

  test('should throw on negative amount', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=-100')
    }).toThrow('amount must be a positive integer')
  })

  test('should throw on amount with spaces', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=100%20000') // URL-encoded space
    }).toThrow('amount must be a positive integer')
  })

  test('should throw on amount in scientific notation', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1e9')
    }).toThrow('amount must be a positive integer')
  })

  test('should throw on amount in hex', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=0x100')
    }).toThrow('amount must be a positive integer')
  })

  // Network validation
  test('should reject testnet address in mainnet wallet', () => {
    const testnetAddress = 'kQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfB-P'
    expect(() => {
      parseDeepLink(`ton://transfer/${testnetAddress}?amount=1000000000`, {
        network: 'mainnet',
      })
    }).toThrow(NetworkMismatchError)
  })

  test('should reject mainnet address in testnet wallet', () => {
    const mainnetAddress = 'EQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfKQF'
    expect(() => {
      parseDeepLink(`ton://transfer/${mainnetAddress}?amount=1000000000`, {
        network: 'testnet',
      })
    }).toThrow(NetworkMismatchError)
  })

  test('should throw NetworkMismatchError with correct details (testnet in mainnet)', () => {
    const testnetAddress = 'kQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfB-P'
    try {
      parseDeepLink(`ton://transfer/${testnetAddress}?amount=1000000000`, {
        network: 'mainnet',
      })
      expect.fail('Should have thrown NetworkMismatchError')
    } catch (error) {
      expect(error).toBeInstanceOf(NetworkMismatchError)
      if (error instanceof NetworkMismatchError) {
        expect(error.expected).toBe('mainnet')
        expect(error.actual).toBe('testnet')
        expect(error.param).toBe('address')
        expect(error.type).toBe('network-mismatch')
      }
    }
  })

  test('should throw NetworkMismatchError with correct details (mainnet in testnet)', () => {
    const mainnetAddress = 'EQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfKQF'
    try {
      parseDeepLink(`ton://transfer/${mainnetAddress}?amount=1000000000`, {
        network: 'testnet',
      })
      expect.fail('Should have thrown NetworkMismatchError')
    } catch (error) {
      expect(error).toBeInstanceOf(NetworkMismatchError)
      if (error instanceof NetworkMismatchError) {
        expect(error.expected).toBe('testnet')
        expect(error.actual).toBe('mainnet')
        expect(error.param).toBe('address')
      }
    }
  })

  test('should reject testnet jetton recipient in mainnet wallet', () => {
    const testnetAddress = 'kQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfB-P'
    const jettonAddress = 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA'
    expect(() => {
      parseDeepLink(
        `ton://transfer/${testnetAddress}?amount=1000000&jetton=${jettonAddress}`,
        { network: 'mainnet' }
      )
    }).toThrow(NetworkMismatchError)
  })

  test('should validate network for address-only transfer (no amount)', () => {
    const testnetAddress = 'kQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfB-P'
    expect(() => {
      parseDeepLink(`ton://transfer/${testnetAddress}`, { network: 'mainnet' })
    }).toThrow(NetworkMismatchError)
  })

  test('should validate network with text comment', () => {
    const testnetAddress = 'kQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfB-P'
    expect(() => {
      parseDeepLink(`ton://transfer/${testnetAddress}?amount=1000000000&text=Hello`, {
        network: 'mainnet',
      })
    }).toThrow(NetworkMismatchError)
  })

  test('should validate network with bin payload', () => {
    const testnetAddress = 'kQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfB-P'
    expect(() => {
      parseDeepLink(
        `ton://transfer/${testnetAddress}?amount=1000000000&bin=te6cckEBAQEACQAADgAAAABiaW793PSE`,
        { network: 'mainnet' }
      )
    }).toThrow(NetworkMismatchError)
  })

  test('should validate network with init', () => {
    const testnetAddress = 'kQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfB-P'
    expect(() => {
      parseDeepLink(
        `ton://transfer/${testnetAddress}?amount=1000000000&init=te6cckEBAgEABwACATQBAQAAw3VFVg==`,
        { network: 'mainnet' }
      )
    }).toThrow(NetworkMismatchError)
  })

  test('should accept raw address with network option (no validation possible)', () => {
    const rawAddress = '0:6593630f7e87a51b5a6bb53f5d1b1bea7efcdf2428c676e98b1e1c30576ab0d4'
    const result = parseDeepLink(`ton://transfer/${rawAddress}?amount=1000000000`, {
      network: 'mainnet',
    })

    expect(result.address).toBe(rawAddress)
    expect(result.amount).toBe('1000000000')
  })

  test('should accept DNS address with network option (no validation possible)', () => {
    const result = parseDeepLink('ton://transfer/wallet.ton?amount=1000000000', {
      network: 'mainnet',
    })

    expect(result.dns).toBe('wallet.ton')
    expect(result.amount).toBe('1000000000')
  })
})

describe('Parser - DNS on Testnet (Not Supported)', () => {
  test('should reject DNS address with network: testnet', () => {
    expect(() => {
      parseDeepLink('ton://transfer/wallet.ton?amount=1000000000', {
        network: 'testnet',
      })
    }).toThrow('DNS addresses (.ton domains) are not supported on testnet')
  })

  test('should reject DNS address with network: testnet (no amount)', () => {
    expect(() => {
      parseDeepLink('ton://transfer/wallet.ton', { network: 'testnet' })
    }).toThrow('DNS addresses (.ton domains) are not supported on testnet')
  })

  test('should accept DNS address with network: mainnet', () => {
    const result = parseDeepLink('ton://transfer/wallet.ton?amount=1000000000', {
      network: 'mainnet',
    })

    expect(result.dns).toBe('wallet.ton')
    expect(result.network).toBe('mainnet')
  })

  test('should accept DNS address with no network option (defaults mainnet)', () => {
    const result = parseDeepLink('ton://transfer/wallet.ton?amount=1000000000')

    expect(result.dns).toBe('wallet.ton')
    expect(result.network).toBe('mainnet')
  })
})

describe('Parser - Jetton Network Consistency', () => {
  test('should reject jetton transfer with mismatched networks (mainnet recipient, testnet jetton)', () => {
    const mainnetAddress = 'EQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfKQF'
    const testnetJetton = 'kQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwpAK'

    expect(() => {
      parseDeepLink(`ton://transfer/${mainnetAddress}?jetton=${testnetJetton}&amount=1000000`)
    }).toThrow(`Recipient network (mainnet) doesn't match jetton network (testnet)`)
  })

  test('should reject jetton transfer with mismatched networks (testnet recipient, mainnet jetton)', () => {
    const testnetAddress = 'kQAHKcE7bfLAfL8KAaqtj00r0VPPTIOwbzY-1xtJQgShfB-P'
    const mainnetJetton = 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA'

    expect(() => {
      parseDeepLink(`ton://transfer/${testnetAddress}?jetton=${mainnetJetton}&amount=1000000`)
    }).toThrow(`Recipient network (testnet) doesn't match jetton network (mainnet)`)
  })
})
