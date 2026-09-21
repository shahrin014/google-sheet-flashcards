import { useState } from 'react'
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import {
  Box,
  Button,
  Checkbox,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useSettings } from '../lib/settings-context'
import { saveActivePresetName, savePreset, type Settings } from '../lib/storage'
import type { StepContext } from '../lib/setup-context'

export default function StepColumns() {
  const ctx = useOutletContext<StepContext>()
  const navigate = useNavigate()
  const { setSettings } = useSettings()
  const {
    url,
    preview,
    sheetName,
    frontCols,
    setFrontCols,
    backCols,
    setBackCols,
    tagsCol,
    setTagsCol,
    idCol,
    setIdCol,
  } = ctx

  const frontLabel = frontCols[0] ?? 'front'
  const backLabel = backCols[0] ?? 'back'
  const defaultPresetName = [sheetName, `${frontLabel} → ${backLabel}`]
    .filter(Boolean)
    .join(' · ')
  const [override, setOverride] = useState<string | null>(null)
  const presetName = override ?? defaultPresetName

  if (!preview) {
    return <Navigate to="/setup" replace />
  }

  function start() {
    if (!preview) return
    if (frontCols.length === 0 || backCols.length === 0) return
    const next: Settings = {
      sheetUrl: url.trim(),
      frontCols,
      backCols,
      tagsCol: tagsCol ?? '',
      idCol: idCol ?? '',
    }
    setSettings(next)
    const named = presetName.trim() || defaultPresetName
    savePreset(named, next)
    saveActivePresetName(named)
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

        <TextInput
          label="Preset name"
          description="Auto-filled from the sheet name and columns — edit if you like."
          value={presetName}
          onChange={(e) => setOverride(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') start()
          }}
        />

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