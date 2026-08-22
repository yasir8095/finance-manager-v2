import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { FinanceDatabase } from './database'

export class BackupService {
  private backupDir: string
  
  constructor(private database: FinanceDatabase) {
    this.backupDir = path.join(app.getPath('userData'), 'backups')
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }
  
  createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(this.backupDir, `finance-${timestamp}.db`)
    
    // Copy the database file
    const dbPath = path.join(app.getPath('userData'), 'finance.db')
    
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath)
      
      // Clean up old backups (keep last 30)
      const backups = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('finance-'))
        .sort()
        .reverse()
      
      if (backups.length > 30) {
        backups.slice(30).forEach(file => {
          fs.unlinkSync(path.join(this.backupDir, file))
        })
      }
    }
    
    return backupPath
  }
}
