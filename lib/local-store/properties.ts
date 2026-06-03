import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

// On Vercel the project root is read-only; use /tmp for new writes.
// Seed data from data/local-properties.json is always available (included via outputFileTracingIncludes).
const IS_VERCEL = Boolean(process.env.VERCEL)
const SEED_PATH  = path.join(process.cwd(), 'data', 'local-properties.json')
const WRITE_PATH = IS_VERCEL ? '/tmp/local-properties.json' : SEED_PATH

export type StoredProperty = {
  id: number
  user_id: number
  title: string
  slug: string
  description: string | null
  price: number
  city: string
  quarter: string
  city_slug: string
  quarter_slug: string
  property_type: string
  status: string
  area: number
  bedrooms: number | null
  bathrooms: number | null
  floor: number | null
  total_floors: number | null
  furnished: string
  main_image: string | null
  images: string[]
  features: string[]
  views: number
  created_at: string
  updated_at: string
}

async function readJson(filePath: string): Promise<StoredProperty[]> {
  try {
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw) as StoredProperty[]
  } catch {
    return []
  }
}

async function readStore(): Promise<StoredProperty[]> {
  if (!IS_VERCEL) return readJson(SEED_PATH)

  // On Vercel: merge seed data + runtime additions (from /tmp), deduplicate by id
  const [seed, runtime] = await Promise.all([readJson(SEED_PATH), readJson(WRITE_PATH)])
  const byId = new Map<number, StoredProperty>()
  for (const p of seed)    byId.set(p.id, p)
  for (const p of runtime) byId.set(p.id, p) // runtime overrides seed
  return Array.from(byId.values()).sort((a, b) => b.id - a.id)
}

async function writeStore(items: StoredProperty[]): Promise<void> {
  if (IS_VERCEL) {
    // On Vercel: only persist new/edited entries (id >= 900001) in /tmp
    const runtimeItems = items.filter(p => p.id >= 900_001)
    await writeFile(WRITE_PATH, JSON.stringify(runtimeItems, null, 2), 'utf-8')
  } else {
    await mkdir(path.dirname(SEED_PATH), { recursive: true })
    await writeFile(SEED_PATH, JSON.stringify(items, null, 2), 'utf-8')
  }
}

export async function listLocalProperties(): Promise<StoredProperty[]> {
  return readStore()
}

export async function getLocalProperty(id: number): Promise<StoredProperty | null> {
  const items = await readStore()
  return items.find(p => p.id === id) ?? null
}

export async function createLocalProperty(
  input: Omit<StoredProperty, 'id' | 'created_at' | 'updated_at' | 'views'>
): Promise<StoredProperty> {
  const items = await readStore()
  const id = items.length ? Math.max(...items.map(p => p.id)) + 1 : 900_001
  const now = new Date().toISOString()
  const record: StoredProperty = { ...input, id, views: 0, created_at: now, updated_at: now }
  items.unshift(record)
  await writeStore(items)
  return record
}

export async function deleteLocalProperty(id: number): Promise<boolean> {
  const items = await readStore()
  const next = items.filter(p => p.id !== id)
  if (next.length === items.length) return false
  await writeStore(next)
  return true
}

export function localToPropertyRow(p: StoredProperty): Record<string, unknown> {
  return {
    ...p,
    type: p.property_type,
    price_eur: p.price,
    area_sqm: p.area,
    city_name: p.city,
    quarter_name: p.quarter,
    city_slug: p.city_slug,
    quarter_slug: p.quarter_slug,
    primary_image: p.main_image,
    is_new: true,
    is_featured: p.id === 900001 || p.id === 900003,
  }
}
