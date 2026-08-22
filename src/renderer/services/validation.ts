export class ValidationService {
  // Generic validation
  static required(value: string): boolean {
    return value.trim().length > 0
  }
  
  static isNumber(value: any): boolean {
    if (typeof value !== 'number') return false
    if (isNaN(value)) return true // treat NaN as 0 for optional fields
    return true
  }
  
  static isNonNegative(value: number): boolean {
    if (isNaN(value)) return true // treat empty as valid
    return value >= 0
  }
  
  static isPositive(value: number): boolean {
    if (isNaN(value)) return false // empty is not positive
    return value > 0
  }
  
  static isPercentage(value: number): boolean {
    return this.isNonNegative(value) && value <= 100
  }
  
  static isDate(value: string): boolean {
    const d = new Date(value)
    return d instanceof Date && !isNaN(d.getTime())
  }
  
  // Specific validations
  static validateAccountName(name: string): string | null {
    if (!this.required(name)) return 'Name is required'
    if (name.length < 2) return 'Name must be at least 2 characters'
    return null
  }
  
  static validateBank(bank: string): string | null {
    if (!this.required(bank)) return 'Bank is required'
    return null
  }
  
  static validateBalance(balance: number): string | null {
    if (!this.isNonNegative(balance)) return 'Balance must be a non-negative number'
    return null
  }
  
  static validateBudgetAmount(amount: number): string | null {
    if (amount < 0) return 'Amount cannot be negative'
    return null
  }
  
  static validateGoldWeight(weight: number): string | null {
    if (isNaN(weight) || weight <= 0) return 'Weight must be a positive number'
    return null
  }
  
  static validateGoldPrice(price: number): string | null {
    if (!this.isPositive(price)) return 'Price must be a positive number'
    return null
  }
  
  static validatePropertyPrice(price: number): string | null {
    if (!this.isNonNegative(price)) return 'Price must be a non-negative number'
    return null
  }
  
  static validateMortgageAmount(amount: number): string | null {
    if (!this.isNonNegative(amount)) return 'Mortgage amount must be a non-negative number'
    return null
  }
  
  static validateEMI(emi: number): string | null {
    if (!this.isNonNegative(emi)) return 'EMI must be a non-negative number'
    return null
  }
  
  static validateTenure(years: number): string | null {
    if (!this.isPositive(years)) return 'Tenure must be a positive number'
    if (years > 50) return 'Tenure cannot exceed 50 years'
    return null
  }
  
  static validateInvestmentQuantity(qty: number): string | null {
    if (!this.isPositive(qty)) return 'Quantity must be a positive number'
    return null
  }
  
  static validateInvestmentPrice(price: number): string | null {
    if (!this.isNonNegative(price)) return 'Price must be a non-negative number'
    return null
  }
  
  static validateInsuranceValue(value: number): string | null {
    if (!this.isNonNegative(value)) return 'Value must be a non-negative number'
    return null
  }
  
  static validateSchoolFeeAmount(amount: number): string | null {
    if (amount < 0) return 'Amount cannot be negative'
    return null
  }
}
