import { execFile } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs, promisify } from 'node:util'
import { compareDirectories } from './clientDrift.ts'

const run = promisify(execFile)
const root = resolve(import.meta.dirname, '..')
const generatorBin = join(root, 'node_modules/@hey-api/openapi-ts/bin/run.js')
const generatorConfig = join(root, 'openapi/openapi-ts.config.ts')

async function regenerateInto(outputDir: string): Promise<void> {
  await run(process.execPath, [generatorBin, '-f', generatorConfig, '-o', outputDir, '--silent', '--no-log-file'], { cwd: root })
}

async function main(): Promise<number> {
  const { values } = parseArgs({ options: { 'client-dir': { type: 'string' } } })
  const committedDir = resolve(values['client-dir'] ?? join(root, 'app/api-client'))
  const freshDir = await mkdtemp(join(tmpdir(), 'api-client-fresh-'))

  try {
    await regenerateInto(freshDir)
    const differences = await compareDirectories(freshDir, committedDir)
    if (differences.length === 0) return 0

    console.error('The generated API client differs from openapi/openapi.json. Run `pnpm client:generate` and commit the result. Differing files:')
    differences.forEach(path => console.error(`  ${path}`))
    return 1
  }
  finally {
    await rm(freshDir, { recursive: true, force: true })
  }
}

process.exitCode = await main()
