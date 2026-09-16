import { useState } from 'react'
import { Navigate, Outlet, useNavigate, useOutletContext } from 'react-router-dom'
import {
  Box,
  Button,
  Checkbox,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useSettings } from '../lib/settings-context'
import { fetchSheet, type SheetResult } from '../lib/sheet'

interface SetupProps {
  initialUrl: string
}

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

const EXAMPLE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOkSW-xF_ScbMBcch77qB5NZkUjEEGvl7-5Qh0FQBQ86-nZ54BFWntx1UevFIxmScCP7q1mSPly7c7/pub?gid=460290712&single=true&output=csv'

export default function SetupLayout({ initialUrl }: SetupProps) {
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

export function StepUrl() {
  const ctx = useOutletContext<StepContext>()
  const navigate = useNavigate()
  const { url, setUrl, preview, loading, error, load } = ctx

  return (
    <Box className="setup">
      <Title order={1} ta="center">
        Sheet Flashcards
      </Title>
      <Stack mt="md">
        <Text c="dimmed" ta="center">
          Paste the URL of a Google Sheet (shared as “viewer” or published to the web) to load a
          preview. Then pick which columns become the front and back of your flashcards.
        </Text>

        <TextInput
          label="Google Sheets URL"
          value={url}
          onChange={(e) => setUrl(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void load()
          }}
          placeholder="https://docs.google.com/spreadsheets/…"
        />

        <Button disabled={loading} loading={loading} onClick={() => void load()}>
          Load preview
        </Button>

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        {preview && (
          <>
            <Paper withBorder radius="md" style={{ maxHeight: 360, overflow: 'auto' }} px="xs">
              <Table.ScrollContainer minWidth={600}>
                <Table striped highlightOnHover stickyHeader verticalSpacing="xs" fz="sm">
                  <Table.Thead>
                    <Table.Tr>
                      {preview.columns.map((c) => (
                        <Table.Th key={c}>{c}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {preview.rows.map((row, i) => (
                      <Table.Tr key={i}>
                        {preview.columns.map((c) => (
                          <Table.Td key={c}>{row[c]}</Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>

            <Button mt="xs" onClick={() => navigate('/setup/columns')}>
              Continue to column mapping →
            </Button>
          </>
        )}

        <Text size="xs" c="dimmed" ta="center" mt="xs">
          Try it: <a href={EXAMPLE}>{EXAMPLE}</a>
        </Text>
      </Stack>
    </Box>
  )
}

export function StepColumns() {
  const ctx = useOutletContext<StepContext>()
  const navigate = useNavigate()
  const { setSettings } = useSettings()
  const {
    url,
    preview,
    frontCols,
    setFrontCols,
    backCols,
    setBackCols,
    tagsCol,
    setTagsCol,
    idCol,
    setIdCol,
  } = ctx

  if (!preview) {
    return <Navigate to="/setup" replace />
  }

  function start() {
    if (!preview) return
    if (frontCols.length === 0 || backCols.length === 0) return
    setSettings({
      sheetUrl: url.trim(),
      frontCols,
      backCols,
      tagsCol: tagsCol ?? '',
      idCol: idCol ?? '',
    })
    navigate('/study')
  }

  const columnOptions = preview.columns.map((c) => ({ value: c, label: c }))

  return (
    <Box className="setup">
      <Title order={1} ta="center">
        Sheet Flashcards
      </Title>
      <Stack mt="md">
        <Text c="dimmed" ta="center">
          This sheet has {preview.rows.length} rows. Choose which columns appear on each side of
          the card.
        </Text>

        <Paper withBorder radius="md" p="md">
          <Checkbox.Group
            label="Front columns (each on its own line)"
            value={frontCols}
            onChange={setFrontCols}
          >
            <Group mt="xs">
              {columnOptions.map((c) => (
                <Checkbox key={c.value} value={c.value} label={c.label} />
              ))}
            </Group>
          </Checkbox.Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Checkbox.Group
            label="Back columns (each on its own line)"
            value={backCols}
            onChange={setBackCols}
          >
            <Group mt="xs">
              {columnOptions.map((c) => (
                <Checkbox key={c.value} value={c.value} label={c.label} />
              ))}
            </Group>
          </Checkbox.Group>
        </Paper>

        <Group grow>
          <Select
            label="ID column"
            placeholder="— auto —"
            clearable
            data={columnOptions}
            value={idCol}
            onChange={setIdCol}
          />
          <Select
            label="Tags column"
            placeholder="— none —"
            clearable
            data={columnOptions}
            value={tagsCol}
            onChange={setTagsCol}
          />
        </Group>

        <Group justify="space-between">
          <Button variant="default" onClick={() => navigate('/setup')}>
            ← Back
          </Button>
          <Button onClick={start} disabled={frontCols.length === 0 || backCols.length === 0}>
            Start studying
          </Button>
        </Group>
      </Stack>
    </Box>
  )
}