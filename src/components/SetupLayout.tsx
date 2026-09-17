import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { fetchSheet, type SheetResult } from '../lib/sheet'
import type { StepContext } from '../lib/setup-context'

interface SetupLayoutProps {
  initialUrl: string
}

export default function SetupLayout({ initialUrl }: SetupLayoutProps) {
  const [url, setUrl] = useState(initialUrl)
  const [preview, setPreview] = useState<SheetResult | null>(null)
  const [frontCols, setFrontCols] = useState<string[]>([])
  const [backCols, setBackCols] = useState<string[]>([])
  const [tagsCol, setTagsCol] = useState<string | null>(null)
  const [idCol, setIdCol] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!url.trim()) {
      setError('Please paste a Google Sheets URL.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchSheet(url, true)
      setPreview(result)
      setFrontCols(result.columns.slice(0, 1))
      setBackCols(result.columns.slice(1, 3))
      const tags = result.columns.find((c) => /^tags?$/i.test(c))
      setTagsCol(tags ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the sheet.')
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  const context: StepContext = {
    url,
    setUrl: (v) => {
      setUrl(v)
      setError(null)
    },
    preview,
    loading,
    error,
    load,
    frontCols,
    setFrontCols,
    backCols,
    setBackCols,
    tagsCol,
    setTagsCol,
    idCol,
    setIdCol,
  }

  return <Outlet context={context} />
}