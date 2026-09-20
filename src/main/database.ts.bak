import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

interface SettingRow {
  value: string
}

export class FinanceDatabase {
  private db: Database.Database

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'finance.db')
    
    // Ensure directory exists
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.initializeSchema()
    this.seedDefaultData()
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER,
        name TEXT NOT NULL,
        bank TEXT NOT NULL,
        branch TEXT,
        type TEXT NOT NULL,
        currency TEXT NOT NULL,
        balance DECIMAL(15,2) DEFAULT 0,
        account_number TEXT,
        is_credit_card INTEGER DEFAULT 0,
        linked_account_id INTEGER,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (group_id) REFERENCES account_groups(id),
        FOREIGN KEY (linked_account_id) REFERENCES accounts(id)
      );

      CREATE TABLE IF NOT EXISTS account_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        linked_account_id INTEGER,
        type TEXT DEFAULT 'expense',
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER,
        FOREIGN KEY (linked_account_id) REFERENCES accounts(id)
      );

      CREATE TABLE IF NOT EXISTS budget_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        amount DECIMAL(15,2) DEFAULT 0,
        UNIQUE(year, month, category_id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS income_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS income_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        source TEXT NOT NULL,
        amount DECIMAL(15,2) DEFAULT 0,
        UNIQUE(year, month, source)
      );

      CREATE TABLE IF NOT EXISTS school_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        fee_type TEXT NOT NULL,
        child_name TEXT NOT NULL,
        month INTEGER NOT NULL,
        amount DECIMAL(15,2) DEFAULT 0,
        UNIQUE(year, fee_type, child_name, month)
      );

      CREATE TABLE IF NOT EXISTS school_fee_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        name TEXT NOT NULL,
        UNIQUE(year, name)
      );

      CREATE TABLE IF NOT EXISTS school_children (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        name TEXT NOT NULL,
        UNIQUE(year, name)
      );

      CREATE TABLE IF NOT EXISTS gold_holdings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        caratage TEXT NOT NULL,
        bar_size REAL,
        units INTEGER,
        total_weight REAL,
        purchase_price DECIMAL(15,2),
        purchase_date DATE
      );

      CREATE TABLE IF NOT EXISTS gold_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        price_24ct DECIMAL(15,2),
        price_22ct DECIMAL(15,2),
        currency TEXT DEFAULT 'AED'
      );

      CREATE TABLE IF NOT EXISTS property (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        purchase_price DECIMAL(15,2),
        additional_costs DECIMAL(15,2),
        total_cost DECIMAL(15,2),
        equity_upfront DECIMAL(15,2),
        mortgage_amount DECIMAL(15,2),
        interest_rate DECIMAL(6,2),
        tenure_years INTEGER,
        emi_amount DECIMAL(15,2),
        additional_fees DECIMAL(15,2),
        start_date DATE
      );

      CREATE TABLE IF NOT EXISTS mortgage_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        payment_number INTEGER NOT NULL,
        payment_date DATE NOT NULL,
        payment_amount DECIMAL(15,2),
        principal DECIMAL(15,2),
        interest DECIMAL(15,2),
        balance DECIMAL(15,2),
        is_paid INTEGER DEFAULT 0,
        FOREIGN KEY (property_id) REFERENCES property(id)
      );

      CREATE TABLE IF NOT EXISTS investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        ticker_symbol TEXT,
        quantity DECIMAL(15,6),
        purchase_price DECIMAL(15,2),
        current_price DECIMAL(15,2),
        currency TEXT,
        purchase_date DATE,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS insurance_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_number TEXT,
        company TEXT NOT NULL,
        currency TEXT,
        total_invested DECIMAL(15,2),
        current_value DECIMAL(15,2),
        last_updated DATE,
        maturity_date DATE
      );

      CREATE TABLE IF NOT EXISTS currency_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        currency TEXT UNIQUE NOT NULL,
        rate_to_aed DECIMAL(15,6),
        last_refreshed DATETIME,
        source TEXT
      );

      CREATE TABLE IF NOT EXISTS realized_pnl (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_type TEXT NOT NULL,
        asset_name TEXT NOT NULL,
        quantity_sold REAL,
        sale_price DECIMAL(15,2),
        cost_basis DECIMAL(15,2),
        realized_pnl DECIMAL(15,2),
        sale_date DATE,
        currency TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `)
  }

  private seedDefaultData() {
    // Seed default account groups
    const groupCount = this.db.prepare('SELECT COUNT(*) as count FROM account_groups').get() as any
    if (groupCount.count === 0) {
      this.db.prepare('INSERT INTO account_groups (name) VALUES (?)').run('YASIR')
      this.db.prepare('INSERT INTO account_groups (name) VALUES (?)').run('SADIYA')
      this.db.prepare('INSERT INTO account_groups (name) VALUES (?)').run('JETSTREAM')
    }

    // Seed default income sources
    const incomeSourceCount = this.db.prepare('SELECT COUNT(*) as count FROM income_sources').get() as any
    if (incomeSourceCount.count === 0) {
      const defaultSources = [
        { name: 'Salary', sort_order: 1 },
        { name: 'Jetstream Consults', sort_order: 2 },
        { name: 'Freelance', sort_order: 3 },
        { name: 'Transfer from Savings', sort_order: 4 },
        { name: 'Other', sort_order: 5 },
      ]
      const stmt = this.db.prepare('INSERT INTO income_sources (name, sort_order) VALUES (?, ?)')
      defaultSources.forEach(src => stmt.run(src.name, src.sort_order))
    }

    // Seed default currency rates
    const rateCount = this.db.prepare('SELECT COUNT(*) as count FROM currency_rates').get() as any
    if (rateCount.count === 0) {
      const stmt = this.db.prepare('INSERT INTO currency_rates (currency, rate_to_aed, last_refreshed, source) VALUES (?, ?, ?, ?)')
      stmt.run('AED', 1, new Date().toISOString(), 'default')
      stmt.run('USD', 3.67, new Date().toISOString(), 'default')
      stmt.run('INR', 0.044, new Date().toISOString(), 'default')
      stmt.run('KWD', 11.93, new Date().toISOString(), 'default')
    }
  }

  // Account methods
  getAccounts() {
    return this.db.prepare('SELECT * FROM accounts WHERE is_active = 1').all()
  }

  getAllAccounts() {
    return this.db.prepare('SELECT * FROM accounts').all()
  }

  addAccount(account: any) {
    const stmt = this.db.prepare(`
      INSERT INTO accounts (group_id, name, bank, branch, type, currency, balance, account_number, is_credit_card, linked_account_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      account.group_id,
      account.name,
      account.bank,
      account.branch,
      account.type,
      account.currency,
      account.balance,
      account.account_number,
      account.is_credit_card || 0,
      account.linked_account_id
    )
    
    // If this is a credit card, auto-create the Bill category
    if (account.is_credit_card === 1 && account.linked_account_id) {
      const billCategoryName = account.name + ' - ' + account.bank + ' - ' + account.type + ' Bill'
      const sortOrder = this.db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 as max_order FROM categories').get() as any
      this.db.prepare('INSERT INTO categories (name, linked_account_id, type, sort_order) VALUES (?, ?, ?, ?)').run(billCategoryName, account.linked_account_id, 'expense', sortOrder.max_order)
    }
    
    return result
  }

  updateAccount(id: number, account: any) {
    // Get old account info to check for name changes
    const oldAccount = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as any
    
    const stmt = this.db.prepare(`
      UPDATE accounts SET
        group_id = ?, name = ?, bank = ?, branch = ?, type = ?,
        currency = ?, balance = ?, account_number = ?,
        is_credit_card = ?, linked_account_id = ?, is_active = ?
      WHERE id = ?
    `)
    const result = stmt.run(
      account.group_id,
      account.name,
      account.bank,
      account.branch,
      account.type,
      account.currency,
      account.balance,
      account.account_number,
      account.is_credit_card || 0,
      account.linked_account_id,
      account.is_active !== undefined ? account.is_active : 1,
      id
    )
  }

  deactivateAccount(id: number) {
    // Get the account being deactivated
    const account = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as any
    
    // Deactivate the account
    const result = this.db.prepare('UPDATE accounts SET is_active = 0 WHERE id = ?').run(id)
    
    // If it's a credit card, deactivate its Bill category
    if (account && account.is_credit_card === 1) {
      const billCategoryName = `${account.name} - ${account.bank} - ${account.type} Bill`
      this.db.prepare('UPDATE categories SET is_active = 0 WHERE name = ? AND linked_account_id = ?').run(billCategoryName, account.linked_account_id)
    }
    
    return result
  }

  // Account Groups
  getAccountGroups() {
    return this.db.prepare('SELECT * FROM account_groups WHERE is_active = 1').all()
  }

  addAccountGroup(name: string) {
    return this.db.prepare('INSERT INTO account_groups (name) VALUES (?)').run(name)
  }

  updateAccountGroup(id: number, name: string) {
    // Update the group name
    const result = this.db.prepare('UPDATE account_groups SET name = ? WHERE id = ?').run(name, id)
    
    // Update all accounts in this group to use the new name
    this.db.prepare('UPDATE accounts SET name = ? WHERE group_id = ?').run(name, id)
    
    return result
  }

  deactivateAccountGroup(id: number) {
    return this.db.prepare('UPDATE account_groups SET is_active = 0 WHERE id = ?').run(id)
  }

  // Categories
  getCategories() {
    return this.db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order').all()
  }

  addCategory(category: any) {
    const stmt = this.db.prepare(`
      INSERT INTO categories (name, linked_account_id, type, sort_order)
      VALUES (?, ?, ?, ?)
    `)
    return stmt.run(category.name, category.linked_account_id, category.type || 'expense', category.sort_order)
  }

  updateCategory(id: number, category: any) {
    const stmt = this.db.prepare(`
      UPDATE categories SET
        name = ?, linked_account_id = ?, sort_order = ?
      WHERE id = ?
    `)
    return stmt.run(category.name, category.linked_account_id, category.sort_order, id)
  }

  deactivateCategory(id: number) {
    return this.db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').run(id)
  }

  // Budget Entries
  getBudgetEntries(year: number, month: number) {
    return this.db.prepare('SELECT * FROM budget_entries WHERE year = ? AND month = ?').all(year, month)
  }

  getBudgetEntriesByYear(year: number) {
    return this.db.prepare('SELECT * FROM budget_entries WHERE year = ?').all(year)
  }

  addBudgetEntry(entry: any) {
    const stmt = this.db.prepare(`
      INSERT INTO budget_entries (year, month, category_id, amount)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(year, month, category_id) DO UPDATE SET amount = excluded.amount
    `)
    return stmt.run(entry.year, entry.month, entry.category_id, entry.amount)
  }

  updateBudgetEntry(id: number, amount: number) {
    return this.db.prepare('UPDATE budget_entries SET amount = ? WHERE id = ?').run(amount, id)
  }

  // Income Sources
  getIncomeSources() {
    return this.db.prepare('SELECT * FROM income_sources WHERE is_active = 1 ORDER BY sort_order').all()
  }

  getAllIncomeSources() {
    return this.db.prepare('SELECT * FROM income_sources ORDER BY sort_order').all()
  }

  addIncomeSource(name: string) {
    const stmt = this.db.prepare('INSERT INTO income_sources (name, sort_order) VALUES (?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM income_sources))')
    return stmt.run(name)
  }

  updateIncomeSource(id: number, name: string) {
    return this.db.prepare('UPDATE income_sources SET name = ? WHERE id = ?').run(name, id)
  }

  deactivateIncomeSource(id: number) {
    return this.db.prepare('UPDATE income_sources SET is_active = 0 WHERE id = ?').run(id)
  }

  reactivateIncomeSource(id: number) {
    return this.db.prepare('UPDATE income_sources SET is_active = 1 WHERE id = ?').run(id)
  }

  updateIncomeSourceOrder(id: number, sortOrder: number) {
    return this.db.prepare('UPDATE income_sources SET sort_order = ? WHERE id = ?').run(sortOrder, id)
  }

  // Income Entries
  getIncomeEntries(year: number, month: number) {
    return this.db.prepare('SELECT * FROM income_entries WHERE year = ? AND month = ?').all(year, month)
  }

  getIncomeEntriesByYear(year: number) {
    return this.db.prepare('SELECT * FROM income_entries WHERE year = ?').all(year)
  }

  addIncomeEntry(entry: any) {
    const stmt = this.db.prepare(`
      INSERT INTO income_entries (year, month, source, amount)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(year, month, source) DO UPDATE SET amount = excluded.amount
    `)
    return stmt.run(entry.year, entry.month, entry.source, entry.amount)
  }

  updateIncomeEntry(id: number, amount: number) {
    return this.db.prepare('UPDATE income_entries SET amount = ? WHERE id = ?').run(amount, id)
  }

  // Gold Holdings
  getGoldHoldings() {
    return this.db.prepare('SELECT * FROM gold_holdings').all()
  }

  addGoldHolding(holding: any) {
    const stmt = this.db.prepare(`
      INSERT INTO gold_holdings (caratage, bar_size, units, total_weight, purchase_price, purchase_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(
      holding.caratage,
      holding.bar_size,
      holding.units,
      holding.total_weight,
      holding.purchase_price,
      holding.purchase_date
    )
  }

  updateGoldHolding(id: number, holding: any) {
    return this.db.prepare('UPDATE gold_holdings SET units = ?, total_weight = ? WHERE id = ?').run(holding.units, holding.total_weight, id)
  }

  deleteGoldHolding(id: number) {
    return this.db.prepare('DELETE FROM gold_holdings WHERE id = ?').run(id)
  }

  // Gold Prices
  getGoldPrices() {
    return this.db.prepare('SELECT * FROM gold_prices ORDER BY date DESC, id DESC LIMIT 30').all()
  }

  addGoldPrice(price: any) {
    const stmt = this.db.prepare(`
      INSERT INTO gold_prices (date, price_24ct, price_22ct, currency)
      VALUES (?, ?, ?, ?)
    `)
    return stmt.run(price.date, price.price_24ct, price.price_22ct, price.currency || 'AED')
  }

  // Property
  getProperties() {
    return this.db.prepare('SELECT * FROM property').all()
  }

  addProperty(property: any) {
    const stmt = this.db.prepare(`
      INSERT INTO property (name, purchase_price, additional_costs, total_cost, equity_upfront, mortgage_amount, interest_rate, tenure_years, emi_amount, additional_fees, start_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(
      property.name,
      property.purchase_price,
      property.additional_costs,
      property.total_cost,
      property.equity_upfront,
      property.mortgage_amount,
      property.interest_rate,
      property.tenure_years,
      property.emi_amount,
      property.additional_fees,
      property.start_date
    )
  }

  updateProperty(id: number, property: any) {
    const stmt = this.db.prepare(`
      UPDATE property SET
        name = ?, purchase_price = ?, additional_costs = ?, total_cost = ?,
        equity_upfront = ?, mortgage_amount = ?, interest_rate = ?,
        tenure_years = ?, emi_amount = ?, additional_fees = ?, start_date = ?
      WHERE id = ?
    `)
    return stmt.run(
      property.name,
      property.purchase_price,
      property.additional_costs,
      property.total_cost,
      property.equity_upfront,
      property.mortgage_amount,
      property.interest_rate,
      property.tenure_years,
      property.emi_amount,
      property.additional_fees,
      property.start_date,
      id
    )
  }

  deleteProperty(id: number) {
    // Delete mortgage schedule first (foreign key)
    this.db.prepare('DELETE FROM mortgage_schedule WHERE property_id = ?').run(id)
    return this.db.prepare('DELETE FROM property WHERE id = ?').run(id)
  }

  // Mortgage Schedule
  getMortgageSchedule(propertyId: number) {
    return this.db.prepare('SELECT * FROM mortgage_schedule WHERE property_id = ? ORDER BY payment_number').all(propertyId)
  }

  addMortgagePayment(payment: any) {
    const stmt = this.db.prepare(`
      INSERT INTO mortgage_schedule (property_id, payment_number, payment_date, payment_amount, principal, interest, balance, is_paid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(
      payment.property_id,
      payment.payment_number,
      payment.payment_date,
      payment.payment_amount,
      payment.principal,
      payment.interest,
      payment.balance,
      payment.is_paid || 0
    )
  }

  // Investments
  getInvestments() {
    return this.db.prepare('SELECT * FROM investments WHERE is_active = 1').all()
  }

  addInvestment(investment: any) {
    const stmt = this.db.prepare(`
      INSERT INTO investments (name, type, ticker_symbol, quantity, purchase_price, current_price, currency, purchase_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(
      investment.name,
      investment.type,
      investment.ticker_symbol,
      investment.quantity,
      investment.purchase_price,
      investment.current_price,
      investment.currency,
      investment.purchase_date
    )
  }

  updateInvestmentPrice(id: number, currentPrice: number) {
    return this.db.prepare('UPDATE investments SET current_price = ? WHERE id = ?').run(currentPrice, id)
  }

  updateInvestmentQuantity(id: number, quantity: number) {
    return this.db.prepare('UPDATE investments SET quantity = ? WHERE id = ?').run(quantity, id)
  }

  deleteInvestment(id: number) {
    return this.db.prepare('UPDATE investments SET is_active = 0 WHERE id = ?').run(id)
  }

  // Insurance
  getInsurancePolicies() {
    return this.db.prepare('SELECT * FROM insurance_policies').all()
  }

  addInsurancePolicy(policy: any) {
    const stmt = this.db.prepare(`
      INSERT INTO insurance_policies (policy_number, company, currency, total_invested, current_value, last_updated, maturity_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(
      policy.policy_number,
      policy.company,
      policy.currency,
      policy.total_invested,
      policy.current_value,
      policy.last_updated,
      policy.maturity_date
    )
  }

  // Currency Rates
  getCurrencyRates() {
    return this.db.prepare('SELECT * FROM currency_rates').all()
  }

  addCurrencyRate(rate: any) {
    const stmt = this.db.prepare(`
      INSERT INTO currency_rates (currency, rate_to_aed, last_refreshed, source)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(currency) DO UPDATE SET
        rate_to_aed = excluded.rate_to_aed,
        last_refreshed = excluded.last_refreshed,
        source = excluded.source
    `)
    return stmt.run(rate.currency, rate.rate_to_aed, rate.last_refreshed, rate.source)
  }

  // Settings
  getSetting(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as SettingRow | undefined
    return row ? row.value : null
  }

  setSetting(key: string, value: string) {
    return this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value)
  }

  // School Fees
  getSchoolFees(year: number) {
    return this.db.prepare('SELECT * FROM school_fees WHERE year = ?').all(year)
  }

  getSchoolFeeTypes(year: number) {
    return this.db.prepare('SELECT * FROM school_fee_types WHERE year = ?').all(year)
  }

  getSchoolChildren(year: number) {
    return this.db.prepare('SELECT * FROM school_children WHERE year = ?').all(year)
  }

  addSchoolFeeType(year: number, name: string) {
    return this.db.prepare('INSERT INTO school_fee_types (year, name) VALUES (?, ?)').run(year, name)
  }

  addSchoolChild(year: number, name: string) {
    return this.db.prepare('INSERT INTO school_children (year, name) VALUES (?, ?)').run(year, name)
  }

  addSchoolFee(fee: any) {
    const stmt = this.db.prepare(`
      INSERT INTO school_fees (year, fee_type, child_name, month, amount)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(year, fee_type, child_name, month) DO UPDATE SET amount = excluded.amount
    `)
    return stmt.run(fee.year, fee.fee_type, fee.child_name, fee.month, fee.amount)
  }

  addRealizedPnl(record: any) {
    const stmt = this.db.prepare(`
      INSERT INTO realized_pnl (asset_type, asset_name, quantity_sold, sale_price, cost_basis, realized_pnl, sale_date, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(
      record.asset_type,
      record.asset_name,
      record.quantity_sold,
      record.sale_price,
      record.cost_basis,
      record.realized_pnl,
      record.sale_date,
      record.currency
    )
  }

  close() {
    this.db.close()
  }
}
