import { create } from 'zustand'
import { Account, AccountGroup, Category, BudgetEntry, IncomeEntry, Investment, InsurancePolicy, GoldHolding, GoldPrice, Property, CurrencyRate } from '../../shared/types'

interface IncomeSource {
  id: number
  name: string
  is_active: number
  sort_order: number
}

interface FinanceState {
  // Data
  accounts: Account[]
  accountGroups: AccountGroup[]
  categories: Category[]
  budgetEntries: BudgetEntry[]
  incomeSources: IncomeSource[]
  allIncomeSources: IncomeSource[]
  incomeEntries: IncomeEntry[]
  investments: Investment[]
  insurancePolicies: InsurancePolicy[]
  goldHoldings: GoldHolding[]
  goldPrices: GoldPrice[]
  properties: Property[]
  currencyRates: CurrencyRate[]
  
  // UI State
  selectedYear: number
  selectedMonth: number
  theme: 'light' | 'dark'
  isLoading: boolean
  error: string | null
  currentPage: string
  
  // Actions
  setYear: (year: number) => void
  setMonth: (month: number) => void
  toggleTheme: () => void
  setCurrentPage: (page: string) => void
  refreshData: () => Promise<void>
  addAccount: (account: any) => Promise<void>
  updateAccount: (id: number, account: any) => Promise<void>
  deactivateAccount: (id: number) => Promise<void>
  addAccountGroup: (name: string) => Promise<void>
  updateAccountGroup: (id: number, name: string) => Promise<void>
  deactivateAccountGroup: (id: number) => Promise<void>
  addCategory: (category: any) => Promise<void>
  updateCategory: (id: number, category: any) => Promise<void>
  deactivateCategory: (id: number) => Promise<void>
  addBudgetEntry: (entry: any) => Promise<void>
  updateBudgetEntry: (id: number, amount: number) => Promise<void>
  addIncomeSource: (name: string) => Promise<void>
  updateIncomeSource: (id: number, name: string) => Promise<void>
  deactivateIncomeSource: (id: number) => Promise<void>
  reactivateIncomeSource: (id: number) => Promise<void>
  updateIncomeSourceOrder: (id: number, sortOrder: number) => Promise<void>
  addIncomeEntry: (entry: any) => Promise<void>
  addGoldHolding: (holding: any) => Promise<void>
  updateGoldHolding: (id: number, holding: any) => Promise<void>
  deleteGoldHolding: (id: number) => Promise<void>
  addGoldPrice: (price: any) => Promise<void>
  addProperty: (property: any) => Promise<void>
  updateProperty: (id: number, property: any) => Promise<void>
  deleteProperty: (id: number) => Promise<void>
  addInvestment: (investment: any) => Promise<void>
  updateInvestmentPrice: (id: number, price: number) => Promise<void>
  updateInvestmentQuantity: (id: number, quantity: number) => Promise<void>
  updateInvestmentPurchasePrice: (id: number, purchasePrice: number) => Promise<void>
  deleteInvestment: (id: number) => Promise<void>
  addInsurancePolicy: (policy: any) => Promise<void>
  updateInsurancePolicy: (id: number, policy: any) => Promise<void>
  deleteInsurancePolicy: (id: number) => Promise<void>
  addCurrencyRate: (rate: any) => Promise<void>
  addSchoolFeeType: (year: number, name: string) => Promise<void>
  addSchoolChild: (year: number, name: string) => Promise<void>
  addSchoolFee: (fee: any) => Promise<void>
  createBackup: () => Promise<void>
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  // Initial state
  accounts: [],
  accountGroups: [],
  categories: [],
  budgetEntries: [],
  incomeSources: [],
  allIncomeSources: [],
  incomeEntries: [],
  investments: [],
  insurancePolicies: [],
  goldHoldings: [],
  goldPrices: [],
  properties: [],
  currencyRates: [],
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth(),
  theme: 'dark',
  isLoading: false,
  error: null,
  currentPage: 'dashboard',
  
  // Actions
  setYear: (year) => set({ selectedYear: year }),
  setMonth: (month) => set({ selectedMonth: month }),
  toggleTheme: () => set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setCurrentPage: (page) => set({ currentPage: page }),
  
  refreshData: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await (window as any).electronAPI.getFinanceData()
      set({
        accounts: data.accounts,
        accountGroups: data.accountGroups,
        categories: data.categories,
        budgetEntries: data.budgetEntries,
        incomeSources: data.incomeSources,
        allIncomeSources: data.allIncomeSources,
        incomeEntries: data.incomeEntries,
        investments: data.investments,
        insurancePolicies: data.insurancePolicies,
        goldHoldings: data.goldHoldings,
        goldPrices: data.goldPrices,
        properties: data.properties,
        currencyRates: data.currencyRates,
        isLoading: false,
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  addAccount: async (account) => {
    await (window as any).electronAPI.saveAccount(account)
    await get().refreshData()
  },
  
  updateAccount: async (id, account) => {
    await (window as any).electronAPI.updateAccount(id, account)
    await get().refreshData()
  },
  
  deactivateAccount: async (id) => {
    await (window as any).electronAPI.deactivateAccount(id)
    await get().refreshData()
  },
  
  addAccountGroup: async (name) => {
    await (window as any).electronAPI.addAccountGroup(name)
    await get().refreshData()
  },

  updateAccountGroup: async (id, name) => {
    await (window as any).electronAPI.updateAccountGroup(id, name)
    await get().refreshData()
  },

  deactivateAccountGroup: async (id) => {
    await (window as any).electronAPI.deactivateAccountGroup(id)
    await get().refreshData()
  },
  
  addCategory: async (category) => {
    await (window as any).electronAPI.addCategory(category)
    await get().refreshData()
  },

  updateCategory: async (id, category) => {
    await (window as any).electronAPI.updateCategory(id, category)
    await get().refreshData()
  },

  deactivateCategory: async (id) => {
    await (window as any).electronAPI.deactivateCategory(id)
    await get().refreshData()
  },
  
  addBudgetEntry: async (entry) => {
    await (window as any).electronAPI.addBudgetEntry(entry)
    await get().refreshData()
  },
  
  updateBudgetEntry: async (id, amount) => {
    await (window as any).electronAPI.updateBudgetEntry(id, amount)
    await get().refreshData()
  },
  
  addIncomeSource: async (name) => {
    await (window as any).electronAPI.addIncomeSource(name)
    await get().refreshData()
  },
  
  updateIncomeSource: async (id, name) => {
    await (window as any).electronAPI.updateIncomeSource(id, name)
    await get().refreshData()
  },
  
  deactivateIncomeSource: async (id) => {
    await (window as any).electronAPI.deactivateIncomeSource(id)
    await get().refreshData()
  },
  
  reactivateIncomeSource: async (id) => {
    await (window as any).electronAPI.reactivateIncomeSource(id)
    await get().refreshData()
  },
  
  updateIncomeSourceOrder: async (id, sortOrder) => {
    await (window as any).electronAPI.updateIncomeSourceOrder(id, sortOrder)
    await get().refreshData()
  },
  
  addIncomeEntry: async (entry) => {
    await (window as any).electronAPI.addIncomeEntry(entry)
    await get().refreshData()
  },
  
  addGoldHolding: async (holding) => {
    await (window as any).electronAPI.addGoldHolding(holding)
    await get().refreshData()
  },

  updateGoldHolding: async (id, holding) => {
    await (window as any).electronAPI.updateGoldHolding(id, holding)
    await get().refreshData()
  },

  deleteGoldHolding: async (id) => {
    await (window as any).electronAPI.deleteGoldHolding(id)
    await get().refreshData()
  },
  
  addGoldPrice: async (price) => {
    await (window as any).electronAPI.addGoldPrice(price)
    await get().refreshData()
  },
  
  addProperty: async (property) => {
    await (window as any).electronAPI.addProperty(property)
    await get().refreshData()
  },

  updateProperty: async (id, property) => {
    await (window as any).electronAPI.updateProperty(id, property)
    await get().refreshData()
  },

  deleteProperty: async (id) => {
    await (window as any).electronAPI.deleteProperty(id)
    await get().refreshData()
  },
  
  addInvestment: async (investment) => {
    await (window as any).electronAPI.addInvestment(investment)
    await get().refreshData()
  },
  
  updateInvestmentPrice: async (id, price) => {
    await (window as any).electronAPI.updateInvestmentPrice(id, price)
    await get().refreshData()
  },

  updateInvestmentQuantity: async (id, quantity) => {
    await (window as any).electronAPI.updateInvestmentQuantity(id, quantity)
    await get().refreshData()
  },

  updateInvestmentPurchasePrice: async (id, purchasePrice) => {
    await (window as any).electronAPI.updateInvestmentPurchasePrice(id, purchasePrice)
    await get().refreshData()
  },

  deleteInvestment: async (id) => {
    await (window as any).electronAPI.deleteInvestment(id)
    await get().refreshData()
  },

  addRealizedPnl: async (record) => {
    await (window as any).electronAPI.addRealizedPnl(record)
  },
  
  addInsurancePolicy: async (policy) => {
    await (window as any).electronAPI.addInsurancePolicy(policy)
    await get().refreshData()
  },

  updateInsurancePolicy: async (id, policy) => {
    await (window as any).electronAPI.updateInsurancePolicy(id, policy)
    await get().refreshData()
  },

  deleteInsurancePolicy: async (id) => {
    await (window as any).electronAPI.deleteInsurancePolicy(id)
    await get().refreshData()
  },
  
  addCurrencyRate: async (rate) => {
    await (window as any).electronAPI.addCurrencyRate(rate)
    await get().refreshData()
  },
  
  addSchoolFeeType: async (year, name) => {
    await (window as any).electronAPI.addSchoolFeeType(year, name)
    await get().refreshData()
  },
  
  addSchoolChild: async (year, name) => {
    await (window as any).electronAPI.addSchoolChild(year, name)
    await get().refreshData()
  },
  
  addSchoolFee: async (fee) => {
    await (window as any).electronAPI.addSchoolFee(fee)
    await get().refreshData()
  },
  
  createBackup: async () => {
    await (window as any).electronAPI.createBackup()
  },
}))
