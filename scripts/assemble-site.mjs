#!/usr/bin/env node
import { cpSync, mkdirSync, existsSync, rmSync, renameSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const gameDir = resolve(dist, 'skippity')

mkdirSync(dist, { recursive: true })

// Vite emits skippity/index.html as dist/skippity/skippity/index.html — flatten it.
const nestedHtml = resolve(gameDir, 'skippity/index.html')
const flatHtml = resolve(gameDir, 'index.html')
if (existsSync(nestedHtml)) {
  renameSync(nestedHtml, flatHtml)
  rmSync(resolve(gameDir, 'skippity'), { recursive: true, force: true })
}

// Static landing at site root
cpSync(resolve(root, 'index.html'), resolve(dist, 'index.html'))
cpSync(resolve(root, 'landing.css'), resolve(dist, 'landing.css'))
cpSync(resolve(root, 'public/images'), resolve(dist, 'images'), { recursive: true })
cpSync(resolve(root, 'deploy/dreamhost.htaccess'), resolve(dist, '.htaccess'))

if (existsSync(gameDir)) {
  cpSync(
    resolve(root, 'deploy/dreamhost.htaccess'),
    resolve(gameDir, '.htaccess'),
  )
}

// Drop leftover root assets from older builds (game assets live under /skippity/assets)
for (const leftover of ['assets', 'favicon.svg', 'icons.svg']) {
  const p = resolve(dist, leftover)
  if (existsSync(p)) rmSync(p, { recursive: true, force: true })
}

console.log('Assembled dist/: static landing + /skippity game')
