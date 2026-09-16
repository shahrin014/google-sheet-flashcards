import { useState } from 'react'
import { fetchSheet, type SheetResult } from '../lib/sheet'

interface Props {
  initialUrl: string
  onSubmit: (settings: {
    sheetUrl: string
    frontCol: string
    backCol: string
    tagsCol: string
    idCol: string
  }) => void
}

export default function Setup({ initialUrl, onSubmit }: Props) {
  const [url, setUrl] = useState(initialUrl)
  const [preview, setPreview] = useState<SheetResult | null>(null)
  const [frontCol, setFrontCol] = useState('')
  const [backCol, setBackCol] = useState('')
  const [tagsCol, setTagsCol] = useState('')
  const [idCol, setIdCol] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLoad() {
    if (!url.trim()) {
      setError('Please paste a Google Sheets URL.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchSheet(url, true)
      setPreview(result)
      if (!frontCol && !backCol) {
        setFrontCol(result.columns[0] ?? '')
        setBackCol(result.columns[1] ?? '')
        const tags = result.columns.find((c) => /^tags?$/i.test(c))
        if (tags) setTagsCol(tags)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the sheet.')
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  function handleStart() {
    if (!preview) return
    if (!frontCol || !backCol) {
      setError('Choose one column for the front and one for the back.')
      return
    }
    onSubmit({
      sheetUrl: url.trim(),
      frontCol,
      backCol,
      tagsCol,
      idCol,
    })
  }

  return (
    <div className="setup">
      <h1>Sheet Flashcards</h1>
      <p className="sub">
        Paste the URL of a Google Sheet, share it as “viewer”, and study its rows as Anki-style
        flashcards with an FSRS scheduler.
      </p>

      <label className="field">
        <span>Google Sheets URL</span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleLoad()
          }}
        />
      </label>
      <button className="primary" disabled={loading} onClick={() => void handleLoad()}>
        {loading ? 'Loading…' : preview ? 'Reload preview' : 'Load preview'}
      </button>

      {error && <p className="error">{error}</p>}

      {preview && (
        <>
          <div className="columns">
            <label className="field">
              <span>Front column</span>
              <select value={frontCol} onChange={(e) => setFrontCol(e.target.value)}>
                {preview.columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Back column</span>
              <select value={backCol} onChange={(e) => setBackCol(e.target.value)}>
                {preview.columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Tags column (optional)</span>
              <select value={tagsCol} onChange={(e) => setTagsCol(e.target.value)}>
                <option value="">— none —</option>
                {preview.columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>ID column (optional)</span>
              <select value={idCol} onChange={(e) => setIdCol(e.target.value)}>
                <option value="">— auto —</option>
                {preview.columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="preview">
            <h2>Preview ({preview.rows.length} rows)</h2>
            <table>
              <thead>
                <tr>
                  {preview.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {preview.columns.map((c) => (
                      <td key={c}>{row[c]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="primary" onClick={handleStart}>
            Start studying
          </button>
        </>
      )}
    </div>
  )
}