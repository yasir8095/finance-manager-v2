import React, { useState, useEffect } from 'react'
import { useFinanceStore } from '../store/financeStore'

export default function Budget() {
  const { 
    selectedYear, 
    selectedMonth, 
    setYear, 
    setMonth,
    categories,
    accounts,
    accountGroups,
    budgetEntries,
    incomeEntries,
    incomeSources,
    addBudgetEntry,
    updateBudgetEntry,
    addIncomeEntry
  } = useFinanceStore()
  
  const [viewMode, setViewMode] = useState<'month' | 'year'>('year')
  const [budgetData, setBudgetData] = useState<Record<string, string>>({})
  const [incomeData, setIncomeData] = useState<Record<string, string>>({})
  const [schoolFeesData, setSchoolFeesData] = useState<Record<number, number>>({})
  const saveTimer = React.useRef<any>(null)
  
  useEffect(() => {
    // Build maps from entries
    const budgetMap: Record<string, string> = {}
    budgetEntries.forEach(entry => {
      budgetMap[`${entry.category_id}-${entry.month}`] = entry.amount.toString()
    })
    setBudgetData(budgetMap)
    
    const incomeMap: Record<string, string> = {}
    incomeEntries.forEach(entry => {
      incomeMap[`${entry.source}-${entry.month}`] = entry.amount.toString()
    })
    setIncomeData(incomeMap)
  }, [budgetEntries, incomeEntries])
  
  useEffect(() => {
    loadSchoolFees()
  }, [selectedYear])
  
  const loadSchoolFees = async () => {
    try {
      const fees = await (window as any).electronAPI.getSchoolFees(selectedYear)
      const feesByMonth: Record<number, number> = {}
      fees.forEach((fee: any) => {
        if (!feesByMonth[fee.month]) feesByMonth[fee.month] = 0
        feesByMonth[fee.month] += parseFloat(fee.amount) || 0
      })
      setSchoolFeesData(feesByMonth)
    } catch (error) {
      console.error('Failed to load school fees:', error)
      setSchoolFeesData({})
    }
  }
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  // Group categories by linked account (payment method)
  const groupedCategories: Record<string, any[]> = {}
  categories.forEach(cat => {
    const account = accounts.find(a => a.id === cat.linked_account_id)
    const accountGroup = account?.group_id ? accountGroups.find(g => g.id === account.group_id) : null
    const groupName = accountGroup?.name || account?.name || 'Ungrouped'
    const group = account ? `${groupName} - ${account.bank} - ${account.type}` : 'Ungrouped'
    if (!groupedCategories[group]) groupedCategories[group] = []
    groupedCategories[group].push(cat)
  })
  
  // Find school fees category
  const schoolFeesCategory = categories.find(cat => cat.name === 'School Fees')
  
  const setBudgetCell = (categoryId: number, month: number, value: string) => {
    const key = `${categoryId}-${month}`
    setBudgetData(prev => ({ ...prev, [key]: value }))
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const existing = budgetEntries.find(be => be.category_id === categoryId && be.month === month)
      if (existing) {
        await updateBudgetEntry(existing.id, parseFloat(value) || 0)
      } else {
        await addBudgetEntry({ year: selectedYear, month, category_id: categoryId, amount: parseFloat(value) || 0 })
      }
    }, 500)
  }
  
  const getBudgetCell = (categoryId: number, month: number) => {
    // Auto-populate school fees
    if (schoolFeesCategory && categoryId === schoolFeesCategory.id) {
      const schoolFeeTotal = schoolFeesData[month + 1] || 0
      return schoolFeeTotal > 0 ? schoolFeeTotal.toString() : ''
    }
    
    // Auto-populate credit card bill rollover
    const category = categories.find(c => c.id === categoryId)
    if (category && category.name.endsWith(' Bill') && month > 0) {
      // Extract credit card name from Bill category name
      // Format: "YASIR - ENBD - VISA Bill" -> "YASIR - ENBD - VISA"
      const ccName = category.name.replace(/ Bill$/, '')
      
      // Find the specific credit card account
      const creditCard = accounts.find(a => {
        const fullName = `${a.name} - ${a.bank} - ${a.type}`
        return fullName === ccName && a.is_credit_card === 1
      })
      
      if (creditCard) {
        // Sum expenses assigned to this specific credit card in previous month
        const ccCategories = categories.filter(c => c.linked_account_id === creditCard.id)
        let rolloverTotal = 0
        ccCategories.forEach(ccCat => {
          const prevMonthVal = budgetData[`${ccCat.id}-${month - 1}`] || '0'
          rolloverTotal += parseFloat(prevMonthVal) || 0
        })
        if (rolloverTotal > 0) {
          return rolloverTotal.toString()
        }
      }
    }
    
    const key = `${categoryId}-${month}`
    return budgetData[key] || ''
  }
  
  const setIncomeCell = (source: string, month: number, value: string) => {
    const key = `${source}-${month}`
    setIncomeData(prev => ({ ...prev, [key]: value }))
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await addIncomeEntry({ year: selectedYear, month, source, amount: parseFloat(value) || 0 })
    }, 500)
  }
  
  const getIncomeCell = (source: string, month: number) => {
    const key = `${source}-${month}`
    return incomeData[key] || ''
  }
  
  const copyToAllMonths = (categoryId: number, value: string, fromMonth: number) => {
    const updates: Record<string, string> = {}
    for (let m = fromMonth + 1; m < 12; m++) {
      updates[`${categoryId}-${m}`] = value
    }
    setBudgetData(prev => ({ ...prev, ...updates }))
    for (let m = fromMonth + 1; m < 12; m++) {
      addBudgetEntry({ year: selectedYear, month: m, category_id: categoryId, amount: parseFloat(value) || 0 })
    }
  }
  
  const copyIncomeToAllMonths = (source: string, value: string, fromMonth: number) => {
    const updates: Record<string, string> = {}
    for (let m = fromMonth + 1; m < 12; m++) {
      updates[`${source}-${m}`] = value
    }
    setIncomeData(prev => ({ ...prev, ...updates }))
    for (let m = fromMonth + 1; m < 12; m++) {
      addIncomeEntry({ year: selectedYear, month: m, source, amount: parseFloat(value) || 0 })
    }
  }
  
  const calculateGroupMonthTotal = (groupCats: any[], month: number) => {
    let total = 0
    groupCats.forEach(cat => {
      const val = getBudgetCell(cat.id, month)
      if (val) total += parseFloat(val) || 0
    })
    return total
  }
  
  const calculateIncomeMonthTotal = (month: number) => {
    let total = 0
    incomeSources.forEach(source => {
      const val = getIncomeCell(source.name, month)
      if (val) total += parseFloat(val) || 0
    })
    return total
  }
  
  const calculateGrossExpense = (month: number) => {
    let total = 0
    categories.forEach(cat => {
      const val = getBudgetCell(cat.id, month)
      if (val) total += parseFloat(val) || 0
    })
    return total
  }
  
  const calculateNetCashOutflow = (month: number) => {
    let total = 0
    categories.forEach(cat => {
      const val = getBudgetCell(cat.id, month)
      if (!val) return
      const account = accounts.find(a => a.id === cat.linked_account_id)
      if (account?.is_credit_card) return
      total += parseFloat(val) || 0
    })
    return total
  }
  
  const calculateSavings = (month: number) => calculateIncomeMonthTotal(month) - calculateNetCashOutflow(month)
  
  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '-'
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(amount)
  }
  
  return (
    <div style={{ padding: '20px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-primary)' }}>Monthly Budget</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '3px' }}>
            {viewMode === 'year' ? 'Full year view' : `${monthNames[selectedMonth]} ${selectedYear}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '3px' }}>
            <button onClick={() => setViewMode('month')}
              style={{ padding: '6px 15px', background: viewMode === 'month' ? '#c9a54a' : 'transparent', color: viewMode === 'month' ? '#0a1628' : 'var(--text-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: viewMode === 'month' ? '600' : '400' }}>
              Month
            </button>
            <button onClick={() => setViewMode('year')}
              style={{ padding: '6px 15px', background: viewMode === 'year' ? '#c9a54a' : 'transparent', color: viewMode === 'year' ? '#0a1628' : 'var(--text-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: viewMode === 'year' ? '600' : '400' }}>
              Year
            </button>
          </div>
          {viewMode === 'month' ? (
            <>
              <button onClick={() => { if (selectedMonth === 0) { setMonth(11); setYear(selectedYear - 1) } else { setMonth(selectedMonth - 1) } }} style={{ padding: '8px 12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', color: 'var(--text-primary)' }}>←</button>
              <span style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-primary)' }}>{monthNames[selectedMonth]} {selectedYear}</span>
              <button onClick={() => { if (selectedMonth === 11) { setMonth(0); setYear(selectedYear + 1) } else { setMonth(selectedMonth + 1) } }} style={{ padding: '8px 12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', color: 'var(--text-primary)' }}>→</button>
            </>
          ) : (
            <>
              <button onClick={() => setYear(selectedYear - 1)} style={{ padding: '8px 12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', color: 'var(--text-primary)' }}>←</button>
              <span style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-primary)' }}>{selectedYear}</span>
              <button onClick={() => setYear(selectedYear + 1)} style={{ padding: '8px 12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', color: 'var(--text-primary)' }}>→</button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'month' ? (
        <div>
          {/* Income Section */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', marginBottom: '15px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#10b981', marginBottom: '15px' }}>💰 Income</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {incomeSources.map(source => (
                <div key={source.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>{source.name}</span>
                  <input type="number" value={getIncomeCell(source.name, selectedMonth)}
                    onChange={(e) => setIncomeCell(source.name, selectedMonth, e.target.value)}
                    style={{ width: '200px' }} />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>Total Income</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>{formatCurrency(calculateIncomeMonthTotal(selectedMonth))}</span>
              </div>
            </div>
          </div>

          {/* Expense Groups */}
          {Object.entries(groupedCategories).map(([group, groupCats]) => (
            <div key={group} style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', marginBottom: '15px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#d4b36a' }}>
                  {group}
                  {accounts.find(a => a.id === groupCats[0]?.linked_account_id)?.is_credit_card === 1 && 
                    <span style={{ fontSize: '11px', color: '#c05a6e', marginLeft: '8px' }}>💳</span>
                  }
                </h3>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {formatCurrency(calculateGroupMonthTotal(groupCats, selectedMonth))}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {groupCats.map(cat => {
                  const isSchoolFees = schoolFeesCategory && cat.id === schoolFeesCategory.id
                  const cellValue = getBudgetCell(cat.id, selectedMonth)
                  
                  return (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {cat.name}
                        {isSchoolFees && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>auto</span>}
                      </span>
                      {isSchoolFees ? (
                        <div style={{ width: '200px', padding: '10px 12px', background: 'rgba(201,165,74,0.1)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', color: 'var(--text-primary)', textAlign: 'right' }}>
                          {cellValue || '-'}
                        </div>
                      ) : (
                        <input type="number" value={cellValue}
                          onChange={(e) => setBudgetCell(cat.id, selectedMonth, e.target.value)}
                          style={{ width: '200px' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Summary */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '15px' }}>Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Total Income</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{formatCurrency(calculateIncomeMonthTotal(selectedMonth))}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Gross Expense</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>{formatCurrency(calculateGrossExpense(selectedMonth))}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Net Cash Outflow</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>{formatCurrency(calculateNetCashOutflow(selectedMonth))}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Net Savings</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: calculateSavings(selectedMonth) >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(calculateSavings(selectedMonth))}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* YEAR VIEW */
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1500px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--bg-tertiary)', padding: '12px 15px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', minWidth: '180px', zIndex: 2 }}>Category</th>
                  <th style={{ position: 'sticky', left: '180px', background: 'var(--bg-tertiary)', padding: '12px 15px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', minWidth: '60px', zIndex: 2 }}>⧉</th>
                  <th style={{ position: 'sticky', left: '240px', background: 'var(--bg-tertiary)', padding: '12px 15px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', minWidth: '180px', zIndex: 2 }}>Payment Method</th>
                  {monthNames.map((m, i) => (
                    <th key={m} style={{ padding: '12px 10px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', minWidth: '90px' }}>{m}</th>
                  ))}
                  <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: '13px', color: '#d4b36a', minWidth: '90px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={15} style={{ padding: '10px 15px', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>💰 INCOME</td>
                </tr>
                {incomeSources.map(source => (
                  <tr key={source.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ position: 'sticky', left: 0, background: 'var(--card-bg)', padding: '8px 15px', fontSize: '13px', color: 'var(--text-primary)' }}>{source.name}</td>
                    <td style={{ position: 'sticky', left: '180px', background: 'var(--card-bg)', padding: '8px', textAlign: 'center' }}>
                      <button onClick={() => { const val = getIncomeCell(source.name, 0); if (val) copyIncomeToAllMonths(source.name, val, 0) }} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', padding: '2px 6px', color: 'var(--text-secondary)' }}>⧉</button>
                    </td>
                    <td style={{ position: 'sticky', left: '240px', background: 'var(--card-bg)', padding: '8px 15px', fontSize: '12px', color: 'var(--text-tertiary)' }}>-</td>
                    {monthNames.map((m, i) => (
                      <td key={m} style={{ padding: '4px', textAlign: 'center' }}>
                        <input type="number" value={getIncomeCell(source.name, i)} onChange={(e) => setIncomeCell(source.name, i, e.target.value)}
                          style={{ width: '80px', padding: '6px 8px' }} />
                      </td>
                    ))}
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#10b981' }}>
                      {monthNames.reduce((sum, m, i) => sum + (parseFloat(getIncomeCell(source.name, i)) || 0), 0).toLocaleString() || '-'}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td colSpan={3} style={{ position: 'sticky', left: 0, background: 'var(--card-bg)', padding: '8px 15px', fontSize: '13px', fontWeight: '700', color: '#10b981' }}>TOTAL INCOME</td>
                  {monthNames.map((m, i) => (
                    <td key={m} style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#10b981' }}>{calculateIncomeMonthTotal(i).toLocaleString() || '-'}</td>
                  ))}
                  <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#10b981' }}>{monthNames.reduce((sum, m, i) => sum + calculateIncomeMonthTotal(i), 0).toLocaleString()}</td>
                </tr>

                {Object.entries(groupedCategories).map(([group, groupCats]) => {
                  const isCreditCard = accounts.find(a => a.id === groupCats[0]?.linked_account_id)?.is_credit_card === 1
                  return (
                    <React.Fragment key={group}>
                      <tr>
                        <td colSpan={15} style={{ padding: '10px 15px', fontSize: '14px', fontWeight: '600', color: '#d4b36a' }}>
                          {group}
                          {isCreditCard && <span style={{ fontSize: '11px', color: '#c05a6e', marginLeft: '8px' }}>💳</span>}
                        </td>
                      </tr>
                      {groupCats.map(cat => {
                        const isSchoolFees = schoolFeesCategory && cat.id === schoolFeesCategory.id
                        
                        return (
                          <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ position: 'sticky', left: 0, background: 'var(--card-bg)', padding: '8px 15px', fontSize: '13px', color: 'var(--text-primary)' }}>
                              {cat.name}
                              {isSchoolFees && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: '6px' }}>auto</span>}
                            </td>
                            <td style={{ position: 'sticky', left: '180px', background: 'var(--card-bg)', padding: '8px', textAlign: 'center' }}>
                              {!isSchoolFees && (
                                <button onClick={() => { const val = getBudgetCell(cat.id, 0); if (val) copyToAllMonths(cat.id, val, 0) }} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', padding: '2px 6px', color: 'var(--text-secondary)' }}>⧉</button>
                              )}
                            </td>
                            <td style={{ position: 'sticky', left: '240px', background: 'var(--card-bg)', padding: '8px 15px', fontSize: '12px', color: 'var(--text-tertiary)' }}>{group}</td>
                            {monthNames.map((m, i) => (
                              <td key={m} style={{ padding: '4px', textAlign: 'center' }}>
                                {isSchoolFees ? (
                                  <div style={{ 
                                    width: '80px', 
                                    padding: '6px 8px', 
                                    background: 'rgba(201,165,74,0.1)', 
                                    border: '1px solid var(--border)', 
                                    borderRadius: '4px', 
                                    fontSize: '12px', 
                                    color: 'var(--text-primary)', 
                                    textAlign: 'right',
                                    display: 'inline-block'
                                  }}>
                                    {getBudgetCell(cat.id, i) || ''}
                                  </div>
                                ) : (
                                  <input type="number" value={getBudgetCell(cat.id, i)} onChange={(e) => setBudgetCell(cat.id, i, e.target.value)}
                                    style={{ width: '80px', padding: '6px 8px', background: isCreditCard ? 'rgba(201,165,74,0.1)' : 'var(--bg-tertiary)' }} />
                                )}
                              </td>
                            ))}
                            <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {monthNames.reduce((sum, m, i) => sum + (parseFloat(getBudgetCell(cat.id, i)) || 0), 0).toLocaleString() || '-'}
                            </td>
                          </tr>
                        )
                      })}
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={3} style={{ position: 'sticky', left: 0, background: 'var(--card-bg)', padding: '6px 15px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Group Total</td>
                        {monthNames.map((m, i) => (
                          <td key={m} style={{ padding: '6px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{calculateGroupMonthTotal(groupCats, i).toLocaleString() || '-'}</td>
                        ))}
                        <td style={{ padding: '6px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#d4b36a' }}>{monthNames.reduce((sum, m, i) => sum + calculateGroupMonthTotal(groupCats, i), 0).toLocaleString()}</td>
                      </tr>
                    </React.Fragment>
                  )
                })}

                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td colSpan={3} style={{ position: 'sticky', left: 0, background: 'var(--card-bg)', padding: '10px 15px', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>TOTAL EXPENSE (Gross)</td>
                  {monthNames.map((m, i) => { const gross = calculateGrossExpense(i); const income = calculateIncomeMonthTotal(i); const textColor = gross > income ? '#ef4444' : '#10b981'; return <td key={m} style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: textColor }}>{gross.toLocaleString() || '-'}</td> })}
                  <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{monthNames.reduce((sum, m, i) => sum + calculateGrossExpense(i), 0).toLocaleString()}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td colSpan={3} style={{ position: 'sticky', left: 0, background: 'var(--card-bg)', padding: '10px 15px', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>NET CASH OUTFLOW</td>
                  {monthNames.map((m, i) => { const net = calculateNetCashOutflow(i); const income = calculateIncomeMonthTotal(i); const textColor = net > income ? '#ef4444' : '#10b981'; return <td key={m} style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: textColor }}>{net.toLocaleString() || '-'}</td> })}
                  <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{monthNames.reduce((sum, m, i) => sum + calculateNetCashOutflow(i), 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={3} style={{ position: 'sticky', left: 0, background: 'var(--card-bg)', padding: '10px 15px', fontSize: '13px', fontWeight: '700', color: '#d4b36a' }}>💰 NET SAVINGS</td>
                  {monthNames.map((m, i) => { const savings = calculateSavings(i); const textColor = savings > 0 ? '#10b981' : savings < 0 ? '#ef4444' : 'var(--text-primary)'; return <td key={m} style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: textColor }}>{savings.toLocaleString() || '-'}</td> })}
                  <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#d4b36a' }}>{monthNames.reduce((sum, m, i) => sum + calculateSavings(i), 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
