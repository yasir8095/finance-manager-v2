import { describe, it, expect } from 'vitest'
import { CalculationEngine } from '../src/renderer/services/calculations'
import { Account, Investment, InsurancePolicy, GoldHolding, Property } from '../src/shared/types'

describe('CalculationEngine', () => {
  describe('convertToAED', () => {
    it('should return same value for AED', () => {
      const result = CalculationEngine.convertToAED(100, 'AED', { AED: 1 })
      expect(result).toBe(100)
    })

    it('should convert USD to AED correctly', () => {
      const rates = { AED: 1, USD: 3.67 }
      const result = CalculationEngine.convertToAED(100, 'USD', rates)
      expect(result).toBe(367)
    })

    it('should handle missing rate gracefully', () => {
      const result = CalculationEngine.convertToAED(100, 'XYZ', { AED: 1 })
      expect(result).toBe(100)
    })
  })

  describe('calculateNetWorth', () => {
    it('should calculate net worth from all components', () => {
      const accounts: Account[] = [
        {
          id: 1, group_id: 1, name: 'YASIR', bank: 'ENBD', branch: null,
          type: 'CURRENT', currency: 'AED', balance: 10000, account_number: null,
          is_credit_card: 0, linked_account_id: null, is_active: 1
        },
        {
          id: 2, group_id: 1, name: 'YASIR', bank: 'ENBD', branch: null,
          type: 'VISA', currency: 'AED', balance: 5000, account_number: null,
          is_credit_card: 1, linked_account_id: 1, is_active: 1
        }
      ]

      const investments: Investment[] = [
        {
          id: 1, name: 'VOO', type: 'etf', ticker_symbol: 'VOO',
          quantity: 10, purchase_price: 400, current_price: 450,
          currency: 'USD', purchase_date: '2024-01-01', is_active: 1
        }
      ]

      const insurance: InsurancePolicy[] = [
        {
          id: 1, policy_number: 'POL123', company: 'LIC',
          currency: 'AED', total_invested: 10000, current_value: 12000,
          last_updated: '2026-08-21', maturity_date: '2030-01-01'
        }
      ]

      const gold: GoldHolding[] = [
        {
          id: 1, caratage: '24ct', bar_size: 100, units: 1,
          total_weight: 100, purchase_price: 20000, purchase_date: '2024-01-01'
        }
      ]

      const properties: Property[] = [
        {
          id: 1, name: 'Home', purchase_price: 500000, additional_costs: 20000,
          total_cost: 520000, equity_upfront: 100000, mortgage_amount: 400000,
          interest_rate: 4.5, tenure_years: 25, emi_amount: 2200,
          additional_fees: 0, start_date: '2024-01-01',
          mortgage_schedule: [
            {
              id: 1, property_id: 1, payment_number: 1, payment_date: '2024-02-01',
              payment_amount: 2200, principal: 700, interest: 1500,
              balance: 399300, is_paid: 1
            }
          ]
        }
      ]

      const rates = { AED: 1, USD: 3.67 }
      const result = CalculationEngine.calculateNetWorth(
        accounts, investments, insurance, gold, properties, rates, 300, 275
      )

      // Accounts: 10000 - 5000 = 5000
      // Investments: 4500 * 3.67 = 16515
      // Insurance: 12000
      // Gold: 300 * 100 = 30000
      // Property: 100000 + 700 = 100700
      // Total: 5000 + 16515 + 12000 + 30000 + 100700 = 164215
      expect(result.accountsValue).toBe(5000)
      expect(result.investmentsValue).toBeCloseTo(16515)
      expect(result.insuranceValue).toBe(12000)
      expect(result.goldValue).toBe(30000)
      expect(result.propertyValue).toBe(100700)
      expect(result.totalNetWorth).toBeCloseTo(164215)
    })

    it('should handle empty data', () => {
      const result = CalculationEngine.calculateNetWorth([], [], [], [], [], { AED: 1 }, 0, 0)
      expect(result.totalNetWorth).toBe(0)
      expect(result.accountsValue).toBe(0)
      expect(result.investmentsValue).toBe(0)
      expect(result.insuranceValue).toBe(0)
      expect(result.goldValue).toBe(0)
      expect(result.propertyValue).toBe(0)
    })
  })

  describe('calculatePropertyEquity', () => {
    it('should calculate equity from upfront and paid principal', () => {
      const property: Property = {
        id: 1, name: 'Home', purchase_price: 500000, additional_costs: 0,
        total_cost: 500000, equity_upfront: 100000, mortgage_amount: 400000,
        interest_rate: 4.5, tenure_years: 25, emi_amount: 2200,
        additional_fees: 0, start_date: '2024-01-01',
        mortgage_schedule: [
          {
            id: 1, property_id: 1, payment_number: 1, payment_date: '2024-02-01',
            payment_amount: 2200, principal: 700, interest: 1500,
            balance: 399300, is_paid: 1
          },
          {
            id: 2, property_id: 1, payment_number: 2, payment_date: '2024-03-01',
            payment_amount: 2200, principal: 702.63, interest: 1497.37,
            balance: 398597.37, is_paid: 0
          }
        ]
      }

      const equity = CalculationEngine.calculatePropertyEquity(property)
      expect(equity).toBe(100700)
    })
  })

  describe('calculateAmortization', () => {
    it('should generate correct amortization schedule', () => {
      const schedule = CalculationEngine.calculateAmortization(100000, 12, 1)
      
      expect(schedule).toHaveLength(12)
      expect(schedule[0].balance).toBeLessThan(100000)
      expect(schedule[11].balance).toBeCloseTo(0, 1)
      
      // Sum of principal should equal total principal
      const totalPrincipal = schedule.reduce((sum, p) => sum + p.principal, 0)
      expect(totalPrincipal).toBeCloseTo(100000, 0)
    })

    it('should handle zero interest rate', () => {
      const schedule = CalculationEngine.calculateAmortization(12000, 0, 1)
      
      expect(schedule).toHaveLength(12)
      expect(schedule[0].interest).toBe(0)
      expect(schedule[0].principal).toBe(1000)
      expect(schedule[11].balance).toBeCloseTo(0, 1)
    })
  })

  describe('convertGoldPrice', () => {
    it('should convert USD/oz to AED/gram correctly', () => {
      const usdPerOunce = 2500
      const usdToAED = 3.67
      const result = CalculationEngine.convertGoldPrice(usdPerOunce, usdToAED)
      
      // 2500 * 3.67 / 31.1035
      expect(result).toBeCloseTo(294.94, 1)
    })
  })

  describe('calculate22ctPrice', () => {
    it('should calculate 22ct price from 24ct price', () => {
      const price24ct = 300
      const price22ct = CalculationEngine.calculate22ctPrice(price24ct)
      
      // 300 * 0.916 / 0.999
      expect(price22ct).toBeCloseTo(275.08, 1)
    })
  })

  describe('calculate24ctPrice', () => {
    it('should calculate 24ct price from 22ct price', () => {
      const price22ct = 275
      const price24ct = CalculationEngine.calculate24ctPrice(price22ct)
      
      // 275 * 0.999 / 0.916
      expect(price24ct).toBeCloseTo(299.92, 1)
    })
  })

  describe('calculateMonthlySummary', () => {
    it('should calculate income, expenses, and savings correctly', () => {
      const budgetEntries = [
        { category_id: 1, amount: 1000 },
        { category_id: 2, amount: 500 }
      ]
      const incomeEntries = [
        { source: 'Salary', amount: 3000 },
        { source: 'Rent', amount: 1000 }
      ]
      
      const result = CalculationEngine.calculateMonthlySummary(budgetEntries, incomeEntries)
      
      expect(result.totalIncome).toBe(4000)
      expect(result.totalExpenses).toBe(1500)
      expect(result.netCashOutflow).toBe(1500)
      expect(result.netSavings).toBe(2500)
    })

    it('should handle empty arrays', () => {
      const result = CalculationEngine.calculateMonthlySummary([], [])
      
      expect(result.totalIncome).toBe(0)
      expect(result.totalExpenses).toBe(0)
      expect(result.netSavings).toBe(0)
    })
  })

  describe('calculateInvestmentPerformance', () => {
    it('should calculate profit correctly', () => {
      const investment: Investment = {
        id: 1, name: 'AAPL', type: 'stock', ticker_symbol: 'AAPL',
        quantity: 10, purchase_price: 150, current_price: 200,
        currency: 'USD', purchase_date: '2024-01-01', is_active: 1
      }
      
      const result = CalculationEngine.calculateInvestmentPerformance(investment)
      
      expect(result.totalCost).toBe(1500)
      expect(result.currentValue).toBe(2000)
      expect(result.profitLoss).toBe(500)
      expect(result.profitLossPercentage).toBeCloseTo(33.33, 1)
    })

    it('should calculate loss correctly', () => {
      const investment: Investment = {
        id: 1, name: 'AAPL', type: 'stock', ticker_symbol: 'AAPL',
        quantity: 10, purchase_price: 200, current_price: 150,
        currency: 'USD', purchase_date: '2024-01-01', is_active: 1
      }
      
      const result = CalculationEngine.calculateInvestmentPerformance(investment)
      
      expect(result.profitLoss).toBe(-500)
      expect(result.profitLossPercentage).toBeCloseTo(-25, 1)
    })
  })

  describe('groupInvestments', () => {
    it('should group investments by ticker', () => {
      const investments: Investment[] = [
        {
          id: 1, name: 'VOO Lot 1', type: 'etf', ticker_symbol: 'VOO',
          quantity: 10, purchase_price: 400, current_price: 450,
          currency: 'USD', purchase_date: '2024-01-01', is_active: 1
        },
        {
          id: 2, name: 'VOO Lot 2', type: 'etf', ticker_symbol: 'VOO',
          quantity: 5, purchase_price: 420, current_price: 450,
          currency: 'USD', purchase_date: '2024-02-01', is_active: 1
        },
        {
          id: 3, name: 'BTC', type: 'crypto', ticker_symbol: 'BTC',
          quantity: 0.1, purchase_price: 60000, current_price: 65000,
          currency: 'USD', purchase_date: '2024-01-01', is_active: 1
        }
      ]
      
      const grouped = CalculationEngine.groupInvestments(investments)
      
      expect(grouped.size).toBe(2)
      expect(grouped.get('VOO')).toHaveLength(2)
      expect(grouped.get('BTC')).toHaveLength(1)
    })
  })

  describe('calculateGroupedInvestmentSummary', () => {
    it('should calculate grouped summary correctly', () => {
      const group: Investment[] = [
        {
          id: 1, name: 'VOO Lot 1', type: 'etf', ticker_symbol: 'VOO',
          quantity: 10, purchase_price: 400, current_price: 450,
          currency: 'USD', purchase_date: '2024-01-01', is_active: 1
        },
        {
          id: 2, name: 'VOO Lot 2', type: 'etf', ticker_symbol: 'VOO',
          quantity: 5, purchase_price: 420, current_price: 450,
          currency: 'USD', purchase_date: '2024-02-01', is_active: 1
        }
      ]
      
      const result = CalculationEngine.calculateGroupedInvestmentSummary(group)
      
      expect(result.totalQuantity).toBe(15)
      expect(result.totalCost).toBe(6100)
      expect(result.currentValue).toBe(6750)
      expect(result.profitLoss).toBe(650)
      expect(result.currency).toBe('USD')
    })
  })

  describe('calculateOutstandingMortgage', () => {
    it('should calculate outstanding mortgage correctly', () => {
      const property: Property = {
        id: 1, name: 'Home', purchase_price: 500000, additional_costs: 0,
        total_cost: 500000, equity_upfront: 100000, mortgage_amount: 400000,
        interest_rate: 4.5, tenure_years: 25, emi_amount: 2200,
        additional_fees: 0, start_date: '2024-01-01',
        mortgage_schedule: [
          {
            id: 1, property_id: 1, payment_number: 1, payment_date: '2024-02-01',
            payment_amount: 2200, principal: 700, interest: 1500,
            balance: 399300, is_paid: 1
          }
        ]
      }
      
      const outstanding = CalculationEngine.calculateOutstandingMortgage(property)
      expect(outstanding).toBe(399300)
    })

    it('should handle property without schedule', () => {
      const property: Property = {
        id: 1, name: 'Home', purchase_price: 500000, additional_costs: 0,
        total_cost: 500000, equity_upfront: 100000, mortgage_amount: 400000,
        interest_rate: 4.5, tenure_years: 25, emi_amount: 2200,
        additional_fees: 0, start_date: '2024-01-01'
      }
      
      const outstanding = CalculationEngine.calculateOutstandingMortgage(property)
      expect(outstanding).toBe(300000)
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(CalculationEngine.calculatePercentage(50, 200)).toBe(25)
    })

    it('should handle zero total', () => {
      expect(CalculationEngine.calculatePercentage(50, 0)).toBe(0)
    })
  })

  describe('formatCurrency', () => {
    it('should format different currencies', () => {
      expect(CalculationEngine.formatCurrency(100, 'AED')).toBe('AED 100.00')
      expect(CalculationEngine.formatCurrency(100, 'USD')).toBe('$100.00')
      expect(CalculationEngine.formatCurrency(100, 'EUR')).toBe('€100.00')
      expect(CalculationEngine.formatCurrency(100, 'INR')).toBe('₹100.00')
    })
  })

  describe('calculateEMI', () => {
    it('should calculate EMI correctly', () => {
      const emi = CalculationEngine.calculateEMI(100000, 12, 1)
      expect(emi).toBeGreaterThan(0)
      expect(emi).toBeLessThan(100000)
    })

    it('should handle zero interest rate', () => {
      const emi = CalculationEngine.calculateEMI(12000, 0, 1)
      expect(emi).toBe(1000)
    })
  })

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(CalculationEngine.validateAmount(100)).toBe(true)
      expect(CalculationEngine.validateAmount(0)).toBe(true)
      expect(CalculationEngine.validateAmount(-100)).toBe(false)
      expect(CalculationEngine.validateAmount('100')).toBe(false)
      expect(CalculationEngine.validateAmount(NaN)).toBe(false)
    })
  })

  describe('validateDate', () => {
    it('should validate dates', () => {
      expect(CalculationEngine.validateDate('2024-01-01')).toBe(true)
      expect(CalculationEngine.validateDate('invalid')).toBe(false)
    })
  })

  describe('validateInterestRate', () => {
    it('should validate interest rates', () => {
      expect(CalculationEngine.validateInterestRate(5)).toBe(true)
      expect(CalculationEngine.validateInterestRate(0)).toBe(true)
      expect(CalculationEngine.validateInterestRate(-1)).toBe(false)
      expect(CalculationEngine.validateInterestRate(101)).toBe(false)
    })
  })

  describe('calculateMonthlyComparison', () => {
    it('should calculate monthly changes correctly', () => {
      const current = { income: 5000, expenses: 3000 }
      const previous = { income: 4000, expenses: 2500 }
      
      const result = CalculationEngine.calculateMonthlyComparison(current, previous)
      
      expect(result.incomeChange).toBe(1000)
      expect(result.incomeChangePercentage).toBe(25)
      expect(result.expenseChange).toBe(500)
      expect(result.expenseChangePercentage).toBe(20)
    })

    it('should handle zero previous values', () => {
      const current = { income: 5000, expenses: 3000 }
      const previous = { income: 0, expenses: 0 }
      
      const result = CalculationEngine.calculateMonthlyComparison(current, previous)
      
      expect(result.incomeChange).toBe(5000)
      expect(result.incomeChangePercentage).toBe(0)
    })
  })
})
