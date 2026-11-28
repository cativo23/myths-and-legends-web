import { cp, mkdtemp, appendFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import { compareDirectories } from '../../scripts/clientDrift.ts'

const run = promisify(execFile)
const fixtures = join(import.meta.dirname, 'fixtures/client-drift')
const committedClient = join(import.meta.dirname, '../../app/api-client')
const cli = join(import.meta.dirname, '../../scripts/check-client-drift.ts')

describe('compareDirectories', () => {
  it('should_report_no_difference_for_identical_directories', async () => {
    const differences = await compareDirectories(join(fixtures, 'base'), join(fixtures, 'identical'))

    expect(differences).toEqual([])
  })

  it('should_list_each_file_that_differs_or_is_missing_or_extra', async () => {
    const differences = await compareDirectories(join(fixtures, 'base'), join(fixtures, 'changed'))

    expect(differences).toEqual(['a.ts', 'extra.ts', 'nested/b.ts'])
  })
})

describe('check-client-drift CLI', () => {
  it('should_pass_for_the_committed_client', async () => {
    await expect(run('node', [cli])).resolves.toBeDefined()
  })

  it('should_fail_and_name_the_file_when_the_committed_client_was_edited', async () => {
    const editedCopy = join(await mkdtemp(join(tmpdir(), 'client-')), 'api-client')
    await cp(committedClient, editedCopy, { recursive: true })
    await appendFile(join(editedCopy, 'index.ts'), '\nexport const handEdited = true\n')

    const failure = await run('node', [cli, '--client-dir', editedCopy]).catch(error => error)

    expect(failure.code).toBe(1)
    expect(failure.stderr).toContain('index.ts')
  })
})
