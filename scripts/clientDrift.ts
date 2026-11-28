import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT'
}

// Only "does not exist" is treated as absence; permission and I/O errors must surface.
async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true }).catch((error) => {
    if (isMissing(error)) return []
    throw error
  })
  return entries
    .filter(entry => entry.isFile())
    .map(entry => relative(directory, join(entry.parentPath, entry.name)))
}

async function readIfPresent(path: string): Promise<string | undefined> {
  return readFile(path, 'utf8').catch((error) => {
    if (isMissing(error)) return undefined
    throw error
  })
}

/** Relative paths (sorted) that differ, are missing, or are extra between two directory trees. */
export async function compareDirectories(expectedDir: string, actualDir: string): Promise<string[]> {
  const paths = new Set([...(await listFiles(expectedDir)), ...(await listFiles(actualDir))])
  const differing: string[] = []

  for (const path of paths) {
    const expected = await readIfPresent(join(expectedDir, path))
    const actual = await readIfPresent(join(actualDir, path))
    if (expected !== actual) differing.push(path)
  }

  return differing.sort()
}
