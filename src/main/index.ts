import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { FinanceDatabase } from './database'
import { BackupService } from './backup'
import { MainPriceService } from './priceService'

let mainWindow: BrowserWindow | null = null
let database: FinanceDatabase
let backupService: BackupService

// Register FX rate handler early
ipcMain.handle('fetch-fx-rate', async (event, fromCurrency, toCurrency) => {
  console.log('EARLY fetch-fx-rate called:', fromCurrency, 'to', toCurrency)
  const result = await MainPriceService.fetchFXRate(fromCurrency, toCurrency)
  console.log('EARLY fetch-fx-rate result:', result)
  return result
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  database = new FinanceDatabase()
  backupService = new BackupService(database)
  
  createWindow()
  
  app.on('before-quit', () => {
    if (backupService) {
      backupService.createBackup()
    }
  })
  
  setInterval(() => {
    if (backupService) {
      backupService.createBackup()
    }
  }, 24 * 60 * 60 * 1000)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC Handlers
ipcMain.handle('get-finance-data', () => {
  const currentYear = new Date().getFullYear()
  
  return {
    accounts: database.getAllAccounts(),
    accountGroups: database.getAccountGroups(),
    categories: database.getCategories(),
    budgetEntries: database.getBudgetEntriesByYear(currentYear),
    incomeSources: database.getIncomeSources(),
    allIncomeSources: database.getAllIncomeSources(),
    incomeEntries: database.getIncomeEntriesByYear(currentYear),
    goldHoldings: database.getGoldHoldings(),
    goldPrices: database.getGoldPrices(),
    properties: database.getProperties(),
    investments: database.getInvestments(),
    insurancePolicies: database.getInsurancePolicies(),
    currencyRates: database.getCurrencyRates(),
  }
})

ipcMain.handle('save-account', (event, account) => {
  console.log('save-account called:', account)
  try {
    const result = database.addAccount(account)
    console.log('save-account result:', result)
    return result
  } catch (error) {
    console.error('save-account error:', error)
    throw error
  }
})

ipcMain.handle('update-account', (event, id, account) => {
  return database.updateAccount(id, account)
})

ipcMain.handle('deactivate-account', (event, id) => {
  return database.deactivateAccount(id)
})

ipcMain.handle('add-account-group', (event, name) => {
  return database.addAccountGroup(name)
})

ipcMain.handle('update-account-group', (event, id, name) => {
  return database.updateAccountGroup(id, name)
})

ipcMain.handle('deactivate-account-group', (event, id) => {
  return database.deactivateAccountGroup(id)
})

ipcMain.handle('add-category', (event, category) => {
  return database.addCategory(category)
})

ipcMain.handle('update-category', (event, id, category) => {
  return database.updateCategory(id, category)
})

ipcMain.handle('deactivate-category', (event, id) => {
  return database.deactivateCategory(id)
})

ipcMain.handle('get-budget-entries', (event, year) => {
  return database.getBudgetEntriesByYear(year)
})

ipcMain.handle('get-income-entries', (event, year) => {
  return database.getIncomeEntriesByYear(year)
})

ipcMain.handle('add-budget-entry', (event, entry) => {
  return database.addBudgetEntry(entry)
})

ipcMain.handle('update-budget-entry', (event, id, amount) => {
  return database.updateBudgetEntry(id, amount)
})

ipcMain.handle('add-income-source', (event, name) => {
  return database.addIncomeSource(name)
})

ipcMain.handle('update-income-source', (event, id, name) => {
  return database.updateIncomeSource(id, name)
})

ipcMain.handle('deactivate-income-source', (event, id) => {
  return database.deactivateIncomeSource(id)
})

ipcMain.handle('reactivate-income-source', (event, id) => {
  return database.reactivateIncomeSource(id)
})

ipcMain.handle('update-income-source-order', (event, id, sortOrder) => {
  return database.updateIncomeSourceOrder(id, sortOrder)
})

ipcMain.handle('add-income-entry', (event, entry) => {
  return database.addIncomeEntry(entry)
})

ipcMain.handle('add-gold-holding', (event, holding) => {
  return database.addGoldHolding(holding)
})

ipcMain.handle('update-gold-holding', (event, id, holding) => {
  return database.updateGoldHolding(id, holding)
})

ipcMain.handle('delete-gold-holding', (event, id) => {
  return database.deleteGoldHolding(id)
})

ipcMain.handle('add-gold-price', (event, price) => {
  return database.addGoldPrice(price)
})

ipcMain.handle('add-property', (event, property) => {
  return database.addProperty(property)
})

ipcMain.handle('update-property', (event, id, property) => {
  return database.updateProperty(id, property)
})

ipcMain.handle('delete-property', (event, id) => {
  return database.deleteProperty(id)
})

ipcMain.handle('add-investment', (event, investment) => {
  return database.addInvestment(investment)
})

ipcMain.handle('update-investment-price', (event, id, price) => {
  return database.updateInvestmentPrice(id, price)
})

ipcMain.handle('update-investment-quantity', (event, id, quantity) => {
  return database.updateInvestmentQuantity(id, quantity)
})

ipcMain.handle('update-investment-purchase-price', (event, id, purchasePrice) => {
  return database.updateInvestmentPurchasePrice(id, purchasePrice)
})

ipcMain.handle('delete-investment', (event, id) => {
  return database.deleteInvestment(id)
})

ipcMain.handle('add-insurance-policy', (event, policy) => {
  return database.addInsurancePolicy(policy)
})

ipcMain.handle('update-insurance-policy', (event, id, policy) => {
  return database.updateInsurancePolicy(id, policy)
})

ipcMain.handle('delete-insurance-policy', (event, id) => {
  return database.deleteInsurancePolicy(id)
})

ipcMain.handle('add-currency-rate', (event, rate) => {
  return database.addCurrencyRate(rate)
})

ipcMain.handle('get-setting', (event, key) => {
  return database.getSetting(key)
})

ipcMain.handle('set-setting', (event, key, value) => {
  return database.setSetting(key, value)
})

// School Fees
ipcMain.handle('get-school-fees', (event, year) => {
  return database.getSchoolFees(year)
})

ipcMain.handle('get-school-fee-types', (event, year) => {
  return database.getSchoolFeeTypes(year)
})

ipcMain.handle('get-school-children', (event, year) => {
  return database.getSchoolChildren(year)
})

ipcMain.handle('add-school-fee-type', (event, year, name) => {
  return database.addSchoolFeeType(year, name)
})

ipcMain.handle('add-school-child', (event, year, name) => {
  return database.addSchoolChild(year, name)
})

ipcMain.handle('add-school-fee', (event, fee) => {
  return database.addSchoolFee(fee)
})

ipcMain.handle('generate-pdf', async (event, htmlContent, fileName) => {
  try {
    const { BrowserWindow } = require('electron')
    const pdfWindow = new BrowserWindow({ 
      show: false, 
      width: 1200, 
      height: 800 
    })
    
    await pdfWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent))
    
    const pdf = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 }
    })
    
    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_')
    const savePath = path.join(app.getPath('downloads'), safeName)
    fs.writeFileSync(savePath, pdf)
    
    pdfWindow.close()
    
    return { success: true, path: savePath }
  } catch (error) {
    console.error('PDF generation failed:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('add-realized-pnl', (event, record) => {
  return database.addRealizedPnl(record)
})

ipcMain.handle('fetch-gold-price', async () => {
  console.log('fetch-gold-price called')
  const result = await MainPriceService.fetchGoldPrice()
  console.log('fetch-gold-price result:', result)
  return result
})

ipcMain.handle('fetch-etf-price', async (event, ticker) => {
  return await MainPriceService.fetchETFPrice(ticker)
})

ipcMain.handle('fetch-crypto-price', async (event, coinId) => {
  console.log('fetch-crypto-price called for:', coinId)
  const result = await MainPriceService.fetchCryptoPrice(coinId)
  console.log('fetch-crypto-price result:', result)
  return result
})



ipcMain.handle('create-backup', () => {
  return backupService.createBackup()
})
