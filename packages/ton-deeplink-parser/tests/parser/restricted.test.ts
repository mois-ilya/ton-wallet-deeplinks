/**
 * Parser tests - Restricted Mode
 * Tests for restricted mode functionality
 */

import { describe, test, expect } from 'vitest'
import { parseDeepLink } from '../../src/parser'
import type { TransferParams, JettonTransferParams } from '../../src/types.js'

describe('Parser - Restricted Mode', () => {
  test('should accept text in restricted mode', () => {
    const result = parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&text=Hello', {
      restricted: true
    })

    expect(result.address).toBe('UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh')
    expect('text' in result && result.text).toBe('Hello')
  })

  test('should throw on bin in restricted mode', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&bin=te6cckEBAQEACQAADgAAAABiaW793PSE', {
        restricted: true
      })
    }).toThrow('bin parameter is not allowed in restricted mode')
  })

  test('should throw on init in restricted mode', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&init=te6cckEBAgEABwACATQBAQAAw3VFVg==', {
        restricted: true
      })
    }).toThrow('init parameter is not allowed in restricted mode')
  })

  test('should throw on exp in restricted mode', () => {
    expect(() => {
      parseDeepLink('ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1000000000&exp=1796015245', {
        restricted: true
      })
    }).toThrow('exp parameter is not allowed in restricted mode')
  })
})
