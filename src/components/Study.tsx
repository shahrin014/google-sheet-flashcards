import { useNavigate } from 'react-router-dom'
import { State } from 'ts-fsrs'
import {
  ActionIcon,
  Affix,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Menu,
  Modal,
  Paper,
  Stack,
  Text,
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
  } = useDeckState()

  const navigate = useNavigate()

  return (
    <div className="app">
      <header className="topbar">
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
        <Group gap="xs">
          <Menu shadow="md" width={220}>
            <Menu.Target>
              <ActionIcon
                variant="default"
                size="lg"
                aria-label="Open menu"
                aria-haspopup="menu"
                title="Menu"
              >
                <Group gap={3} className="burger" wrap="nowrap">
                  <span />
                  <span />
                  <span />
                </Group>
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => navigate('/setup')}>Change sheet</Menu.Item>
              <Menu.Item onClick={() => void handleCopyShareLink()}>Copy share link</Menu.Item>
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
