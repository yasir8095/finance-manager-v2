import React, { useState, useEffect } from 'react'
import { useFinanceStore } from '../store/financeStore'
import { ValidationService } from '../services/validation'
import { PriceService } from '../services/priceService'

export default function Investments() {
  const { investments, insurancePolicies, addInvestment, addInsurancePolicy, updateInvestmentPrice, updateInvestmentQuantity, updateInvestmentPurchasePrice, deleteInvestment, deleteInsurancePolicy, updateInsurancePolicy, addRealizedPnl } = useFinanceStore()
  const [showAddETF, setShowAddETF] = useState(false)
  const [showAddCrypto, setShowAddCrypto] = useState(false)
  const [showAddPolicy, setShowAddPolicy] = useState(false)
  const [newETF, setNewETF] = useState({ symbol: '', quantity: '', purchase_price: '' })
  const [newCrypto, setNewCrypto] = useState({ symbol: '', quantity: '', purchase_price: '' })
  const [newPolicy, setNewPolicy] = useState({ policy_number: '', company: '', currency: 'USD', total_invested: '', current_value: '', maturity_date: '' })
  const [updatingPolicyId, setUpdatingPolicyId] = useState<number | null>(null)
  const [newPolicyValue, setNewPolicyValue] = useState('')
  const [editItem, setEditItem] = useState<any>(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [sellItem, setSellItem] = useState<any>(null)
  const [sellQuantity, setSellQuantity] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  
  const refreshPrices = async () => {
    for (const inv of investments) {
      if (inv.type === 'etf' || inv.type === 'stock') {
        const result = await PriceService.fetchETFPrice(inv.ticker_symbol)
        if (result) {
          await updateInvestmentPrice(inv.id, result.price)
        }
      } else if (inv.type === 'crypto') {
        const result = await PriceService.fetchCryptoPrice(inv.ticker_symbol.toLowerCase())
        if (result) {
          await updateInvestmentPrice(inv.id, result.priceAED)
        }
      }
    }
  }
  
  const handleAddETF = async () => {
    if (!newETF.symbol.trim()) {
      alert('Ticker symbol is required')
      return
    }
    const qtyError = ValidationService.validateInvestmentQuantity(parseFloat(newETF.quantity))
    const priceError = ValidationService.validateInvestmentPrice(parseFloat(newETF.purchase_price))
    if (qtyError || priceError) {
      alert(qtyError || priceError)
      return
    }
    if (newETF.symbol && newETF.quantity) {
      let price = 0
      const priceResult = await PriceService.fetchETFPrice(newETF.symbol)
      if (priceResult) {
        price = priceResult.price
      }
      
      await addInvestment({
        name: newETF.symbol, 
        type: 'etf', 
        ticker_symbol: newETF.symbol,
        quantity: parseFloat(newETF.quantity), 
        purchase_price: parseFloat(newETF.purchase_price) || 0,
        current_price: price, 
        currency: 'USD', 
        purchase_date: new Date().toISOString().split('T')[0]
      })
      setShowAddETF(false)
      setNewETF({ symbol: '', quantity: '', purchase_price: '' })
    }
  }
  
  const handleAddCrypto = async () => {
    if (!newCrypto.symbol.trim()) {
      alert('Coin symbol is required')
      return
    }
    const qtyError = ValidationService.validateInvestmentQuantity(parseFloat(newCrypto.quantity))
    const priceError = ValidationService.validateInvestmentPrice(parseFloat(newCrypto.purchase_price))
    if (qtyError || priceError) {
      alert(qtyError || priceError)
      return
    }
    if (newCrypto.symbol && newCrypto.quantity) {
      let priceAED = 0
      const priceResult = await PriceService.fetchCryptoPrice(newCrypto.symbol.toLowerCase())
      if (priceResult) {
        priceAED = priceResult.priceAED
      }
      
      await addInvestment({
        name: newCrypto.symbol.toUpperCase(), 
        type: 'crypto', 
        ticker_symbol: newCrypto.symbol.toLowerCase(),
        quantity: parseFloat(newCrypto.quantity), 
        purchase_price: parseFloat(newCrypto.purchase_price) || 0,
        current_price: priceAED, 
        currency: 'AED', 
        purchase_date: new Date().toISOString().split('T')[0]
      })
      setShowAddCrypto(false)
      setNewCrypto({ symbol: '', quantity: '', purchase_price: '' })
    }
  }
  
  const handleAddPolicy = async () => {
    if (!newPolicy.policy_number.trim() || !newPolicy.company.trim()) {
      alert('Policy number and company are required')
      return
    }
    const investedError = ValidationService.validateInsuranceValue(parseFloat(newPolicy.total_invested))
    const currentError = ValidationService.validateInsuranceValue(parseFloat(newPolicy.current_value))
    if (investedError || currentError) {
      alert(investedError || currentError)
      return
    }
    if (newPolicy.policy_number && newPolicy.company) {
      await addInsurancePolicy({
        policy_number: newPolicy.policy_number, 
        company: newPolicy.company, 
        currency: newPolicy.currency,
        total_invested: parseFloat(newPolicy.total_invested) || 0,
        current_value: parseFloat(newPolicy.current_value) || 0,
        last_updated: new Date().toISOString().split('T')[0],
        maturity_date: newPolicy.maturity_date || null
      })
      setShowAddPolicy(false)
      setNewPolicy({ policy_number: '', company: '', currency: 'USD', total_invested: '', current_value: '', maturity_date: '' })
    }
  }
  
  const toggleExpand = (key: string) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }
  
  const formatCurrency = (amount: number, currency: string) => {
    if (!amount && amount !== 0) return '-'
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: currency || 'AED' }).format(amount)
  }
  
  const etfs = investments.filter(i => i.type === 'etf' || i.type === 'stock')
  const cryptos = investments.filter(i => i.type === 'crypto')
  
  const groupInvestments = (items: any[]) => {
    const groups: Record<string, any[]> = {}
    items.forEach(inv => {
      const key = inv.ticker_symbol
      if (!groups[key]) groups[key] = []
      groups[key].push(inv)
    })
    return groups
  }
  
  const renderConsolidatedRow = (key: string, lots: any[], type: string) => {
    const totalQty = lots.reduce((sum, lot) => sum + (parseFloat(lot.quantity) || 0), 0)
    const totalCost = lots.reduce((sum, lot) => sum + (parseFloat(lot.quantity) || 0) * (parseFloat(lot.purchase_price) || 0), 0)
    const currentPrice = lots[0].current_price || 0
    const currentValue = totalQty * currentPrice
    const pnl = currentValue - totalCost
    const pnlPercent = totalCost > 0 ? (pnl / totalCost * 100) : 0
    const currency = type === 'crypto' ? 'AED' : 'USD'
    const isExpanded = expandedItems[key]
    
    return (
      <React.Fragment key={key}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', background: 'var(--bg-tertiary)', borderRadius: '8px', cursor: 'pointer' }}
          onClick={() => toggleExpand(key)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{isExpanded ? '▼' : '▶'}</span>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{key.toUpperCase()}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{totalQty} units • {lots.length} lot(s)</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(currentValue, currency)}</p>
            <p style={{ fontSize: '12px', color: pnl >= 0 ? '#10b981' : '#ef4444' }}>
              {pnl >= 0 ? '+' : ''}{formatCurrency(pnl, currency)} ({pnlPercent.toFixed(1)}%)
            </p>
          </div>
        </div>
        {isExpanded && (
          <div style={{ marginLeft: '25px', marginTop: '5px', marginBottom: '10px' }}>
            {lots.map((lot: any) => {
              const lotCost = (parseFloat(lot.quantity) || 0) * (parseFloat(lot.purchase_price) || 0)
              const lotValue = (parseFloat(lot.quantity) || 0) * (parseFloat(lot.current_price) || 0)
              const lotPnl = lotValue - lotCost
              return (
                <div key={lot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 15px', background: 'var(--card-bg)', borderRadius: '6px', marginBottom: '3px', border: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{lot.purchase_date}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{lot.quantity} @ {formatCurrency(lot.purchase_price, currency)}</p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: lotPnl >= 0 ? '#10b981' : '#ef4444', marginRight: '8px' }}>
                    {lotPnl >= 0 ? '+' : ''}{formatCurrency(lotPnl, currency)}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button onClick={(e) => {
                    e.stopPropagation()
                    setSellItem(lot)
                    setSellQuantity('')
                    setSellPrice(lot.current_price ? lot.current_price.toString() : '')
                  }}
                    style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#c9a54a', marginRight: '5px' }}>
                    Sell
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation()
                    setEditItem(lot)
                    setEditQuantity(lot.quantity.toString())
                    setEditPrice(lot.purchase_price.toString())
                  }}
                    style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)', marginRight: '5px' }}>
                    Edit
                  </button>
                  <button onClick={async (e) => {
                    e.stopPropagation()
                    if (confirm('Delete this investment lot?')) {
                      await deleteInvestment(lot.id)
                    }
                  }}
                    style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#c05a6e' }}>
                    Delete
                  </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </React.Fragment>
    )
  }
  
  const etfGroups = groupInvestments(etfs)
  const cryptoGroups = groupInvestments(cryptos)
  
  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>Investments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '5px' }}>Track your ETFs, crypto, and insurance policies</p>
        </div>
        <button onClick={refreshPrices}
          style={{ padding: '10px 20px', background: '#c9a54a', color: '#0a1628', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
          🔄 Refresh Prices
        </button>
      </div>
      
      {/* ETFs Section */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>📈 ETFs & Stocks</h3>
          <button onClick={() => setShowAddETF(true)}
            style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
            + Add
          </button>
        </div>
        {showAddETF && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <input type="text" placeholder="Ticker (e.g., BND)" value={newETF.symbol}
              onChange={(e) => setNewETF({...newETF, symbol: e.target.value.toUpperCase()})}
              style={{ flex: 1 }} />
            <input type="number" placeholder="Qty" value={newETF.quantity}
              onChange={(e) => setNewETF({...newETF, quantity: e.target.value})}
              style={{ width: '80px' }} />
            <input type="number" placeholder="Buy Price" value={newETF.purchase_price}
              onChange={(e) => setNewETF({...newETF, purchase_price: e.target.value})}
              style={{ width: '100px' }} />
            <button onClick={handleAddETF} style={{ padding: '8px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Save</button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(etfGroups).map(([key, lots]) => renderConsolidatedRow(key, lots, 'etf'))}
          {Object.keys(etfGroups).length === 0 && <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>No ETFs added yet</p>}
        </div>
      </div>
      
      {/* Crypto Section */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>🪙 Crypto</h3>
          <button onClick={() => setShowAddCrypto(true)}
            style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
            + Add
          </button>
        </div>
        {showAddCrypto && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <input type="text" placeholder="Coin (e.g., bitcoin)" value={newCrypto.symbol}
              onChange={(e) => setNewCrypto({...newCrypto, symbol: e.target.value})}
              style={{ flex: 1 }} />
            <input type="number" placeholder="Qty" value={newCrypto.quantity}
              onChange={(e) => setNewCrypto({...newCrypto, quantity: e.target.value})}
              style={{ width: '80px' }} />
            <input type="number" placeholder="Buy Price (AED)" value={newCrypto.purchase_price}
              onChange={(e) => setNewCrypto({...newCrypto, purchase_price: e.target.value})}
              style={{ width: '120px' }} />
            <button onClick={handleAddCrypto} style={{ padding: '8px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Save</button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(cryptoGroups).map(([key, lots]) => renderConsolidatedRow(key, lots, 'crypto'))}
          {Object.keys(cryptoGroups).length === 0 && <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>No crypto added yet</p>}
        </div>
      </div>
      
      {/* Insurance Section */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>🛡️ Insurance Policies</h3>
          <button onClick={() => setShowAddPolicy(true)}
            style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
            + Add Policy
          </button>
        </div>
        {showAddPolicy && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Policy Number" value={newPolicy.policy_number}
                onChange={(e) => setNewPolicy({...newPolicy, policy_number: e.target.value})}
                style={{ flex: 1 }} />
              <input type="text" placeholder="Company" value={newPolicy.company}
                onChange={(e) => setNewPolicy({...newPolicy, company: e.target.value})}
                style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select value={newPolicy.currency}
                onChange={(e) => setNewPolicy({...newPolicy, currency: e.target.value})}
                style={{ width: '100px' }}>
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="AED">AED</option>
              </select>
              <input type="number" placeholder="Total Invested" value={newPolicy.total_invested}
                onChange={(e) => setNewPolicy({...newPolicy, total_invested: e.target.value})}
                style={{ flex: 1 }} />
              <input type="number" placeholder="Current Value" value={newPolicy.current_value}
                onChange={(e) => setNewPolicy({...newPolicy, current_value: e.target.value})}
                style={{ flex: 1 }} />
            </div>
            <input type="date" value={newPolicy.maturity_date}
              onChange={(e) => setNewPolicy({...newPolicy, maturity_date: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={handleAddPolicy} style={{ padding: '8px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Save</button>
              <button onClick={() => setShowAddPolicy(false)} style={{ padding: '8px 15px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>Cancel</button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {insurancePolicies.map((policy: any) => {
            const pnl = policy.current_value - policy.total_invested
            const pnlPercent = policy.total_invested > 0 ? (pnl / policy.total_invested * 100) : 0
            return (
              <div key={policy.id} style={{ padding: '12px 15px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{policy.company} - {policy.policy_number}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(policy.current_value, policy.currency)}</p>
                    <p style={{ fontSize: '12px', color: pnl >= 0 ? '#10b981' : '#ef4444' }}>
                      {pnl >= 0 ? '+' : ''}{formatCurrency(pnl, policy.currency)} ({pnlPercent.toFixed(1)}%)
                    </p>
                  </div>
                  {updatingPolicyId === policy.id ? (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <input type="number" value={newPolicyValue} onChange={(e) => setNewPolicyValue(e.target.value)}
                        style={{ width: '100px', padding: '4px 8px', fontSize: '12px' }} />
                      <button onClick={async () => {
                        if (newPolicyValue) {
                          await updateInsurancePolicy(policy.id, {
                            current_value: parseFloat(newPolicyValue),
                            last_updated: new Date().toISOString().split('T')[0]
                          })
                          setUpdatingPolicyId(null)
                          setNewPolicyValue('')
                        }
                      }}
                        style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Save</button>
                      <button onClick={() => { setUpdatingPolicyId(null); setNewPolicyValue('') }}
                        style={{ padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setUpdatingPolicyId(policy.id); setNewPolicyValue(policy.current_value.toString()) }}
                      style={{ padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)', marginRight: '5px' }}>
                      Update Value
                    </button>
                  )}
                  <button onClick={async () => {
                    if (confirm('Delete this insurance policy?')) {
                      await deleteInsurancePolicy(policy.id)
                    }
                  }}
                    style={{ padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#c05a6e' }}>
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
          {insurancePolicies.length === 0 && <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>No policies added yet</p>}
        </div>
      </div>
      {editItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Edit Investment Lot</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{editItem.name}</p>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Quantity</label>
                <input type="number" step="0.000001" value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Purchase Price</label>
                <input type="number" step="0.01" value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={async () => {
                  const qty = parseFloat(editQuantity)
                  const price = parseFloat(editPrice)
                  if (qty <= 0) {
                    alert('Quantity must be positive')
                    return
                  }
                  // Update via store
                  const { investments, updateInvestmentQuantity, updateInvestmentPrice } = useFinanceStore.getState()
                  await updateInvestmentQuantity(editItem.id, qty)
                  await updateInvestmentPurchasePrice(editItem.id, price)
                  setEditItem(null)
                }}
                  style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  Save Changes
                </button>
                <button onClick={() => setEditItem(null)}
                  style={{ flex: 1, padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {sellItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Sell Investment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {sellItem.name} | Current: {sellItem.quantity} units
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Quantity to Sell</label>
                <input type="number" min="0.000001" step="0.000001" max={sellItem.quantity} value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Sale Price per Unit</label>
                <input type="number" step="0.01" value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={async () => {
                  const qtyToSell = parseFloat(sellQuantity)
                  if (!qtyToSell || qtyToSell <= 0 || qtyToSell > sellItem.quantity) {
                    alert('Please enter a valid quantity to sell')
                    return
                  }
                  const remainingQty = sellItem.quantity - qtyToSell
                  const salePriceVal = parseFloat(sellPrice) || 0
                  const costBasis = sellItem.purchase_price * qtyToSell
                  const saleValue = salePriceVal * qtyToSell
                  const pnl = saleValue - costBasis
                  
                  if (remainingQty > 0) {
                    await updateInvestmentQuantity(sellItem.id, remainingQty)
                  } else {
                    await deleteInvestment(sellItem.id)
                  }
                  
                  if (salePriceVal > 0) {
                    await addRealizedPnl({
                      asset_type: sellItem.type,
                      asset_name: sellItem.name,
                      quantity_sold: qtyToSell,
                      sale_price: salePriceVal,
                      cost_basis: sellItem.purchase_price,
                      realized_pnl: pnl,
                      sale_date: new Date().toISOString().split('T')[0],
                      currency: sellItem.currency
                    })
                    alert(`Sold ${qtyToSell} units. P&L: ${pnl.toFixed(2)} ${sellItem.currency}`)
                  }
                  setSellItem(null)
                  setSellQuantity('')
                  setSellPrice('')
                }}
                  style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  Confirm Sale
                </button>
                <button onClick={() => { setSellItem(null); setSellQuantity(''); setSellPrice('') }}
                  style={{ flex: 1, padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
