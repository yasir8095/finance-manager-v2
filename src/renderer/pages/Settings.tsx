import React, { useState, useEffect } from 'react'
import { useFinanceStore } from '../store/financeStore'

export default function Settings() {
  const { 
    accountGroups, 
    addAccountGroup,
    updateAccountGroup,
    deactivateAccountGroup, 
    categories, 
    addCategory,
    updateCategory,
    deactivateCategory,
    accounts,
    incomeSources,
    allIncomeSources,
    addIncomeSource,
    updateIncomeSource,
    deactivateIncomeSource,
    reactivateIncomeSource,
    updateIncomeSourceOrder,
    selectedYear,
    currencyRates,
    addCurrencyRate
  } = useFinanceStore()
  
  const [activeTab, setActiveTab] = useState('accountGroups')
  const [newGroupName, setNewGroupName] = useState('')
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryAccount, setNewCategoryAccount] = useState<number | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [newIncomeSource, setNewIncomeSource] = useState('')
  const [editingIncomeSourceId, setEditingIncomeSourceId] = useState<number | null>(null)
  const [editingIncomeSourceName, setEditingIncomeSourceName] = useState('')
  const [newCurrencyCode, setNewCurrencyCode] = useState('')
  const [isFetchingRate, setIsFetchingRate] = useState(false)
  const [isRefreshingAll, setIsRefreshingAll] = useState(false)
  
  // School fees state
  const [schoolYear, setSchoolYear] = useState(selectedYear)
  const [schoolFees, setSchoolFees] = useState<any[]>([])
  const [feeTypes, setFeeTypes] = useState<string[]>([])
  const [children, setChildren] = useState<string[]>([])
  const [newFeeType, setNewFeeType] = useState('')
  const [newChild, setNewChild] = useState('')
  const [showAddFeeType, setShowAddFeeType] = useState(false)
  const [showAddChild, setShowAddChild] = useState(false)
  
  useEffect(() => {
    // Clear old data before loading new year
    setSchoolFees([])
    setFeeTypes([])
    setChildren([])
    loadSchoolFees(schoolYear)
  }, [schoolYear])
  
  const loadSchoolFees = async (year: number) => {
    try {
      const fees = await (window as any).electronAPI.getSchoolFees(year)
      const types = await (window as any).electronAPI.getSchoolFeeTypes(year)
      const kids = await (window as any).electronAPI.getSchoolChildren(year)
      
      // Filter fees to ensure they match the selected year
      const filteredFees = fees.filter((f: any) => f.year === year)
      const filteredTypes = types.filter((t: any) => t.year === year)
      const filteredChildren = kids.filter((k: any) => k.year === year)
      
      setSchoolFees(filteredFees)
      setFeeTypes(filteredTypes.map((t: any) => t.name || t.fee_type))
      setChildren(filteredChildren.map((k: any) => k.name || k.child_name))
    } catch (error) {
      console.error('Failed to load school fees:', error)
      setSchoolFees([])
      setFeeTypes([])
      setChildren([])
    }
  }
  
  const handleAddCurrency = async () => {
    if (newCurrencyCode.trim()) {
      const code = newCurrencyCode.trim().toUpperCase()
      if (currencyRates.find(r => r.currency === code)) {
        alert(code + ' already exists')
        return
      }
      setIsFetchingRate(true)
      try {
        const result = await (window as any).electronAPI.fetchFXRate('AED', code)
        if (result) {
          await addCurrencyRate({
            currency: code,
            rate_to_aed: result.rate,
            last_refreshed: new Date().toISOString(),
            source: result.source
          })
          setNewCurrencyCode('')
          alert(code + ' added with rate: ' + result.rate.toFixed(4))
        } else {
          alert('Could not fetch rate for ' + code)
        }
      } catch (error) {
        alert('Failed to fetch rate for ' + code)
      } finally {
        setIsFetchingRate(false)
      }
    }
  }

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true)
    try {
      for (const rate of currencyRates) {
        if (rate.currency === 'AED') continue // skip base currency
        const result = await (window as any).electronAPI.fetchFXRate('AED', rate.currency)
        if (result) {
          await addCurrencyRate({
            currency: rate.currency,
            rate_to_aed: result.rate,
            last_refreshed: new Date().toISOString(),
            source: result.source
          })
        }
      }
      alert('All rates refreshed successfully')
    } catch (error) {
      alert('Failed to refresh some rates')
    } finally {
      setIsRefreshingAll(false)
    }
  }

  const handleRefreshCurrency = async (code: string) => {
    try {
      const result = await (window as any).electronAPI.fetchFXRate('AED', code)
      if (result) {
        await addCurrencyRate({
          currency: code,
          rate_to_aed: result.rate,
          last_refreshed: new Date().toISOString(),
          source: result.source
        })
        alert(code + ' rate updated to: ' + result.rate.toFixed(4))
      } else {
        alert('Could not fetch rate for ' + code)
      }
    } catch (error) {
      alert('Failed to fetch rate for ' + code)
    }
  }

  const handleAddGroup = async () => {
    if (newGroupName.trim()) {
      if (editingGroupId) {
        await updateAccountGroup(editingGroupId, newGroupName)
        setEditingGroupId(null)
      } else {
        await addAccountGroup(newGroupName)
      }
      setNewGroupName('')
    }
  }
  
  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, { 
          name: newCategoryName, 
          linked_account_id: newCategoryAccount 
        })
        setEditingCategoryId(null)
      } else {
        await addCategory({ 
          name: newCategoryName, 
          type: 'expense',
          linked_account_id: newCategoryAccount
        })
      }
      setNewCategoryName('')
      setNewCategoryAccount(null)
    }
  }
  
  const handleAddIncomeSource = async () => {
    if (newIncomeSource.trim()) {
      await addIncomeSource(newIncomeSource)
      setNewIncomeSource('')
    }
  }
  
  const handleUpdateIncomeSource = async (id: number) => {
    if (editingIncomeSourceName.trim()) {
      await updateIncomeSource(id, editingIncomeSourceName)
      setEditingIncomeSourceId(null)
      setEditingIncomeSourceName('')
    }
  }
  
  const handleMoveIncomeSource = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = incomeSources.findIndex(s => s.id === id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (targetIndex < 0 || targetIndex >= incomeSources.length) return
    
    const currentSource = incomeSources[currentIndex]
    const targetSource = incomeSources[targetIndex]
    
    await updateIncomeSourceOrder(currentSource.id, targetSource.sort_order)
    await updateIncomeSourceOrder(targetSource.id, currentSource.sort_order)
  }
  
  // School fees handlers
  const saveSchoolFeeCell = async (feeType: string, childName: string, month: number, value: string) => {
    const amount = parseFloat(value) || 0
    
    // Find existing fee
    const existingFee = schoolFees.find(f => 
      f.year === schoolYear && 
      f.fee_type === feeType && 
      f.child_name === childName && 
      f.month === month
    )
    
    const result = await (window as any).electronAPI.addSchoolFee({
      year: schoolYear,
      fee_type: feeType,
      child_name: childName,
      month: month,
      amount: amount
    })
    
    // Update local state with the returned id
    if (existingFee) {
      setSchoolFees(prev => prev.map(f => 
        f.id === existingFee.id ? { ...f, amount: amount } : f
      ))
    } else {
      setSchoolFees(prev => [...prev, {
        id: result?.lastInsertRowid || Date.now(),
        year: schoolYear,
        fee_type: feeType,
        child_name: childName,
        month: month,
        amount: amount
      }])
    }
  }
  
  const getSchoolFeeValue = (feeType: string, childName: string, month: number) => {
    const fee = schoolFees.find(f => 
      f.year === schoolYear && 
      f.fee_type === feeType && 
      f.child_name === childName && 
      f.month === month
    )
    return fee ? fee.amount : ''
  }
  
  const handleAddFeeType = async () => {
    if (newFeeType && !feeTypes.includes(newFeeType)) {
      await (window as any).electronAPI.addSchoolFeeType(schoolYear, newFeeType)
      setFeeTypes(prev => [...prev, newFeeType])
      setNewFeeType('')
      setShowAddFeeType(false)
    }
  }
  
  const handleAddChild = async () => {
    if (newChild && !children.includes(newChild)) {
      await (window as any).electronAPI.addSchoolChild(schoolYear, newChild)
      setChildren(prev => [...prev, newChild])
      setNewChild('')
      setShowAddChild(false)
    }
  }
  
  const tabs = [
    { id: 'accountGroups', label: 'Account Groups' },
    { id: 'categories', label: 'Expense Categories' },
    { id: 'incomeSources', label: 'Income Sources' },
    { id: 'currencies', label: 'Currencies' },
    { id: 'schoolFees', label: 'School Fees' },
  ]
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '5px' }}>Settings</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '30px' }}>Configure your finance manager</p>
      
      <div style={{ display: 'flex', gap: '5px', marginBottom: '25px', borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px', background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #c9a54a' : '2px solid transparent',
              color: activeTab === tab.id ? '#d4b36a' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '400'
            }}>
            {tab.label}
          </button>
        ))}
      </div>
      
      {activeTab === 'accountGroups' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Groups for organizing your bank accounts</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Group name (e.g., YASIR)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              style={{ maxWidth: '300px' }}
            />
            <button onClick={handleAddGroup}
              style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              {editingCategoryId ? 'Update' : 'Save'}
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {accountGroups.map(group => (
              <div key={group.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {editingGroupId === group.id ? (
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button onClick={handleAddGroup}
                      style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      Save
                    </button>
                    <button onClick={() => { setEditingGroupId(null); setNewGroupName('') }}
                      style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{group.name}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {accounts.filter(a => a.group_id === group.id).length} accounts
                      </span>
                      <button onClick={() => { setEditingGroupId(group.id); setNewGroupName(group.name) }}
                        style={{ padding: '5px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Edit
                      </button>
                      <button onClick={async () => {
                        const accountCount = accounts.filter(a => a.group_id === group.id).length
                        if (accountCount > 0) {
                          alert(`Cannot delete "${group.name}" - it has ${accountCount} accounts assigned to it.`)
                        } else {
                          if (confirm(`Delete group "${group.name}"?`)) {
                            await deactivateAccountGroup(group.id)
                          }
                        }
                      }}
                        style={{ padding: '5px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#c05a6e' }}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>The line items in your monthly budget</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <select
              value={newCategoryAccount || 0}
              onChange={(e) => setNewCategoryAccount(Number(e.target.value) || null)}
              style={{ flex: 1, minWidth: '200px' }}
            >
              <option value={0}>Select payment account...</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.bank} - {account.type}
                </option>
              ))}
            </select>
            <button onClick={handleAddCategory}
              style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              {editingCategoryId ? 'Update' : 'Save'}
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {categories.map(category => (
              <div key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>{category.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', minWidth: '200px', textAlign: 'right' }}>
                  {category.linked_account_id ? 
                    accounts.find(a => a.id === category.linked_account_id)?.name + ' - ' + 
                    accounts.find(a => a.id === category.linked_account_id)?.bank + ' - ' +
                    accounts.find(a => a.id === category.linked_account_id)?.type || '-' : 
                    '-'
                  }
                </span>
                <button onClick={() => {
                  setNewCategoryName(category.name)
                  setNewCategoryAccount(category.linked_account_id)
                  setEditingCategoryId(category.id)
                }}
                  style={{ padding: '5px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Edit
                </button>
                <button onClick={async () => {
                  if (confirm(`Delete category "${category.name}"?`)) {
                    await deactivateCategory(category.id)
                  }
                }}
                  style={{ padding: '5px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#c05a6e' }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeTab === 'incomeSources' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Types of income you can select in the monthly budget</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Income source name"
              value={newIncomeSource}
              onChange={(e) => setNewIncomeSource(e.target.value)}
              style={{ maxWidth: '300px' }}
            />
            <button onClick={handleAddIncomeSource}
              style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              {editingCategoryId ? 'Update' : 'Save'}
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {incomeSources.map((source, index) => (
              <div key={source.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => handleMoveIncomeSource(source.id, 'up')}
                    disabled={index === 0}
                    style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: index === 0 ? 'not-allowed' : 'pointer', fontSize: '11px', color: 'var(--text-secondary)', opacity: index === 0 ? 0.5 : 1 }}
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => handleMoveIncomeSource(source.id, 'down')}
                    disabled={index === incomeSources.length - 1}
                    style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: index === incomeSources.length - 1 ? 'not-allowed' : 'pointer', fontSize: '11px', color: 'var(--text-secondary)', opacity: index === incomeSources.length - 1 ? 0.5 : 1 }}
                  >
                    ↓
                  </button>
                </div>
                
                {editingIncomeSourceId === source.id ? (
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      value={editingIncomeSourceName}
                      onChange={(e) => setEditingIncomeSourceName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button onClick={() => handleUpdateIncomeSource(source.id)}
                      style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      Save
                    </button>
                    <button onClick={() => { setEditingIncomeSourceId(null); setEditingIncomeSourceName('') }}
                      style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>{source.name}</span>
                )}
                
                {editingIncomeSourceId !== source.id && (
                  <>
                    <button onClick={() => { setEditingIncomeSourceId(source.id); setEditingIncomeSourceName(source.name) }}
                      style={{ padding: '5px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Edit
                    </button>
                    <button onClick={() => deactivateIncomeSource(source.id)}
                      style={{ padding: '5px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#c05a6e' }}>
                      Deactivate
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          
          {allIncomeSources.length > incomeSources.length && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Inactive sources:
              </p>
              {allIncomeSources.filter(s => !s.is_active).map(source => (
                <div key={source.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{source.name}</span>
                  <button onClick={() => reactivateIncomeSource(source.id)}
                    style={{ padding: '4px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#10b981' }}>
                    Reactivate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'currencies' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Manage currencies and their exchange rates to AED</p>
            <button onClick={handleRefreshAll} disabled={isRefreshingAll}
              style={{ padding: '8px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
              {isRefreshingAll ? 'Refreshing...' : '🔄 Refresh All Rates'}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Currency code (e.g., GBP)"
              value={newCurrencyCode}
              onChange={(e) => setNewCurrencyCode(e.target.value.toUpperCase())}
              style={{ maxWidth: '250px' }}
            />
            <button onClick={handleAddCurrency} disabled={isFetchingRate}
              style={{ padding: '10px 20px', background: '#c9a54a', color: '#0a1628', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              {isFetchingRate ? 'Fetching...' : 'Add Currency'}
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {currencyRates.map((rate: any) => (
              <div key={rate.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{rate.currency}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>1 {rate.currency} = {rate.rate_to_aed} AED</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Source: {rate.source} | Updated: {new Date(rate.last_refreshed).toLocaleDateString()}
                  </span>
                  <button onClick={() => handleRefreshCurrency(rate.currency)}
                    style={{ padding: '5px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Refresh Rate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeTab === 'schoolFees' && (
        <div key={schoolYear}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Set up the annual school fee structure</p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => setSchoolYear(schoolYear - 1)} style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>←</button>
              <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{schoolYear}</span>
              <button onClick={() => setSchoolYear(schoolYear + 1)} style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>→</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setShowAddFeeType(!showAddFeeType)}
              style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
              + Fee Type
            </button>
            <button onClick={() => setShowAddChild(!showAddChild)}
              style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
              + Child
            </button>
          </div>
          
          {showAddFeeType && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="Fee type (e.g., Exam Fees)" value={newFeeType}
                onChange={(e) => setNewFeeType(e.target.value)}
                style={{ flex: 1 }} />
              <button onClick={handleAddFeeType}
                style={{ padding: '8px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                Add
              </button>
            </div>
          )}
          
          {showAddChild && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="Child name" value={newChild}
                onChange={(e) => setNewChild(e.target.value)}
                style={{ flex: 1 }} />
              <button onClick={handleAddChild}
                style={{ padding: '8px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                Add
              </button>
            </div>
          )}
          
          {/* Grand total row */}
          {children.length > 0 && (
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '2px solid #c9a54a', padding: '15px', marginBottom: '20px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 15px', textAlign: 'left', fontSize: '14px', fontWeight: '700', color: '#d4b36a', minWidth: '150px' }}>Grand Total (All Children)</th>
                      {monthNames.map(m => (
                        <th key={m} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', minWidth: '70px' }}>{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 15px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Payable</td>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                        let grandTotal = 0
                        schoolFees.forEach(fee => {
                          if (fee.year === schoolYear && fee.month === month) grandTotal += parseFloat(fee.amount) || 0
                        })
                        return (
                          <td key={month} style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#d4b36a' }}>
                            {grandTotal > 0 ? grandTotal.toLocaleString() : ''}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {children.map(child => (
            <div key={child} style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#d4b36a' }}>{child}</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)' }}>
                      <th style={{ padding: '10px 15px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', minWidth: '150px' }}>Fee Type</th>
                      {monthNames.map(m => (
                        <th key={m} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', minWidth: '70px' }}>{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {feeTypes.map(feeType => (
                      <tr key={feeType} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 15px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {feeType}
                        </td>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                          const value = getSchoolFeeValue(feeType, child, month)
                          return (
                            <td key={month} style={{ padding: '4px', textAlign: 'center' }}>
                              <input 
                                type="number" 
                                key={`${schoolYear}-${feeType}-${child}-${month}`}
                                defaultValue={value}
                                onBlur={(e) => saveSchoolFeeCell(feeType, child, month, e.target.value)}
                                style={{ width: '65px', padding: '5px 6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '12px', color: 'var(--text-primary)', textAlign: 'right' }} />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid var(--border)' }}>
                      <td style={{ padding: '10px 15px', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Total</td>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                        let total = 0
                        schoolFees.forEach(fee => {
                          if (fee.year === schoolYear && fee.child_name === child && fee.month === month) total += parseFloat(fee.amount) || 0
                        })
                        return (
                          <td key={month} style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#d4b36a' }}>
                            {total > 0 ? total.toLocaleString() : ''}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
