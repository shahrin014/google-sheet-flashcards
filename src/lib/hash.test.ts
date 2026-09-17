import { describe, expect, it } from 'vitest'
import { hashString } from './hash'

describe('hashString', () => {
  it('is deterministic', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
    expect(hashString('')).toBe(hashString(''))
  })

  it('returns a short alphanumeric string', () => {
    expect(hashString('any input')).toMatch(/^[0-9a-z]+$/)
  })

  it('distinguishes different inputs', () => {
    const inputs = ['abc', 'abd', 'ab', 'ABC', ' a', 'a ']
    const hashes = inputs.map((s) => hashString(s))
    expect(new Set(hashes).size).toBe(inputs.length)
  })
})