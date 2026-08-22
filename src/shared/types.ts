export interface Account {
  id: number;
  group_id: number | null;
  name: string;
  bank: string;
  branch: string | null;
  type: string;
  currency: string;
  balance: number;
  account_number: string | null;
  is_credit_card: number;
  linked_account_id: number | null;
  is_active: number;
}

export interface AccountGroup {
  id: number;
  name: string;
  is_active: number;
}

export interface Category {
  id: number;
  name: string;
  linked_account_id: number | null;
  type: string;
  is_active: number;
  sort_order: number | null;
}

export interface BudgetEntry {
  id: number;
  year: number;
  month: number;
  category_id: number;
  amount: number;
}

export interface IncomeEntry {
  id: number;
  year: number;
  month: number;
  source: string;
  amount: number;
}

export interface SchoolFee {
  id: number;
  year: number;
  fee_type: string;
  child_name: string;
  month: number;
  amount: number;
}

export interface SchoolFeeType {
  id: number;
  year: number;
  name: string;
}

export interface SchoolChild {
  id: number;
  year: number;
  name: string;
}

export interface GoldHolding {
  id: number;
  caratage: string;
  bar_size: number;
  units: number;
  total_weight: number;
  purchase_price: number;
  purchase_date: string;
}

export interface GoldPrice {
  id: number;
  date: string;
  price_24ct: number;
  price_22ct: number;
  currency: string;
}

export interface Property {
  id: number;
  name: string;
  purchase_price: number;
  additional_costs: number;
  total_cost: number;
  equity_upfront: number;
  mortgage_amount: number;
  interest_rate: number;
  tenure_years: number;
  emi_amount: number;
  additional_fees: number;
  start_date: string;
  mortgage_schedule?: MortgagePayment[];
}

export interface MortgagePayment {
  id: number;
  property_id: number;
  payment_number: number;
  payment_date: string;
  payment_amount: number;
  principal: number;
  interest: number;
  balance: number;
  is_paid: number;
}

export interface Investment {
  id: number;
  name: string;
  type: 'etf' | 'stock' | 'crypto';
  ticker_symbol: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  currency: string;
  purchase_date: string;
  is_active: number;
}

export interface InsurancePolicy {
  id: number;
  policy_number: string;
  company: string;
  currency: string;
  total_invested: number;
  current_value: number;
  last_updated: string;
  maturity_date: string;
}

export interface CurrencyRate {
  id: number;
  currency: string;
  rate_to_aed: number;
  last_refreshed: string;
  source: string;
}

export interface Settings {
  key: string;
  value: string;
}
