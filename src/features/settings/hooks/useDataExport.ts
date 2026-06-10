import { useCallback } from 'react'
import { db } from '@/stores/db'

const TABLE_NAMES = [
  'goals',
  'transactions',
  'portfolios',
  'journals',
  'scorecardWeights',
  'riskProfiles',
  'glossary',
  'goalHoldings',
  'reviewSettings',
] as const

type TableName = (typeof TABLE_NAMES)[number]

interface ExportData {
  version: number
  exportedAt: string
  tables: Partial<Record<TableName, unknown[]>>
}

export function useDataExport() {
  const exportData = useCallback(async () => {
    const tables: ExportData['tables'] = {}

    for (const name of TABLE_NAMES) {
      const table = (db as any)[name]
      if (table) {
        tables[name] = await table.toArray()
      }
    }

    const payload: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tables,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `investor-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const importData = useCallback(async (file: File) => {
    const text = await file.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return { success: false, tableCount: 0, error: 'Invalid JSON file' }
    }

    if (typeof data !== 'object' || data === null) {
      return { success: false, tableCount: 0, error: 'Invalid export format' }
    }

    const payload = data as Record<string, unknown>
    if (payload.version !== 1) {
      return { success: false, tableCount: 0, error: 'Unsupported export version' }
    }

    const tables = payload.tables
    if (typeof tables !== 'object' || tables === null) {
      return { success: false, tableCount: 0, error: 'Missing tables data' }
    }

    const tableRecords = tables as Record<string, unknown[]>
    const tableNames = Object.keys(tableRecords).filter(key =>
      TABLE_NAMES.includes(key as TableName),
    )

    if (tableNames.length === 0) {
      return { success: false, tableCount: 0, error: 'No recognizable tables found in export' }
    }

    try {
      await db.transaction('rw', [...tableNames.map(n => (db as any)[n])] as any, async () => {
        for (const name of tableNames) {
          const table = (db as any)[name]
          await table.clear()
          const records = tableRecords[name]
          if (records && records.length > 0) {
            await table.bulkAdd(records)
          }
        }
      })
    } catch (e) {
      return {
        success: false,
        tableCount: 0,
        error: `Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
      }
    }

    return { success: true, tableCount: tableNames.length, error: undefined }
  }, [])

  return { exportData, importData }
}
