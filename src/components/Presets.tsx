import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useSettings } from '../lib/settings-context'
import {
  deletePreset,
  loadActivePresetName,
  loadPresets,
  saveActivePresetName,
  type Preset,
} from '../lib/storage'

export default function Presets() {
  const navigate = useNavigate()
  const { setSettings } = useSettings()
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets())
  const activePreset = loadActivePresetName()

  function activatePreset(p: Preset) {
    saveActivePresetName(p.name)
    setSettings(p.settings)
    navigate('/study')
  }

  function handleDelete(name: string) {
    deletePreset(name)
    setPresets(loadPresets())
  }

  function summary(p: Preset): string {
    const s = p.settings
    const front = s.frontCols.join(', ')
    const back = s.backCols.join(', ')
    const parts = [s.tagsCol && `tags: ${s.tagsCol}`, s.idCol && `id: ${s.idCol}`].filter(Boolean)
    return [front, back, parts.join(' · ')].join(' → ')
  }

  return (
    <Box className="setup">
      <Title order={1} ta="center">
        Sheet Flashcards
      </Title>
      <Stack mt="md" gap="sm">
        <Text c="dimmed" ta="center">
          Pick a preset to study, or create a new one from a sheet.
        </Text>

        {presets.length === 0 && (
          <Text size="sm" c="dimmed" ta="center">
            No presets yet. Create one below.
          </Text>
        )}

        {presets.map((p) => (
          <Paper key={p.name} withBorder radius="md" p="md">
            <Group wrap="nowrap" justify="space-between">
              <Group wrap="nowrap" gap="sm">
                <Text fw={500}>{p.name}</Text>
                {p.name === activePreset && (
                  <Badge variant="light" color="teal" size="xs">
                    active
                  </Badge>
                )}
              </Group>
              <Group wrap="nowrap" gap="xs">
                <Button onClick={() => activatePreset(p)}>{p.name === activePreset ? 'Continue' : 'Use'}</Button>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label={`Delete preset ${p.name}`}
                  onClick={() => handleDelete(p.name)}
                >
                  ✕
                </ActionIcon>
              </Group>
            </Group>
            <Text size="xs" c="dimmed" mt="xs">
              {summary(p)}
            </Text>
          </Paper>
        ))}

        <Button mt="sm" onClick={() => navigate('/setup')}>
          New
        </Button>
      </Stack>
    </Box>
  )
}