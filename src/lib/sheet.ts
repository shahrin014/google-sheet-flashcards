import Papa from 'papaparse'

export interface SheetResult {
  columns: string[]
  rows: Record<string, string>[]
}

export function normalizeSheetUrl(input: string): string {
  const trimmed = input.trim()
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv')) {
    return trimmed
  }
  const published = trimmed.match(
    /docs\.google\.com\/spreadsheets\/d\/e\/([^/?#]+)\/pub(?:[?#&][^#]*)?/i,
  )
  if (published) {
    return `https://docs.google.com/spreadsheets/d/e/${published[1]}/pub?output=csv`
  }
  const sheet = trimmed.match(
    /docs\.google\.com\/spreadsheets\/d\/([^/?#]+)(?:[?#])([^#]*)/i,
  ) ?? trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([^/?#]+)/i)
  if (sheet) {
    const id = sheet[1]
    const gid = trimmed.match(/[?&#]gid=(\d+)/)?.[1]
    const params = new URLSearchParams({ format: 'csv' })
    if (gid) params.set('gid', gid)
    return `https://docs.google.com/spreadsheets/d/${id}/export?${params.toString()}`
  }
  return trimmed
}

function csvToRows(text: string): SheetResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
  })
  const columns = parsed.meta.fields ?? []
  const rows = (parsed.data ?? []).filter(
    (row) =>
      row &&
      Object.keys(row).length > 0 &&
      Object.values(row).some((v) => v !== undefined && v !== null && String(v).trim() !== ''),
  )
  return { columns, rows }
}

const cache = new Map<string, Promise<SheetResult>>()

export function fetchSheet(inputUrl: string, force = false): Promise<SheetResult> {
  const url = normalizeSheetUrl(inputUrl)
  const cached = cache.get(url)
  if (cached && !force) return cached
  const promise = (async () => {
    try {
      const res = await fetch(url, { mode: 'cors' })
      if (!res.ok) {
        throw new Error(`Request failed (${res.status}). Make sure the sheet is shared or published to the web.`)
      }
      const text = await res.text()
      if (text.trim().startsWith('<')) {
        throw new Error('Got an HTML page instead of CSV. The sheet may be private.')
      }
      return csvToRows(text)
    } catch (err) {
      cache.delete(url)
      throw err
    }
  })()
  cache.set(url, promise)
  return promise
}