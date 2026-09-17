import { describe, expect, it } from 'vitest'
import { paramsToSettings, settingsToParams, PARAM_SHEET } from './url'
import type { Settings } from './storage'

const settings: Settings = {
  sheetUrl: 'https://docs.google.com/spreadsheets/d/e/EXAMPLE/pub?output=csv',
  frontCols: ['Word', 'Reading'],
  backCols: ['Meaning', 'Example'],
  tagsCol: 'Tags',
  idCol: 'Id',
}

describe('settingsToParams', () => {
  it('encodes sheet URL and repeated columns', () => {
    const params = settingsToParams(settings)
    expect(params.get(PARAM_SHEET)).toBe(settings.sheetUrl)
    expect(params.getAll('front')).toEqual(['Word', 'Reading'])
    expect(params.getAll('back')).toEqual(['Meaning', 'Example'])
    expect(params.get('tags')).toBe('Tags')
    expect(params.get('id')).toBe('Id')
  })

  it('omits empty tags and id columns', () => {
    const params = settingsToParams({ ...settings, tagsCol: '', idCol: '' })
    expect(params.has('tags')).toBe(false)
    expect(params.has('id')).toBe(false)
  })
})

describe('paramsToSettings', () => {
  it('round-trips through settingsToParams', () => {
    const decoded = paramsToSettings(settingsToParams(settings))
    expect(decoded).toEqual(settings)
  })

  it('preserves back-col order for repeated params', () => {
    const params = settingsToParams({ ...settings, frontCols: ['A', 'B'], backCols: ['X', 'Y'] })
    const decoded = paramsToSettings(params)
    expect(decoded?.frontCols).toEqual(['A', 'B'])
    expect(decoded?.backCols).toEqual(['X', 'Y'])
    expect(decoded?.tagsCol).toBe('Tags')
    expect(decoded?.idCol).toBe('Id')
  })

  it('returns null without a sheet URL', () => {
    const params = settingsToParams(settings)
    params.delete(PARAM_SHEET)
    expect(paramsToSettings(params)).toBeNull()
  })

  it('returns null without front or back columns', () => {
    const params = settingsToParams(settings)
    params.delete('back')
    expect(paramsToSettings(params)).toBeNull()
  })

  it('defaults missing tags/id to empty strings', () => {
    const params = settingsToParams({ ...settings, tagsCol: '', idCol: '' })
    const decoded = paramsToSettings(params)
    expect(decoded?.tagsCol).toBe('')
    expect(decoded?.idCol).toBe('')
  })
})