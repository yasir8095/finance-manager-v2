import { Account, Investment, InsurancePolicy, GoldHolding, Property, MortgagePayment } from '../../shared/types'

export interface NetWorthBreakdown {
  totalNetWorth: number
  accountsValue: number
  investmentsValue: number
  insuranceValue: number
  goldValue: number
  propertyValue: number
}

export interface AmortizationPayment {
  paymentNumber: number
  principal: number
  interest: number
  balance: number
}

export class CalculationEngine {
  // Currency conversion - converts any currency to AED
  static convertToAED(amount: number, fromCurrency: string, rates: Record<string, number>): number {
    if (fromCurrency === 'AED') return amount
    const rate = rates[fromCurrency]
    if (!rate) {
      console.warn(`No exchange rate found for ${fromCurrency}, using 1:1`)
      return amount
    }
    return amount * rate
  }

  // Net worth calculation
  static calculateNetWorth(
    accounts: Account[],
    investments: Investment[],
    insurance: InsurancePolicy[],
    gold: GoldHolding[],
    properties: Property[],
    rates: Record<string, number>,
    goldPrice24ct: number,
    goldPrice22ct: number
  ): NetWorthBreakdown {
    const accountsValue = accounts.reduce((total, account) => {
      const value = this.convertToAED(account.balance, account.currency, rates)
      // Credit cards reduce net worth (they're liabilities)
      return total + (account.is_credit_card ? -value : value)
    }, 0)

    const investmentsValue = investments.reduce((total, inv) => {
      const currentValue = inv.current_price * inv.quantity
      return total + this.convertToAED(currentValue, inv.currency, rates)
    }, 0)

    const insuranceValue = insurance.reduce((total, policy) => {
      return total + this.convertToAED(policy.current_value, policy.currency, rates)
    }, 0)

    const goldValue = gold.reduce((total, holding) => {
      const price = holding.caratage === '24ct' ? goldPrice24ct : goldPrice22ct
      return total + (price * holding.total_weight)
    }, 0)

    const propertyValue = properties.reduce((total, prop) => {
      return total + this.calculatePropertyEquity(prop)
    }, 0)

    return {
      totalNetWorth: accountsValue + investmentsValue + insuranceValue + goldValue + propertyValue,
      accountsValue,
      investmentsValue,
      insuranceValue,
      goldValue,
      propertyValue,
    }
  }

  // Property equity calculation
  static calculatePropertyEquity(property: Property): number {
    const principalPaid = property.mortgage_schedule
      ?.filter(payment => payment.is_paid === 1)
      .reduce((total, payment) => total + payment.principal, 0) || 0
    
    return property.equity_upfront + principalPaid
  }

  // Amortization calculation using standard mortgage formula
  static calculateAmortization(
    principal: number,
    annualRate: number,
    years: number,
    emiAmount?: number
  ): AmortizationPayment[] {
    const monthlyRate = annualRate / 12 / 100
    const numberOfPayments = years * 12
    
    // If EMI is provided, use it; otherwise calculate
    let emi: number
    if (emiAmount && emiAmount > 0) {
      emi = emiAmount
    } else if (monthlyRate === 0) {
      // Zero interest rate - simple division
      emi = principal / numberOfPayments
    } else {
      emi = principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / 
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    }
    
    const schedule: AmortizationPayment[] = []
    let balance = principal
    
    for (let i = 1; i <= numberOfPayments; i++) {
      const interest = balance * monthlyRate
      let principalPayment = emi - interest
      
      // Handle final payment (might be different due to rounding)
      if (i === numberOfPayments) {
        principalPayment = balance
      }
      
      balance -= principalPayment
      
      schedule.push({
        paymentNumber: i,
        principal: principalPayment,
        interest,
        balance: Math.max(0, balance)
      })
    }
    
    return schedule
  }

  // Gold price conversion (USD/oz to AED/gram)
  static convertGoldPrice(usdPerOunce: number, usdToAED: number): number {
    const gramsPerOunce = 31.1035
    const pricePerGram24ct = (usdPerOunce * usdToAED) / gramsPerOunce
    return pricePerGram24ct
  }

  // Calculate 22ct price from 24ct price
  static calculate22ctPrice(price24ct: number): number {
    // 22ct is 91.6% pure, 24ct is 99.9% pure
    const purity22ct = 0.916
    const purity24ct = 0.999
    return price24ct * (purity22ct / purity24ct)
  }

  // Calculate 24ct price from 22ct price
  static calculate24ctPrice(price22ct: number): number {
    const purity22ct = 0.916
    const purity24ct = 0.999
    return price22ct * (purity24ct / purity22ct)
  }

  // Credit card rollover calculation
  static calculateCreditCardRollover(
    expenses: Array<{amount: number, category: string}>,
    creditCardAccount: Account,
    payingAccount: Account,
    month: number,
    year: number
  ): number {
    // Credit card expenses from month N become bills in month N+1
    const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0)
    return totalExpenses
  }

  // Calculate monthly summary from budget entries
  static calculateMonthlySummary(
    budgetEntries: Array<{category_id: number, amount: number}>,
    incomeEntries: Array<{source: string, amount: number}>
  ): {
    totalIncome: number
    totalExpenses: number
    netCashOutflow: number
    netSavings: number
  } {
    const totalIncome = incomeEntries.reduce((total, entry) => total + entry.amount, 0)
    const totalExpenses = budgetEntries.reduce((total, entry) => total + entry.amount, 0)
    const netCashOutflow = totalExpenses // This is money going out
    const netSavings = totalIncome - totalExpenses
    
    return {
      totalIncome,
      totalExpenses,
      netCashOutflow,
      netSavings
    }
  }

  // Calculate investment performance
  static calculateInvestmentPerformance(investment: Investment): {
    totalCost: number
    currentValue: number
    profitLoss: number
    profitLossPercentage: number
  } {
    const totalCost = investment.purchase_price * investment.quantity
    const currentValue = investment.current_price * investment.quantity
    const profitLoss = currentValue - totalCost
    const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0
    
    return {
      totalCost,
      currentValue,
      profitLoss,
      profitLossPercentage
    }
  }

  // Group investments by ticker
  static groupInvestments(investments: Investment[]): Map<string, Investment[]> {
    const grouped = new Map<string, Investment[]>()
    
    investments.forEach(inv => {
      const key = inv.ticker_symbol || inv.name
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(inv)
    })
    
    return grouped
  }

  // Calculate grouped investment summary
  static calculateGroupedInvestmentSummary(group: Investment[]): {
    totalQuantity: number
    totalCost: number
    currentValue: number
    profitLoss: number
    profitLossPercentage: number
    currency: string
  } {
    const totalQuantity = group.reduce((total, inv) => total + inv.quantity, 0)
    const totalCost = group.reduce((total, inv) => total + (inv.purchase_price * inv.quantity), 0)
    const currentValue = group.reduce((total, inv) => total + (inv.current_price * inv.quantity), 0)
    const profitLoss = currentValue - totalCost
    const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0
    
    return {
      totalQuantity,
      totalCost,
      currentValue,
      profitLoss,
      profitLossPercentage,
      currency: group[0]?.currency || 'USD'
    }
  }

  // Calculate outstanding mortgage
  static calculateOutstandingMortgage(property: Property): number {
    if (!property.mortgage_schedule || property.mortgage_schedule.length === 0) {
      return property.mortgage_amount - property.equity_upfront
    }
    
    const paidPayments = property.mortgage_schedule.filter(p => p.is_paid === 1)
    const principalPaid = paidPayments.reduce((total, p) => total + p.principal, 0)
    
    return Math.max(0, property.mortgage_amount - principalPaid)
  }

  // Calculate percentage
  static calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0
    return (value / total) * 100
  }

  // Format currency for display
  static formatCurrency(amount: number, currency: string = 'AED'): string {
    const symbols: Record<string, string> = {
      AED: 'AED ',
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      KWD: 'KWD '
    }
    
    const symbol = symbols[currency] || `${currency} `
    return `${symbol}${amount.toFixed(2)}`
  }

  // Calculate monthly EMI
  static calculateEMI(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 12 / 100
    const numberOfPayments = years * 12
    
    if (monthlyRate === 0) {
      return principal / numberOfPayments
    }
    
    return principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / 
           (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  }

  // Validate financial input
  static validateAmount(amount: any): boolean {
    if (typeof amount !== 'number' || isNaN(amount)) return false
    if (amount < 0) return false
    return true
  }

  static validateDate(date: string): boolean {
    const d = new Date(date)
    return d instanceof Date && !isNaN(d.getTime())
  }

  static validateInterestRate(rate: number): boolean {
    if (typeof rate !== 'number' || isNaN(rate)) return false
    if (rate < 0 || rate > 100) return false
    return true
  }

  // Calculate monthly comparison (year over year or month over month)
  static calculateMonthlyComparison(
    currentMonth: {income: number, expenses: number},
    previousMonth: {income: number, expenses: number}
  ): {
    incomeChange: number
    incomeChangePercentage: number
    expenseChange: number
    expenseChangePercentage: number
  } {
    const incomeChange = currentMonth.income - previousMonth.income
    const incomeChangePercentage = previousMonth.income > 0 ? (incomeChange / previousMonth.income) * 100 : 0
    
    const expenseChange = currentMonth.expenses - previousMonth.expenses
    const expenseChangePercentage = previousMonth.expenses > 0 ? (expenseChange / previousMonth.expenses) * 100 : 0
    
    return {
      incomeChange,
      incomeChangePercentage,
      expenseChange,
      expenseChangePercentage
    }
  }
}
