import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSheet, normalizeSheetUrl } from './sheet'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('normalizeSheetUrl', () => {
  it('leaves URLs that already request CSV untouched', () => {
    const url = 'https://docs.google.com/spreadsheets/d/e/abc/pub?output=csv'
    expect(normalizeSheetUrl(url)).toBe(url)
    expect(normalizeSheetUrl('https://example.com/data?format=csv')).toBe(
      'https://example.com/data?format=csv',
    )
  })

  it('converts a published-sheet URL to the CSV endpoint', () => {
    const url = 'https://docs.google.com/spreadsheets/d/e/abcXYZ/pub?gid=3&single=true'
    expect(normalizeSheetUrl(url)).toBe(
      'https://docs.google.com/spreadsheets/d/e/abcXYZ/pub?output=csv',
    )
  })

  it('converts a standard sheet edit URL to the export endpoint', () => {
    const url = 'https://docs.google.com/spreadsheets/d/ABC123/edit#gid=5'
    expect(normalizeSheetUrl(url)).toBe(
      'https://docs.google.com/spreadsheets/d/ABC123/export?format=csv&gid=5',
    )
  })

  it('omits gid when the URL has none', () => {
    const url = 'https://docs.google.com/spreadsheets/d/ABC123/edit'
    expect(normalizeSheetUrl(url)).toBe(
      'https://docs.google.com/spreadsheets/d/ABC123/export?format=csv',
    )
  })

  it('trims surrounding whitespace', () => {
    const url = '  https://docs.google.com/spreadsheets/d/e/abc/pub?output=csv  '
    expect(normalizeSheetUrl(url)).toBe(url.trim())
  })
})

describe('fetchSheet', () => {
  function mockFetch(text: string, ok = true, status = 200) {
    const fn = vi.fn(async () => ({ ok, status, text: async () => text }))
    vi.stubGlobal('fetch', fn)
    return fn
  }

  const csv = ['Word,Meaning,Extra', '"hello","a greeting",""', '"","no front",x'].join('\n')

  it('parses CSV into columns and rows', async () => {
    mockFetch(csv)
    const result = await fetchSheet('https://docs.google.com/spreadsheets/d/ABC123/edit')
    expect(result.columns).toEqual(['Word', 'Meaning', 'Extra'])
    expect(result.rows).toEqual([
      { Word: 'hello', Meaning: 'a greeting', Extra: '' },
      { Word: '', Meaning: 'no front', Extra: 'x' },
    ])
  })

  it('drops fully-empty rows', async () => {
    mockFetch('A,B\n"1","2"\n"",""\n"3","4"')
    const result = await fetchSheet('https://example.com/x?format=csv')
    expect(result.rows).toHaveLength(2)
  })

  it('caches repeated fetches unless forced', async () => {
    const fetch1 = mockFetch('A,B\n1,2')
    const url = 'https://example.com/cached?format=csv'
    await fetchSheet(url)
    await fetchSheet(url)
    expect(fetch1).toHaveBeenCalledTimes(1)
    await fetchSheet(url, true)
    expect(fetch1).toHaveBeenCalledTimes(2)
  })

  it('rejects non-2xx responses', async () => {
    mockFetch('', false, 404)
    await expect(fetchSheet('https://example.com/error?format=csv')).rejects.toThrow(/Request failed/)
  })

  it('rejects HTML responses (private sheets)', async () => {
    mockFetch('<!DOCTYPE html><html></html>')
    await expect(fetchSheet('https://example.com/private?format=csv')).rejects.toThrow(/HTML page/)
  })
})