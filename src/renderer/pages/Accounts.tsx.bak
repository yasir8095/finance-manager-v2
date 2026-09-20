import React, { useState, useEffect } from 'react'
import { useFinanceStore } from '../store/financeStore'

export default function Accounts() {
  const { accounts, accountGroups, addAccount, updateAccount, deactivateAccount, currencyRates, addCurrencyRate } = useFinanceStore()
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState({ name: '', group_id: 0, bank: '', branch: '', type: 'CURRENT', currency: 'AED', account_number: '', balance: '' })
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddCurrency, setShowAddCurrency] = useState(false)
  const [newCurrency, setNewCurrency] = useState('')
  const [newAccount, setNewAccount] = useState({ name: '', group_id: 0, bank: '', branch: '', type: 'CURRENT', currency: 'AED', balance: '', account_number: '', is_credit_card: 0, linked_account_id: null as number | null })
  
  const fxRates: Record<string, number> = { AED: 1 }
  currencyRates.forEach(r => { fxRates[r.currency] = r.rate_to_aed })
  
  const testIPC = () => {
    alert('electronAPI: ' + !!(window as any).electronAPI)
    alert('fetchFXRate: ' + typeof (window as any).electronAPI?.fetchFXRate)
    alert('fetchGoldPrice: ' + typeof (window as any).electronAPI?.fetchGoldPrice)
    alert('fetchCryptoPrice: ' + typeof (window as any).electronAPI?.fetchCryptoPrice)
  }

  const handleAddCurrency = async () => {
    console.log('handleAddCurrency called', newCurrency)
    alert('handleAddCurrency: ' + newCurrency)
    if (newCurrency && !fxRates[newCurrency]) {
      const result = await (window as any).electronAPI.fetchFXRate('AED', newCurrency)
      alert('FX result: ' + JSON.stringify(result))
      console.log('FX result:', result)
      if (result) {
        await addCurrencyRate({
          currency: newCurrency,
          rate_to_aed: result.rate,
          last_refreshed: new Date().toISOString(),
          source: result.source
        })
        setNewCurrency('')
        setShowAddCurrency(false)
      } else {
        alert('Could not fetch rate for ' + newCurrency)
      }
    }
  }
  
  const handleEditAccount = (acct: any) => {
    setEditingAccountId(acct.id)
    setEditFormData({
      name: accountGroups.find(g => g.id === acct.group_id)?.name || acct.name, 
      group_id: acct.group_id || 0, 
      bank: acct.bank, 
      branch: acct.branch || '', 
      type: acct.type,
      currency: acct.currency, 
      account_number: acct.account_number || '', 
      balance: acct.balance || ''
    })
  }
  
  const handleSaveEditAccount = async () => {
    if (editFormData.group_id && editFormData.bank) {
      const accountToUpdate = accounts.find(a => a.id === editingAccountId)
      await updateAccount(editingAccountId!, {
        ...accountToUpdate,
        ...editFormData,
        group_id: Number(editFormData.group_id),
        balance: parseFloat(editFormData.balance) || 0
      })
      setEditingAccountId(null)
    }
  }
  
  const handleDeactivateAccount = async (id: number) => {
    if (confirm('Deactivate this account? It will no longer appear in the list.')) {
      await deactivateAccount(id)
    }
  }
  
  const handleAddAccount = async () => {
    const nameError = ValidationService.validateAccountName(newAccount.name)
    const bankError = ValidationService.validateBank(newAccount.bank)
    const balanceError = ValidationService.validateBalance(parseFloat(newAccount.balance))
    
    if (nameError || bankError || balanceError) {
      alert(nameError || bankError || balanceError)
      return
    }
    
    if (newAccount.group_id && newAccount.bank) {
      console.log('Saving account:', newAccount)
      await addAccount({
        ...newAccount,
        group_id: Number(newAccount.group_id),
        balance: parseFloat(newAccount.balance) || 0
      })
      setShowAddAccount(false)
      setNewAccount({ name: '', group_id: 0, bank: '', branch: '', type: 'CURRENT', currency: 'AED', balance: '', account_number: '', is_credit_card: 0, linked_account_id: null })
    }
  }
  
  const groupedAccounts: Record<string, any[]> = {}
  accounts.forEach(acct => {
    const group = accountGroups.find(g => g.id === acct.group_id)
    const label = group?.name || acct.name || 'Ungrouped'
    if (!groupedAccounts[label]) groupedAccounts[label] = []
    groupedAccounts[label].push(acct)
  })
  
  const formatCurrency = (amount: number, currency: string) => {
    if (!amount && amount !== 0) return '-'
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: currency || 'AED' }).format(amount)
  }
  
  const convertToAED = (amount: number, currency: string) => {
    const rate = fxRates[currency] || 1
    return (amount || 0) * rate
  }
  
  const totalAED = accounts.reduce((sum, acct) => sum + convertToAED(acct.balance, acct.currency), 0)
  
  const currencyTotals: Record<string, number> = {}
  accounts.forEach(acct => {
    const curr = acct.currency || 'AED'
    if (!currencyTotals[curr]) currencyTotals[curr] = 0
    currencyTotals[curr] += (acct.balance || 0)
  })
  
  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>Accounts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '5px' }}>View and manage your bank accounts</p>
        </div>
        <button onClick={() => setShowAddAccount(true)}
          style={{ padding: '10px 20px', background: '#c9a54a', color: '#0a1628', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
          + Add Account
        </button>
      </div>
      
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '25px', marginBottom: '20px', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Total Balance (AED)</p>
        <p style={{ fontSize: '32px', fontWeight: '700', color: '#d4b36a', marginTop: '5px' }}>
          {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(totalAED)}
        </p>
      </div>
      
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', marginBottom: '25px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Currency Breakdown</p>
          <button onClick={() => setShowAddCurrency(!showAddCurrency)}
            style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
            + Add Currency
          </button>
        </div>
        {showAddCurrency && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input type="text" placeholder="Currency code (e.g., GBP)" value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value.toUpperCase())}
              style={{ flex: 1 }} />
            <button onClick={() => { alert('Fetch clicked'); handleAddCurrency() }}
              style={{ padding: '8px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
              Fetch Rate
            </button>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {Object.entries(currencyTotals).map(([curr, total]) => (
            <div key={curr} style={{ padding: '10px 15px', background: 'var(--bg-tertiary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{curr}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#d4b36a' }}>
                {new Intl.NumberFormat('en-AE', { style: 'currency', currency: curr }).format(total)}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                ≈ {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(convertToAED(total, curr))}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {showAddAccount && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Add Account</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select value={newAccount.group_id} onChange={(e) => {
                  const group = accountGroups.find(g => String(g.id) === e.target.value)
                  setNewAccount({...newAccount, group_id: Number(e.target.value), name: group ? group.name : ''})
                }}>
                <option value={0}>Select owner...</option>
                {accountGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
              <input type="text" placeholder="Bank" value={newAccount.bank}
                onChange={(e) => setNewAccount({...newAccount, bank: e.target.value})} />
              <input type="text" placeholder="Branch" value={newAccount.branch}
                onChange={(e) => setNewAccount({...newAccount, branch: e.target.value})} />
              <input type="text" placeholder="Account number" value={newAccount.account_number}
                onChange={(e) => setNewAccount({...newAccount, account_number: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Type (e.g. CURRENT, VISA, MASTERCARD)" value={newAccount.type}
                    onChange={(e) => setNewAccount({...newAccount, type: e.target.value})}
                    style={{ flex: 1 }} />
                <select value={newAccount.currency}
                  onChange={(e) => setNewAccount({...newAccount, currency: e.target.value})}
                  style={{ flex: 1 }}>
                  {Object.keys(fxRates).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <input 
                    type="checkbox" 
                    checked={newAccount.is_credit_card === 1}
                    onChange={(e) => setNewAccount({...newAccount, is_credit_card: e.target.checked ? 1 : 0})}
                    style={{ width: 'auto' }}
                  />
                  This is a credit card
                </label>
              </div>
              {newAccount.is_credit_card === 1 && (
                <select 
                  value={newAccount.linked_account_id || 0}
                  onChange={(e) => setNewAccount({...newAccount, linked_account_id: Number(e.target.value) || null})}
                >
                  <option value={0}>Linked account (pays this card)...</option>
                  {accounts.filter(a => !a.is_credit_card).map(account => (
                    <option key={account.id} value={account.id}>
                      {accountGroups.find(g => g.id === account.group_id)?.name || account.name} - {account.bank} - {account.type}
                    </option>
                  ))}
                </select>
              )}
              <input type="number" placeholder="Current balance" value={newAccount.balance}
                onChange={(e) => setNewAccount({...newAccount, balance: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => { alert("Save clicked"); handleAddAccount() }}
                  style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  Save
                </button>
                <button onClick={() => setShowAddAccount(false)}
                  style={{ flex: 1, padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {Object.entries(groupedAccounts).map(([person, personAccounts]) => (
        <div key={person} style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#d4b36a', marginBottom: '10px' }}>{person}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {personAccounts.map((acct: any) => (
              <div key={acct.id} style={{ padding: '15px', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                {editingAccountId === acct.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>Owner</label>
                        <select value={editFormData.group_id} onChange={(e) => {
                            const group = accountGroups.find(g => String(g.id) === e.target.value)
                            setEditFormData({...editFormData, group_id: Number(e.target.value), name: group ? group.name : ''})
                          }}>
                          <option value={0}>Select owner...</option>
                          {accountGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>Bank</label>
                        <input type="text" value={editFormData.bank} onChange={(e) => setEditFormData({...editFormData, bank: e.target.value})} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>Branch</label>
                        <input type="text" value={editFormData.branch} onChange={(e) => setEditFormData({...editFormData, branch: e.target.value})} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>Account Number</label>
                        <input type="text" value={editFormData.account_number} onChange={(e) => setEditFormData({...editFormData, account_number: e.target.value})} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>Type</label>
                        <input type="text" value={editFormData.type}
                          onChange={(e) => setEditFormData({...editFormData, type: e.target.value})} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>Currency</label>
                        <select value={editFormData.currency} onChange={(e) => setEditFormData({...editFormData, currency: e.target.value})}>
                          {Object.keys(fxRates).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>Balance</label>
                      <input type="number" value={editFormData.balance} onChange={(e) => setEditFormData({...editFormData, balance: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={handleSaveEditAccount}
                        style={{ padding: '8px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                        Save
                      </button>
                      <button onClick={() => handleDeactivateAccount(acct.id)}
                        style={{ padding: '8px 15px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#c05a6e' }}>
                        Deactivate
                      </button>
                      <button onClick={() => setEditingAccountId(null)}
                        style={{ padding: '8px 15px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {accountGroups.find(g => g.id === acct.group_id)?.name || acct.name} - {acct.bank} - {acct.type}
                        {acct.is_credit_card === 1 && <span style={{ fontSize: '11px', color: '#c9a54a', marginLeft: '8px' }}>💳</span>}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {acct.branch}
                        {acct.account_number && <span style={{ marginLeft: '8px' }}>• {acct.account_number}</span>}
                        {acct.is_credit_card === 1 && acct.linked_account_id && (
                          <span style={{ marginLeft: '8px' }}>
                            • Paid from: {accounts.find(a => a.id === acct.linked_account_id)?.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {formatCurrency(acct.balance, acct.currency)}
                      </span>
                      <button onClick={() => handleEditAccount(acct)}
                        style={{ padding: '6px 15px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
