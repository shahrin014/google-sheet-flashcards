import { useNavigate, useOutletContext } from 'react-router-dom'
import { Box, Button, Paper, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import type { StepContext } from '../lib/setup-context'

const EXAMPLE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOkSW-xF_ScbMBcch77qB5NZkUjEEGvl7-5Qh0FQBQ86-nZ54BFWntx1UevFIxmScCP7q1mSPly7c7/pub?gid=460290712&single=true&output=csv'

export default function StepUrl() {
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