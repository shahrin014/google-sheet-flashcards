import type { SheetResult } from './sheet'

export interface StepContext {
  url: string
  setUrl: (v: string) => void
  preview: SheetResult | null
  loading: boolean
  error: string | null
  load: () => void
  frontCols: string[]
  setFrontCols: (v: string[]) => void
  backCols: string[]
  setBackCols: (v: string[]) => void
  tagsCol: string | null
  setTagsCol: (v: string | null) => void
  idCol: string | null
  setIdCol: (v: string | null) => void
}