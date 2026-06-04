import { useRef } from 'react'
import { Settings, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useDataExport } from '@/features/settings/hooks/useDataExport'

export default function SettingsPage() {
  const { addToast } = useToast()
  const { exportData, importData } = useDataExport()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    try {
      await exportData()
      addToast({ title: 'Data exported successfully' })
    } catch {
      addToast({ title: 'Export failed', variant: 'destructive' })
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await importData(file)
    if (result.success) {
      addToast({ title: `Data imported successfully (${result.tableCount} tables restored)` })
    } else {
      addToast({ title: `Import failed: ${result.error}`, variant: 'destructive' })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-display font-semibold text-foreground">Settings</h2>
        <p className="text-body text-muted-foreground">App configuration and data management.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-body font-semibold">Data Management</CardTitle>
          <CardDescription className="text-label text-muted-foreground">
            Export your data to protect against browser storage loss.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </CardContent>
      </Card>
    </div>
  )
}
