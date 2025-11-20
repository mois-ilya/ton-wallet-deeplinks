/**
 * Parser tests - Edge Cases
 * Tests for query parameter handling, complex parameter combinations, and edge cases
 */

import { describe, test, expect } from 'vitest'
import { parseDeepLink } from '../../src/parser'
import type { TransferParams, JettonTransferParams } from '../../src/types.js'

describe('Parser - Query Parameter Handling', () => {
  test('should handle multiple = in text parameter', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=foo=bar=baz')

    expect('text' in result && result.text).toBe('foo=bar=baz')
  })

  test('should handle URL-encoded characters', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=Hello%20World%21')

    expect('text' in result && result.text).toBe('Hello World!')
  })

  test('should handle empty text parameter', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=')

    expect('text' in result && result.text).toBe('')
  })
})

describe('Parser - Complex Parameter Combinations', () => {
  test('should parse TON transfer with amount+text+exp', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=Payment&exp=1796015245')

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.amount).toBe('1000000000')
    expect('text' in result && result.text).toBe('Payment')
    expect('exp' in result && result.exp).toBe('1796015245')
  })

  test('should parse TON transfer with amount+init+exp', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&init=te6cckEBAgEABwACATQBAQAAw3VFVg==&exp=1796015245')

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.amount).toBe('1000000000')
    expect('init' in result && result.init).toBe('te6cckEBAgEABwACATQBAQAAw3VFVg==')
    expect('exp' in result && result.exp).toBe('1796015245')
  })

  test('should parse TON transfer with init+text (send-screen)', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?init=te6cckEBAgEABwACATQBAQAAw3VFVg==&text=Deploy')

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.amount).toBeUndefined()
    expect('init' in result && result.init).toBe('te6cckEBAgEABwACATQBAQAAw3VFVg==')
    expect('text' in result && result.text).toBe('Deploy')
  })

  test('should parse TON transfer with init+bin (send-screen)', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?init=te6cckEBAgEABwACATQBAQAAw3VFVg==&bin=te6cckEBAQEACQAADgAAAABiaW793PSE')

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.amount).toBeUndefined()
    expect('init' in result && result.init).toBe('te6cckEBAgEABwACATQBAQAAw3VFVg==')
    expect('bin' in result && result.bin).toBe('te6cckEBAQEACQAADgAAAABiaW793PSE')
  })

  test('should parse Jetton transfer with jetton+amount+exp', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&amount=1000000000&exp=1796015245') as JettonTransferParams

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.jetton).toBe('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')
    expect(result.amount).toBe('1000000000')
    expect('exp' in result && result.exp).toBe('1796015245')
  })

  test('should parse Jetton transfer with jetton+amount+bin+exp', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&amount=1000000000&bin=te6cckEBAQEACQAADgAAAABiaW793PSE&exp=1796015245') as JettonTransferParams

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.jetton).toBe('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')
    expect(result.amount).toBe('1000000000')
    expect('bin' in result && result.bin).toBe('te6cckEBAQEACQAADgAAAABiaW793PSE')
    expect('exp' in result && result.exp).toBe('1796015245')
  })
})

describe('Parser - Edge Cases', () => {
  test('should reject amount=0', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=0')
    }).toThrow('amount must be greater than 0')
  })

  test('should accept minimum valid amount (1 nanoton)', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1')

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.amount).toBe('1')
  })

  test('should accept very large amount (uint64 max)', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=18446744073709551615')

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.amount).toBe('18446744073709551615')
  })

  test('should reject amount exceeding uint64 max', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=99999999999999999999')
    }).toThrow('amount must be a valid uint64')
  })

  test('should throw on invalid init format', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&init=invalid-base64!!!')
    }).toThrow('Invalid StateInit format')
  })

  test('should accept parameters in any order', () => {
    const result1 = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&text=Hello')
    const result2 = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?text=Hello&amount=1')

    expect(result1).toEqual(result2)
  })

  test('should throw on wrong case parameter names', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?Amount=1000000000')
    }).toThrow('Unknown parameter: Amount')
  })

  test('should handle URL-encoded bin parameter', () => {
    const encoded = encodeURIComponent('te6cckEBAQEACQAADgAAAABiaW793PSE')
    const result = parseDeepLink(`ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&bin=${encoded}`)

    expect('bin' in result && result.bin).toBe('te6cckEBAQEACQAADgAAAABiaW793PSE')
  })

  test('should handle empty parameter values', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=')

    expect('text' in result && result.text).toBe('')
  })

  test('should handle trailing & in query string', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&')

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.amount).toBe('1000000000')
  })

  test('should handle leading & in query string', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?&amount=1000000000')

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.amount).toBe('1000000000')
  })

  test('should handle multiple && in query string', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&&&text=Hello')

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.amount).toBe('1000000000')
    expect('text' in result && result.text).toBe('Hello')
  })

  test('should accept very long text comment (1000+ characters)', () => {
    const longText = 'A'.repeat(1500)
    const encoded = encodeURIComponent(longText)
    const result = parseDeepLink(`ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=${encoded}`)

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect(result.amount).toBe('1000000000')
    expect('text' in result && result.text).toBe(longText)
    expect(result.text?.length).toBe(1500)
  })
})

describe('Parser - Send-Screen Scenarios', () => {
  const address = 'UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh'
  const jettonAddress = 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA'
  const validInit = 'te6cckEBAgEABwACATQBAQAAw3VFVg=='

  test('should accept jetton transfer with text but no amount (send-screen)', () => {
    const result = parseDeepLink(`ton://transfer/${address}?jetton=${jettonAddress}&text=Hello`)

    expect(result.address).toBe(address)
    expect('jetton' in result && result.jetton).toBe(jettonAddress)
    expect(result.text).toBe('Hello')
    expect(result.amount).toBeUndefined()
  })

  test('should accept jetton transfer with bin but no amount (send-screen)', () => {
    const result = parseDeepLink(
      `ton://transfer/${address}?jetton=${jettonAddress}&bin=te6cckEBAQEACQAADgAAAABiaW793PSE`
    )

    expect(result.address).toBe(address)
    expect('jetton' in result && result.jetton).toBe(jettonAddress)
    expect('bin' in result && result.bin).toBe('te6cckEBAQEACQAADgAAAABiaW793PSE')
    expect(result.amount).toBeUndefined()
  })

  test('should accept TON transfer with only init (send-screen for contract deployment)', () => {
    const result = parseDeepLink(`ton://transfer/${address}?init=${validInit}`)

    expect(result.address).toBe(address)
    expect('init' in result && result.init).toBe(validInit)
    expect(result.amount).toBeUndefined()
  })
})

describe('Parser - Unicode and Emoji in Text', () => {
  const address = 'UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh'

  test('should accept Chinese characters in text', () => {
    const chineseText = '中文'
    const encoded = encodeURIComponent(chineseText)
    const result = parseDeepLink(`ton://transfer/${address}?amount=1000000000&text=${encoded}`)

    expect(result.text).toBe(chineseText)
  })

  test('should accept emoji in text', () => {
    const emojiText = '😀🎉'
    const encoded = encodeURIComponent(emojiText)
    const result = parseDeepLink(`ton://transfer/${address}?amount=1000000000&text=${encoded}`)

    expect(result.text).toBe(emojiText)
  })

  test('should accept Cyrillic characters in text', () => {
    const cyrillicText = 'Привет'
    const encoded = encodeURIComponent(cyrillicText)
    const result = parseDeepLink(`ton://transfer/${address}?amount=1000000000&text=${encoded}`)

    expect(result.text).toBe(cyrillicText)
  })

  test('should accept mixed Unicode text', () => {
    const mixedText = 'Hello 你好 مرحبا 😀'
    const encoded = encodeURIComponent(mixedText)
    const result = parseDeepLink(`ton://transfer/${address}?amount=1000000000&text=${encoded}`)

    expect(result.text).toBe(mixedText)
  })
})
