import { appendFile, cp, mkdtemp, rm } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
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

  it('should_treat_a_missing_directory_as_having_no_files', async () => {
    const differences = await compareDirectories(join(fixtures, 'base'), join(fixtures, 'does-not-exist'))

    expect(differences).toEqual(['a.ts', 'nested/b.ts'])
  })

  it('should_list_each_file_that_differs_or_is_missing_or_extra', async () => {
    const differences = await compareDirectories(join(fixtures, 'base'), join(fixtures, 'changed'))

    expect(differences).toEqual(['a.ts', 'extra.ts', 'nested/b.ts'])
  })
})

describe('check-client-drift CLI', () => {
  const scratchDirs: string[] = []
  afterEach(async () => {
    await Promise.all(scratchDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
  })

  it('should_fail_and_name_the_file_when_the_committed_client_was_edited', async () => {
    const scratch = await mkdtemp(join(tmpdir(), 'client-'))
    scratchDirs.push(scratch)
    const editedCopy = join(scratch, 'api-client')
    await cp(committedClient, editedCopy, { recursive: true })
    await appendFile(join(editedCopy, 'index.ts'), '\nexport const handEdited = true\n')

    const failure = await run(process.execPath, [cli, '--client-dir', editedCopy]).catch(error => error)

    expect(failure.code).toBe(1)
    expect(failure.stderr).toContain('index.ts')
  })

  it('should_fail_with_the_regenerate_hint_when_the_committed_client_is_missing', async () => {
    const failure = await run(process.execPath, [cli, '--client-dir', join(tmpdir(), 'no-such-client-dir')]).catch(error => error)

    expect(failure.code).toBe(1)
    expect(failure.stderr).toContain('pnpm client:generate')
    expect(failure.stderr).not.toContain('ENOENT')
  })
})
