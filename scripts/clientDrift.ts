import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true })
  return entries
    .filter(entry => entry.isFile())
    .map(entry => relative(directory, join(entry.parentPath, entry.name)))
}

async function readIfPresent(path: string): Promise<string | undefined> {
  return readFile(path, 'utf8').catch(() => undefined)
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
