import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { State } from 'ts-fsrs'
import {
  ActionIcon,
  Affix,
  Alert,
  Badge,
  Burger,
  Button,
  Divider,
  Group,
  Loader,
  Menu,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import '../App.css'
import CardView from './Card'
import { useDeckState } from '../lib/deck-context'

export default function Study() {
  const {
    sheet,
    sheetError,
    deck,
    dueCards,
    currentId,
    currentRow,
    frontSections,
    backSections,
    tags,
    newCount,
    reviewedToday,
    ratingIntervals,
    handleRate,
    handleResetProgress,
    handleClearAll,
    handleConfirmClearAll,
    handleCancelClearAll,
    handleCopyShareLink,
    revealed,
    setRevealed,
    clearOpen,
    notice,
    presets,
    activePreset,
    presetOpen,
    setPresetOpen,
    handleSwitchPreset,
    handleDeletePreset,
    handleSaveCurrentPreset,
  } = useDeckState()

  const navigate = useNavigate()
  const [newPresetName, setNewPresetName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app">
      <header className="topbar">
        <Group gap="xs">
          <Menu shadow="md" width={220} opened={menuOpen} onChange={setMenuOpen}>
            <Menu.Target>
              <Burger
                size="md"
                opened={menuOpen}
                aria-label="Open menu"
                aria-haspopup="menu"
                title="Menu"
              />
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => navigate('/presets')}>Change sheet</Menu.Item>
              <Menu.Item onClick={() => void handleCopyShareLink()}>Copy share link</Menu.Item>
              <Menu.Item onClick={() => setPresetOpen(true)}>Switch preset</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="orange" onClick={handleResetProgress}>
                Reset progress
              </Menu.Item>
              <Menu.Item color="red" onClick={handleClearAll}>
                Clear memory
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
        <Title order={3} className="topbar-title">
          Sheet Flashcards
        </Title>
        <Group gap="xs">
          <Badge variant="light" color="indigo" title="New cards remaining">
            new {newCount}
          </Badge>
          <Badge variant="light" color="grape" title="Cards due now">
            due {dueCards.length}
          </Badge>
          <Badge variant="light" color="teal" title="Reviewed today">
            today {reviewedToday}
          </Badge>
        </Group>
      </header>

      <main>
        {sheetError && (
          <Alert color="red" variant="light" w="100%" withCloseButton={false}>
            <Text size="sm">
              {sheetError}
              <Button
                variant="subtle"
                size="compact-xs"
                color="red"
                ml="sm"
                onClick={() => navigate('/setup')}
              >
                Configure sheet
              </Button>
            </Text>
          </Alert>
        )}

        {!sheet && !sheetError && (
          <Stack align="center" gap="sm">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading sheet…
            </Text>
          </Stack>
        )}

        {sheet && dueCards.length === 0 && (
          <div className="done">
            <Title order={2}>All caught up!</Title>
            <Text size="sm" c="dimmed">
              {newCount} new cards · {reviewedToday} reviewed today
            </Text>
            <Button variant="subtle" color="red" size="compact-sm" onClick={handleResetProgress}>
              Reset progress
            </Button>
          </div>
        )}

        {sheet && currentRow && currentId && (
          <CardView
            front={frontSections}
            back={backSections}
            tags={tags}
            revealed={revealed}
            isNew={deck.cards[currentId]?.state === State.New}
            ratings={ratingIntervals}
            onReveal={() => setRevealed(true)}
            onRate={handleRate}
          />
        )}
      </main>

      <Modal
        opened={presetOpen}
        onClose={() => setPresetOpen(false)}
        title="Presets"
        centered
        closeOnClickOutside
      >
        <Stack gap="sm">
          {presets.length === 0 && (
            <Text size="sm" c="dimmed">
              No presets saved yet. Name one on the setup screen to save a sheet and column
              mapping.
            </Text>
          )}
          {presets.map((p) => (
            <Group key={p.name} wrap="nowrap" justify="space-between">
              <Group wrap="nowrap" gap="sm">
                <Text size="sm" fw={p.name === activePreset ? 700 : 400}>
                  {p.name}
                </Text>
                {p.name === activePreset && (
                  <Badge variant="light" color="teal" size="xs">
                    active
                  </Badge>
                )}
              </Group>
              <Group wrap="nowrap" gap="xs">
                <Button
                  size="compact-xs"
                  variant="default"
                  disabled={p.name === activePreset}
                  onClick={() => handleSwitchPreset(p.name)}
                >
                  Use
                </Button>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  aria-label={`Delete preset ${p.name}`}
                  onClick={() => handleDeletePreset(p.name)}
                >
                  ✕
                </ActionIcon>
              </Group>
            </Group>
          ))}
          <Divider />
          <Group wrap="nowrap">
            <TextInput
              placeholder="Save current sheet as preset…"
              w="100%"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newPresetName.trim()) {
                  handleSaveCurrentPreset(newPresetName.trim())
                  setNewPresetName('')
                }
              }}
            />
            <Button
              disabled={!newPresetName.trim()}
              onClick={() => {
                handleSaveCurrentPreset(newPresetName.trim())
                setNewPresetName('')
              }}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={clearOpen}
        onClose={handleCancelClearAll}
        title="Clear all memory?"
        centered
        closeOnClickOutside
      >
        <Text size="sm">
          This permanently deletes all stored settings and study progress for every sheet.
          This cannot be undone.
        </Text>
        <Group mt="lg" wrap="nowrap">
          <Button variant="default" flex={1} onClick={handleCancelClearAll}>
            Cancel
          </Button>
          <Button color="red" flex={1} onClick={handleConfirmClearAll}>
            Clear memory
          </Button>
        </Group>
      </Modal>

      {notice && (
        <Affix position={{ bottom: 24, left: '50%' }} style={{ transform: 'translateX(-50%)' }}>
          <Paper
            withBorder
            radius="md"
            px="md"
            py="xs"
            shadow="lg"
            color={notice.kind === 'success' ? 'teal' : 'red'}
          >
            <Text size="sm" fw={600} c={notice.kind === 'success' ? 'teal' : 'red'}>
              {notice.text}
            </Text>
          </Paper>
        </Affix>
      )}
    </div>
  )
}
