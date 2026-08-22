import React, { useState, useEffect } from 'react'
import { useFinanceStore } from '../store/financeStore'

export default function Reports() {
  const { 
    selectedYear,
    selectedMonth,
    categories,
    accounts,
    budgetEntries,
    incomeEntries,
    investments,
    insurancePolicies,
    goldHoldings,
    properties,
    currencyRates,
    goldPrices,
    incomeSources
  } = useFinanceStore()
  
  const [reportYear, setReportYear] = useState(selectedYear)
  const [reportMonth, setReportMonth] = useState(selectedMonth)
  const [reportQuarter, setReportQuarter] = useState(Math.floor(selectedMonth / 3))
  
  const rates: Record<string, number> = { AED: 1 }
  currencyRates.forEach(r => { rates[r.currency] = r.rate_to_aed })
  
  const goldPrice24ct = goldPrices.length > 0 ? goldPrices[0].price_24ct : 0
  const goldPrice22ct = goldPrices.length > 0 ? goldPrices[0].price_22ct : 0
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const quarterNames = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)']
  
  // Build budget and income maps
  const budgetMap: Record<string, number> = {}
  budgetEntries.forEach(e => { budgetMap[`${e.category_id}-${e.month}`] = e.amount })
  
  const incomeMap: Record<string, number> = {}
  incomeEntries.forEach(e => { incomeMap[`${e.source}-${e.month}`] = e.amount })
  
  const getBudgetCell = (categoryId: number, month: number) => budgetMap[`${categoryId}-${month}`] || 0
  const getIncomeCell = (source: string, month: number) => incomeMap[`${source}-${month}`] || 0
  
  const calculateIncomeMonthTotal = (month: number) => 
    incomeSources.map(s => s.name)
      .reduce((sum, src) => sum + getIncomeCell(src, month), 0)
  
  const calculateGrossExpense = (month: number) => 
    categories.reduce((sum, cat) => sum + getBudgetCell(cat.id, month), 0)
  
  const calculateNetCashOutflow = (month: number) => 
    categories.reduce((sum, cat) => {
      const val = getBudgetCell(cat.id, month)
      if (!val) return sum
      const account = accounts.find(a => a.id === cat.linked_account_id)
      if (account?.is_credit_card) return sum
      return sum + val
    }, 0)
  
  const calculateSavings = (month: number) => calculateIncomeMonthTotal(month) - calculateNetCashOutflow(month)
  
  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '-'
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(amount)
  }
  
  // Calculate totals for asset report
  const totalAccounts = accounts.reduce((sum, acct) => sum + (acct.balance || 0) * (rates[acct.currency] || 1), 0)
  const totalInvestments = investments.reduce((sum, inv) => {
    const value = (inv.quantity || 0) * (inv.current_price || 0)
    if (inv.currency === 'USD') return sum + value * (rates['USD'] || 3.67)
    return sum + value
  }, 0)
  const totalInsurance = insurancePolicies.reduce((sum, p) => sum + (p.current_value || 0) * (rates[p.currency] || 1), 0)
  const totalGold = goldHoldings.reduce((sum, h) => sum + (h.total_weight || 0) * (h.caratage === '24ct' ? goldPrice24ct : goldPrice22ct), 0)
  
  let currentEquity = 0
  if (properties.length > 0) {
    const property = properties[0]
    const schedule = property.mortgage_amount > 0 ? 
      (window as any).calculateAmortization ? 
        (window as any).calculateAmortization(property.mortgage_amount, property.interest_rate, property.tenure_years, property.emi_amount) :
        [] : []
    const startDate = new Date(property.start_date)
    const today = new Date()
    const paidPrincipal = schedule
      .filter((payment: any) => {
        const paymentDate = new Date(startDate)
        paymentDate.setMonth(paymentDate.getMonth() + payment.paymentNumber - 1)
        return paymentDate <= today
      })
      .reduce((sum: number, p: any) => sum + p.principal, 0)
    currentEquity = property.equity_upfront + paidPrincipal
  }
  
  const totalNetWorth = totalAccounts + totalInvestments + totalInsurance + totalGold + currentEquity
  
  const quarterlyMonths = [reportQuarter * 3, reportQuarter * 3 + 1, reportQuarter * 3 + 2]
  
  const reportStyles = `
    body { font-family: 'Inter', Arial, sans-serif; color: #1a1a1a; margin: 40px; }
    h1 { text-align: center; font-size: 24px; margin-bottom: 5px; color: #0a1628; }
    .subtitle { text-align: center; font-size: 16px; color: #495057; margin-bottom: 3px; }
    .date { text-align: center; font-size: 12px; color: #6c757d; margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: 700; color: #0a1628; margin: 20px 0 10px; border-bottom: 2px solid #c9a54a; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th { text-align: left; padding: 8px; font-size: 12px; color: #6c757d; border-bottom: 1px solid #dee2e6; }
    td { padding: 8px; font-size: 13px; border-bottom: 1px solid #f1f3f5; }
    .amount { text-align: right; font-weight: 600; }
    .total-row { font-weight: 700; background: #f8f9fa; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
    .summary-item { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; }
    .summary-label { font-size: 11px; color: #6c757d; }
    .summary-value { font-size: 18px; font-weight: 700; }
  `
  
  const generateMonthlyReportHTML = () => {
    const incomeRows = incomeSources.map(s => s.name)
      .filter(src => getIncomeCell(src, reportMonth) > 0)
      .map(src => `<tr><td>${src}</td><td class="amount">${formatCurrency(getIncomeCell(src, reportMonth))}</td></tr>`).join('')
    
    const groupedCategories: Record<string, any[]> = {}
    categories.forEach(cat => {
      const account = accounts.find(a => a.id === cat.linked_account_id)
      const group = account ? `${account.name} - ${account.bank} - ${account.type}` : 'Ungrouped'
      if (!groupedCategories[group]) groupedCategories[group] = []
      groupedCategories[group].push(cat)
    })
    
    const expenseGroups = Object.entries(groupedCategories).map(([group, groupCats]) => {
      const rows = groupCats
        .filter(cat => getBudgetCell(cat.id, reportMonth) > 0)
        .map(cat => `<tr><td style="padding-left: 20px;">${cat.name}</td><td class="amount">${formatCurrency(getBudgetCell(cat.id, reportMonth))}</td></tr>`).join('')
      const total = groupCats.reduce((sum, cat) => sum + getBudgetCell(cat.id, reportMonth), 0)
      if (total === 0) return ''
      return `<tr><td style="font-weight: 600; color: #0a1628;">${group}</td><td class="amount" style="font-weight:700;">${formatCurrency(total)}</td></tr>${rows}`
    }).join('')
    
    return `<!DOCTYPE html><html><head><style>${reportStyles}</style></head><body>
      <h1>Monthly Financial Report</h1>
      <p class="subtitle">${fullMonthNames[reportMonth]} ${reportYear}</p>
      <p class="date">Generated on ${new Date().toLocaleDateString('en-GB')}</p>
      <div class="summary-grid">
        <div class="summary-item"><p class="summary-label">Total Income</p><p class="summary-value positive">${formatCurrency(calculateIncomeMonthTotal(reportMonth))}</p></div>
        <div class="summary-item"><p class="summary-label">Gross Expense</p><p class="summary-value negative">${formatCurrency(calculateGrossExpense(reportMonth))}</p></div>
        <div class="summary-item"><p class="summary-label">Net Outflow</p><p class="summary-value">${formatCurrency(calculateNetCashOutflow(reportMonth))}</p></div>
        <div class="summary-item"><p class="summary-label">Net Savings</p><p class="summary-value ${calculateSavings(reportMonth) >= 0 ? 'positive' : 'negative'}">${formatCurrency(calculateSavings(reportMonth))}</p></div>
      </div>
      <h2 class="section-title">Income Details</h2>
      <table><thead><tr><th>Source</th><th class="amount">Amount</th></tr></thead><tbody>${incomeRows || '<tr><td colspan="2" style="text-align:center; color:#6c757d;">No income recorded</td></tr>'}</tbody></table>
      <h2 class="section-title">Expense Breakdown</h2>
      <table><thead><tr><th>Category</th><th class="amount">Amount</th></tr></thead><tbody>${expenseGroups || '<tr><td colspan="2" style="text-align:center; color:#6c757d;">No expenses recorded</td></tr>'}</tbody></table>
      <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #6c757d;">Generated by Finance Manager</div>
    </body></html>`
  }
  
  const generateQuarterlyReportHTML = () => {
    const rows = quarterlyMonths.map(m => `
      <tr><td>${monthNames[m]}</td><td class="amount">${formatCurrency(calculateIncomeMonthTotal(m))}</td><td class="amount">${formatCurrency(calculateGrossExpense(m))}</td><td class="amount ${calculateSavings(m) >= 0 ? 'positive' : 'negative'}">${formatCurrency(calculateSavings(m))}</td></tr>
    `).join('')
    return `<!DOCTYPE html><html><head><style>${reportStyles}</style></head><body>
      <h1>Quarterly Financial Report</h1>
      <p class="subtitle">${quarterNames[reportQuarter]} ${reportYear}</p>
      <p class="date">Generated on ${new Date().toLocaleDateString('en-GB')}</p>
      <h2 class="section-title">Summary</h2>
      <table><thead><tr><th>Month</th><th class="amount">Income</th><th class="amount">Expenses</th><th class="amount">Savings</th></tr></thead><tbody>${rows}
      <tr class="total-row"><td>Total</td><td class="amount">${formatCurrency(quarterlyMonths.reduce((s, m) => s + calculateIncomeMonthTotal(m), 0))}</td><td class="amount">${formatCurrency(quarterlyMonths.reduce((s, m) => s + calculateGrossExpense(m), 0))}</td><td class="amount">${formatCurrency(quarterlyMonths.reduce((s, m) => s + calculateSavings(m), 0))}</td></tr></tbody></table>
    </body></html>`
  }
  
  const generateAnnualReportHTML = () => {
    const rows = monthNames.map((m, i) => `
      <tr><td>${m}</td><td class="amount">${formatCurrency(calculateIncomeMonthTotal(i))}</td><td class="amount">${formatCurrency(calculateGrossExpense(i))}</td><td class="amount ${calculateSavings(i) >= 0 ? 'positive' : 'negative'}">${formatCurrency(calculateSavings(i))}</td></tr>
    `).join('')
    return `<!DOCTYPE html><html><head><style>${reportStyles}</style></head><body>
      <h1>Annual Financial Report</h1>
      <p class="subtitle">${reportYear}</p>
      <p class="date">Generated on ${new Date().toLocaleDateString('en-GB')}</p>
      <h2 class="section-title">Monthly Summary</h2>
      <table><thead><tr><th>Month</th><th class="amount">Income</th><th class="amount">Expenses</th><th class="amount">Savings</th></tr></thead><tbody>${rows}
      <tr class="total-row"><td>Total</td><td class="amount">${formatCurrency(monthNames.reduce((s, m, i) => s + calculateIncomeMonthTotal(i), 0))}</td><td class="amount">${formatCurrency(monthNames.reduce((s, m, i) => s + calculateGrossExpense(i), 0))}</td><td class="amount">${formatCurrency(monthNames.reduce((s, m, i) => s + calculateSavings(i), 0))}</td></tr></tbody></table>
    </body></html>`
  }
  
  const generateAssetReportHTML = () => {
    const invRows = investments.map(inv => { 
      const pnl = (inv.quantity || 0) * ((inv.current_price || 0) - (inv.purchase_price || 0))
      return `<tr><td>${inv.name}</td><td class="amount ${pnl >= 0 ? 'positive' : 'negative'}">${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}</td></tr>` 
    }).join('')
    const policyRows = insurancePolicies.map(p => { 
      const pnl = (p.current_value || 0) - (p.total_invested || 0)
      return `<tr><td>${p.company} - ${p.policy_number}</td><td class="amount ${pnl >= 0 ? 'positive' : 'negative'}">${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}</td></tr>` 
    }).join('')
    return `<!DOCTYPE html><html><head><style>${reportStyles}</style></head><body>
      <h1>Asset Report</h1>
      <p class="date">Generated on ${new Date().toLocaleDateString('en-GB')}</p>
      <div class="summary-grid">
        <div class="summary-item"><p class="summary-label">Cash</p><p class="summary-value">${formatCurrency(totalAccounts)}</p></div>
        <div class="summary-item"><p class="summary-label">Investments</p><p class="summary-value">${formatCurrency(totalInvestments)}</p></div>
        <div class="summary-item"><p class="summary-label">Insurance</p><p class="summary-value">${formatCurrency(totalInsurance)}</p></div>
        <div class="summary-item"><p class="summary-label">Gold</p><p class="summary-value">${formatCurrency(totalGold)}</p></div>
        <div class="summary-item"><p class="summary-label">Property Equity</p><p class="summary-value">${formatCurrency(currentEquity)}</p></div>
        <div class="summary-item"><p class="summary-label">Net Worth</p><p class="summary-value">${formatCurrency(totalNetWorth)}</p></div>
      </div>
      <h2 class="section-title">Investment Performance</h2>
      <table><thead><tr><th>Name</th><th class="amount">P&L</th></tr></thead><tbody>${invRows}${policyRows || '<tr><td colspan="2" style="text-align:center; color:#6c757d;">No investments</td></tr>'}</tbody></table>
    </body></html>`
  }
  
  const handleExportPDF = async (reportType: string) => {
    const htmlContent = reportType === 'monthly' ? generateMonthlyReportHTML() :
                        reportType === 'quarterly' ? generateQuarterlyReportHTML() :
                        reportType === 'annual' ? generateAnnualReportHTML() : generateAssetReportHTML()
    
    const genYear = new Date().getFullYear()
    let periodDesc = ''
    if (reportType === 'monthly') periodDesc = `MONTHLY-${monthNames[reportMonth]}-${reportYear}`
    else if (reportType === 'quarterly') periodDesc = `QUARTERLY-${quarterNames[reportQuarter].replace(/[()]/g, '').replace(/ /g, '-')}-${reportYear}`
    else if (reportType === 'annual') periodDesc = `ANNUAL-${reportYear}`
    else periodDesc = 'ASSET-REPORT'
    
    const fileName = `${genYear}-YASIR-FIN-${periodDesc}.pdf`
    
    const result = await (window as any).electronAPI.generatePDF(htmlContent, fileName)
    if (result.success) {
      alert('PDF saved to: ' + result.path)
    } else {
      alert('Failed to generate PDF: ' + result.error)
    }
  }
  
  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '5px' }}>Reports</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '30px' }}>Generate and export financial reports</p>
      
      {/* Monthly Report Section */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '25px', marginBottom: '20px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Monthly Report</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>Full detail for a specific month</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => { if (reportMonth === 0) { setReportMonth(11); setReportYear(reportYear - 1) } else { setReportMonth(reportMonth - 1) } }} style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>←</button>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{monthNames[reportMonth]} {reportYear}</span>
            <button onClick={() => { if (reportMonth === 11) { setReportMonth(0); setReportYear(reportYear + 1) } else { setReportMonth(reportMonth + 1) } }} style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>→</button>
            <button onClick={() => handleExportPDF('monthly')} style={{ padding: '8px 15px', background: '#c9a54a', color: '#0a1628', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>🖨 Export PDF</button>
          </div>
        </div>
      </div>
      
      {/* Quarterly Report Section */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '25px', marginBottom: '20px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Quarterly Report</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>3-month summary</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => { if (reportQuarter === 0) { setReportQuarter(3); setReportYear(reportYear - 1) } else { setReportQuarter(reportQuarter - 1) } }} style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>←</button>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{quarterNames[reportQuarter]} {reportYear}</span>
            <button onClick={() => { if (reportQuarter === 3) { setReportQuarter(0); setReportYear(reportYear + 1) } else { setReportQuarter(reportQuarter + 1) } }} style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>→</button>
            <button onClick={() => handleExportPDF('quarterly')} style={{ padding: '8px 15px', background: '#c9a54a', color: '#0a1628', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>🖨 Export PDF</button>
          </div>
        </div>
      </div>
      
      {/* Annual Report Section */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '25px', marginBottom: '20px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Annual Report</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>Full year summary</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => setReportYear(reportYear - 1)} style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>←</button>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{reportYear}</span>
            <button onClick={() => setReportYear(reportYear + 1)} style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>→</button>
            <button onClick={() => handleExportPDF('annual')} style={{ padding: '8px 15px', background: '#c9a54a', color: '#0a1628', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>🖨 Export PDF</button>
          </div>
        </div>
      </div>
      
      {/* Asset Report Section */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '25px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Asset Report</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>Current assets and investment performance</p>
          </div>
          <button onClick={() => handleExportPDF('asset')} style={{ padding: '8px 15px', background: '#c9a54a', color: '#0a1628', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>🖨 Export PDF</button>
        </div>
      </div>
    </div>
  )
}
