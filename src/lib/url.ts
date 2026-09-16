import type { Settings } from './storage'

export const PARAM_SHEET = 'sheet'
export const PARAM_FRONT = 'front'
export const PARAM_BACK = 'back'
export const PARAM_TAGS = 'tags'
export const PARAM_ID = 'id'

export function settingsToParams(s: Settings): URLSearchParams {
  const params = new URLSearchParams()
  params.set(PARAM_SHEET, s.sheetUrl)
  for (const col of s.frontCols) params.append(PARAM_FRONT, col)
  for (const col of s.backCols) params.append(PARAM_BACK, col)
  if (s.tagsCol) params.set(PARAM_TAGS, s.tagsCol)
  if (s.idCol) params.set(PARAM_ID, s.idCol)
  return params
}

export function paramsToSettings(params: URLSearchParams): Settings | null {
  const sheetUrl = params.get(PARAM_SHEET)
  const frontCols = params.getAll(PARAM_FRONT)
  const backCols = params.getAll(PARAM_BACK)
  if (!sheetUrl || frontCols.length === 0 || backCols.length === 0) return null
  return {
    sheetUrl,
    frontCols,
    backCols,
    tagsCol: params.get(PARAM_TAGS) ?? '',
    idCol: params.get(PARAM_ID) ?? '',
  }
}

export function updateUrl(settings: Settings): void {
  const params = settingsToParams(settings)
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}?${params.toString()}${window.location.hash}`,
  )
}