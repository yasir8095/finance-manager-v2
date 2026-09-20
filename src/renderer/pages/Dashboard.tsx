import React, { useEffect } from 'react'
import { useFinanceStore } from '../store/financeStore'
import { CalculationEngine } from '../services/calculations'

export default function Dashboard() {
  const { 
    accounts, 
    investments, 
    insurancePolicies, 
    goldHoldings, 
    properties, 
    currencyRates, 
    goldPrices,

    budgetEntries,
    incomeEntries
  } = useFinanceStore()
  
  const [netWorthHistory, setNetWorthHistory] = React.useState<Array<{date: string, value: number}>>([])
  const [schoolFeesData, setSchoolFeesData] = React.useState<Record<number, number>>({})
  const [dashBudgetEntries, setDashBudgetEntries] = React.useState<any[]>([])
  const [dashIncomeEntries, setDashIncomeEntries] = React.useState<any[]>([])
  
  // Dashboard always shows current real month/year
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed
  
  useEffect(() => {
    loadDashboardData()
  }, [])
  
  const loadDashboardData = async () => {
    try {
      // Load budget and income entries for current year (independent of Budget page)
      const budgetEntriesData = await (window as any).electronAPI.getBudgetEntries(currentYear)
      const incomeEntriesData = await (window as any).electronAPI.getIncomeEntries(currentYear)
      setDashBudgetEntries(budgetEntriesData)
      setDashIncomeEntries(incomeEntriesData)
      
      // Load school fees for current year
      const fees = await (window as any).electronAPI.getSchoolFees(currentYear)
      const feesByMonth: Record<number, number> = {}
      fees.forEach((fee: any) => {
        if (!feesByMonth[fee.month]) feesByMonth[fee.month] = 0
        feesByMonth[fee.month] += parseFloat(fee.amount) || 0
      })
      setSchoolFeesData(feesByMonth)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }
  
  const rates: Record<string, number> = { AED: 1 }
  currencyRates.forEach(rate => {
    rates[rate.currency] = rate.rate_to_aed
  })
  
  const goldPrice24ct = goldPrices.length > 0 ? goldPrices[0].price_24ct : 0
  const goldPrice22ct = goldPrices.length > 0 ? goldPrices[0].price_22ct : 0
  
  // Calculate net worth
  const totalAccounts = accounts.reduce((sum, acct) => {
    const value = (acct.balance || 0) * (rates[acct.currency] || 1)
    return sum + (acct.is_credit_card === 1 ? -value : value)
  }, 0)
  const totalInvestments = investments.reduce((sum, inv) => {
    const value = (inv.quantity || 0) * (inv.current_price || 0)
    if (inv.currency === 'USD') return sum + value * (rates['USD'] || 3.67)
    return sum + value
  }, 0)
  const totalInsurance = insurancePolicies.reduce((sum, p) => sum + (p.current_value || 0) * (rates[p.currency] || 1), 0)
  const totalGold = goldHoldings.reduce((sum, h) => sum + (h.total_weight || 0) * (h.caratage === '24ct' ? goldPrice24ct : goldPrice22ct), 0)
  
  // Calculate property equity across ALL properties
  let currentEquity = 0
  let outstandingMortgage = 0
  const today = new Date()
  
  properties.forEach(property => {
    const schedule = CalculationEngine.calculateAmortization(
      property.mortgage_amount,
      property.interest_rate,
      property.tenure_years,
      property.emi_amount
    )
    const startDate = new Date(property.start_date)
    const paidPrincipal = schedule
      .filter(payment => {
        const paymentDate = new Date(startDate)
        paymentDate.setMonth(paymentDate.getMonth() + payment.paymentNumber - 1)
        return paymentDate <= today
      })
      .reduce((sum, p) => sum + p.principal, 0)
    
    currentEquity += property.equity_upfront + paidPrincipal
    outstandingMortgage += property.mortgage_amount - paidPrincipal
  })
  
  const netWorth = totalAccounts + totalInvestments + totalInsurance + totalGold + currentEquity
  
  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '-'
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(amount)
  }
  
  const formatCurrencyWithCurrency = (amount: number, currency: string) => {
    if (!amount && amount !== 0) return '-'
    const curr = currency || 'AED'
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: curr, maximumFractionDigits: 0 }).format(amount)
  }
  
  const assetBreakdown = [
    { label: 'Cash', value: totalAccounts, color: '#3b82f6' },
    { label: 'Stocks & ETFs', value: investments.filter(i => i.type === 'etf' || i.type === 'stock').reduce((s, i) => s + (i.quantity || 0) * (i.current_price || 0) * (i.currency === 'USD' ? (rates['USD'] || 3.67) : 1), 0), color: '#10b981' },
    { label: 'Crypto', value: investments.filter(i => i.type === 'crypto').reduce((s, i) => s + (i.quantity || 0) * (i.current_price || 0), 0), color: '#f59e0b' },
    { label: 'Insurance', value: totalInsurance, color: '#8b5cf6' },
    { label: 'Gold', value: totalGold, color: '#c9a54a' },
    { label: 'Property Equity', value: currentEquity, color: '#b0445c' },
  ]
  
  // Group investments by ticker
  const groupedInvestments: Record<string, any[]> = {}
  investments.forEach(inv => {
    const key = inv.ticker_symbol || inv.name
    if (!groupedInvestments[key]) groupedInvestments[key] = []
    groupedInvestments[key].push(inv)
  })
  
  const consolidatedPerformance = Object.entries(groupedInvestments).map(([key, lots]) => {
    const totalQty = lots.reduce((sum, lot) => sum + (lot.quantity || 0), 0)
    const totalCost = lots.reduce((sum, lot) => sum + (lot.quantity || 0) * (lot.purchase_price || 0), 0)
    const currentValue = totalQty * (lots[0].current_price || 0)
    const currency = lots[0].currency || 'USD'
    return { name: key.toUpperCase(), pnl: currentValue - totalCost, currency: currency }
  })
  
  const insurancePerformance = insurancePolicies.map(p => ({
    name: `${p.company} - ${p.policy_number}`,
    pnl: (p.current_value || 0) - (p.total_invested || 0),
    currency: p.currency || 'USD'
  }))
  
  const investmentPerformance = [...consolidatedPerformance, ...insurancePerformance]
  
  // Mortgage snapshot - combined across all properties
  const schedule: any[] = []
  let totalCount = 0
  let paidCount = 0
  let paidPrincipalTotal = 0
  
  properties.forEach(property => {
    const propSchedule = CalculationEngine.calculateAmortization(
      property.mortgage_amount,
      property.interest_rate,
      property.tenure_years,
      property.emi_amount
    )
    const startDate = new Date(property.start_date)
    propSchedule.forEach(payment => {
      const paymentDate = new Date(startDate)
      paymentDate.setMonth(paymentDate.getMonth() + payment.paymentNumber - 1)
      const isPaid = paymentDate <= today
      totalCount++
      if (isPaid) {
        paidCount++
        paidPrincipalTotal += payment.principal
      }
    })
  })
  
  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '5px' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '30px' }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '2px solid #c9a54a' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Net Worth</p>
          <p style={{ fontSize: '26px', fontWeight: '700', color: '#d4b36a', marginTop: '5px' }}>{formatCurrency(netWorth)}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Outstanding Mortgage</p>
          <p style={{ fontSize: '26px', fontWeight: '700', color: '#b0445c', marginTop: '5px' }}>{formatCurrency(outstandingMortgage)}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Monthly Income</p>
          <p style={{ fontSize: '26px', fontWeight: '700', color: '#10b981', marginTop: '5px' }}>
            {formatCurrency(dashIncomeEntries.filter(ie => ie.year === currentYear && ie.month === currentMonth).reduce((sum, ie) => sum + ie.amount, 0))}
          </p>
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Monthly Expenses</p>
          <p style={{ fontSize: '26px', fontWeight: '700', color: '#ef4444', marginTop: '5px' }}>
            {formatCurrency(dashBudgetEntries.filter(be => be.year === currentYear && be.month === currentMonth).reduce((sum, be) => sum + be.amount, 0) + (schoolFeesData[currentMonth + 1] || 0))}
          </p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '15px' }}>Asset Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assetBreakdown.map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(item.value)}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', minWidth: '40px', textAlign: 'right' }}>
                  {netWorth > 0 ? ((item.value / netWorth) * 100).toFixed(1) + '%' : '0%'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '15px' }}>Credit Card Alerts</h3>
          {accounts.filter(a => a.is_credit_card === 1).length > 0 ? (
            accounts.filter(a => a.is_credit_card === 1).map(card => (
              <div key={card.id} style={{ padding: '10px', marginBottom: '8px', background: 'rgba(176,68,92,0.1)', borderRadius: '6px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {card.name} - {card.bank} {card.type}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                  Balance: {formatCurrencyWithCurrency(card.balance, card.currency)}
                </p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>No credit cards</p>
          )}
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '15px' }}>Investment Performance</h3>
          {investmentPerformance.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {investmentPerformance.map((inv, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{inv.name}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: inv.pnl >= 0 ? '#10b981' : '#ef4444' }}>
                    {inv.pnl >= 0 ? '+' : ''}{formatCurrencyWithCurrency(inv.pnl, inv.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>No investments yet</p>
          )}
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '15px' }}>Mortgage Snapshot</h3>
          {properties.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Installments Paid: <strong style={{ color: 'var(--text-primary)' }}>{paidCount} of {totalCount}</strong>
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Amount Paid: <strong style={{ color: '#d4b36a' }}>{formatCurrency(paidPrincipalTotal)}</strong>
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Outstanding: <strong style={{ color: '#b0445c' }}>{formatCurrency(outstandingMortgage)}</strong>
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>No property added</p>
          )}
        </div>
      </div>
      
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)', marginBottom: '25px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '15px' }}>Upcoming Bills (7 Days)</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>No bills due this week</p>
      </div>
      
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '15px' }}>Monthly Comparison</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Data will appear after first month</p>
      </div>
    </div>
  )
}
