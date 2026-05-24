import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { execa } from 'execa'

const BD = '/opt/homebrew/bin/bd'

// Read test state to get temp dir for bd commands
function getTestState(): { tmpDir: string; serverPid: number } {
  const stateFile = path.join(process.cwd(), 'tests/e2e/.test-state.json')
  return JSON.parse(readFileSync(stateFile, 'utf8')) as {
    tmpDir: string
    serverPid: number
  }
}

test.describe('Board rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for board to be populated (epic lanes visible)
    await page.waitForSelector('bd-epic-lane', { timeout: 5000 })
  })

  test('epic swim lanes render with correct titles', async ({ page }) => {
    // Evaluate shadow DOM of each bd-epic-lane to extract the epic title text
    const epicTitles = await page
      .locator('bd-epic-lane')
      .evaluateAll((elements: Element[]) =>
        elements.map((el) =>
          el.shadowRoot?.querySelector('.epic-title')?.textContent?.trim(),
        ),
      )
    expect(epicTitles).toContain('UI Components')
    expect(epicTitles).toContain('Server Layer')
  })

  test('epic swim lanes render status summaries', async ({ page }) => {
    // Each epic lane should have a non-empty status summary
    const epicStatuses = await page
      .locator('bd-epic-lane')
      .evaluateAll((elements: Element[]) =>
        elements.map((el) =>
          el.shadowRoot?.querySelector('.epic-status')?.textContent?.trim(),
        ),
      )
    for (const status of epicStatuses) {
      expect(status).toBeTruthy()
      expect(status).not.toBe('no tasks')
    }
  })

  test('tasks appear in correct columns', async ({ page }) => {
    // "Implement board layout" and "Implement SSE broadcaster" are in_progress
    const inProgressCards = await page
      .locator('bd-column[column="inProgress"]')
      .first()
      .evaluateAll((elements: Element[]) =>
        elements.flatMap((el) =>
          Array.from(el.shadowRoot?.querySelectorAll('bd-task-card') ?? []).map(
            (card) =>
              card.shadowRoot?.querySelector('.title')?.textContent?.trim(),
          ),
        ),
      )

    // At least one in-progress task should exist
    expect(inProgressCards.filter(Boolean).length).toBeGreaterThan(0)
  })

  test('blocked task appears in open column', async ({ page }) => {
    // "Implement task cards" was set to blocked → goes in the open column
    const openColumnCards = await page
      .locator('bd-column[column="open"]')
      .evaluateAll((elements: Element[]) =>
        elements.flatMap((el) =>
          Array.from(el.shadowRoot?.querySelectorAll('bd-task-card') ?? []).map(
            (card) =>
              card.shadowRoot?.querySelector('.title')?.textContent?.trim(),
          ),
        ),
      )

    expect(openColumnCards).toContain('Implement task cards')
  })

  test('closed tasks appear in done column', async ({ page }) => {
    // "Implement query module" was closed and belongs to "Server Layer" epic.
    // "Configure Vite" was also closed but has no parent epic, so it is not
    // rendered in any epic swim lane (the board only shows tasks with an epic).
    const doneColumnCards = await page
      .locator('bd-column[column="done"]')
      .evaluateAll((elements: Element[]) =>
        elements.flatMap((el) =>
          Array.from(el.shadowRoot?.querySelectorAll('bd-task-card') ?? []).map(
            (card) =>
              card.shadowRoot?.querySelector('.title')?.textContent?.trim(),
          ),
        ),
      )

    expect(doneColumnCards).toContain('Implement query module')
  })

  test('subtask tally shows correct count for board layout task', async ({
    page,
  }) => {
    // "Implement board layout" has 3 subtasks: 2 closed + 1 open = "2 / 3 subtasks"
    const tallyTexts = await page
      .locator('bd-task-card')
      .evaluateAll((elements: Element[]) =>
        elements.map((el) =>
          el.shadowRoot?.querySelector('.subtask-count')?.textContent?.trim(),
        ),
      )
    const nonEmpty = tallyTexts.filter(Boolean)
    expect(nonEmpty).toContain('2 / 3 subtasks')
  })
})

test.describe('SSE realtime updates', () => {
  test('bd status change reflects in UI via SSE', async ({ page }) => {
    const state = getTestState()

    await page.goto('/')
    await page.waitForSelector('bd-epic-lane', { timeout: 5000 })

    // Locate in-progress task cards across all epic lanes (Playwright pierces shadow DOM)
    const inProgressCards = page
      .locator('bd-column[column="inProgress"]')
      .locator('bd-task-card')

    const initialCount = await inProgressCards.count()

    // Get a blocked task ID directly from bd — no shadow DOM scraping needed
    const blockedResult = await execa(
      BD,
      ['list', '--status', 'blocked', '--json'],
      { cwd: state.tmpDir },
    )
    const blockedTasks = JSON.parse(blockedResult.stdout) as Array<{
      id: string
    }>

    if (blockedTasks.length === 0) {
      test.skip()
      return
    }

    const taskIdToMove = blockedTasks[0].id

    await execa(BD, ['update', taskIdToMove, '--status', 'in_progress'], {
      cwd: state.tmpDir,
    })

    // Playwright retries this assertion until it passes or the test times out
    await expect(inProgressCards).toHaveCount(initialCount + 1)
  })
})
