import { db } from './db'

export async function seedGlossary() {
  await db.transaction('rw', db.glossary, async () => {
    const count = await db.glossary.count()
    if (count > 0) return

    const { glossarySeedData } = await import('./glossary-seed')
    await db.glossary.bulkAdd(glossarySeedData)
  })
}
