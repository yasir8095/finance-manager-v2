import React, { useState, useEffect } from 'react'
import { useFinanceStore } from '../store/financeStore'

export default function Gold() {
  const { goldHoldings, goldPrices, addGoldHolding, addGoldPrice, deleteGoldHolding, updateGoldHolding, addRealizedPnl } = useFinanceStore()
  const [showAddHolding, setShowAddHolding] = useState(false)
  const [newHolding, setNewHolding] = useState({ caratage: '24ct', bar_size: '', units: '', purchase_price: '', purchase_date: '' })
  const [goldPrice24ct, setGoldPrice24ct] = useState('')
  const [goldPrice22ct, setGoldPrice22ct] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [sellItem, setSellItem] = useState<any>(null)
  const [sellUnits, setSellUnits] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  
  useEffect(() => {
    if (goldPrices.length > 0) {
      const latest = goldPrices[0]
      setGoldPrice24ct(latest.price_24ct > 0 ? latest.price_24ct.toString() : '')
      setGoldPrice22ct(latest.price_22ct > 0 ? latest.price_22ct.toString() : '')
    }
  }, [goldPrices])
  
  const fetchGoldPrice = async () => {
    setIsFetching(true)
    try {
      const result = await (window as any).electronAPI.fetchGoldPrice()
      
      if (result && result.price24ct > 0) {
        const rounded24ct = Math.round(result.price24ct * 100) / 100
        const rounded22ct = Math.round(result.price22ct * 100) / 100
        setGoldPrice24ct(rounded24ct.toFixed(2))
        setGoldPrice22ct(rounded22ct.toFixed(2))
        
        await addGoldPrice({
          date: new Date().toISOString().split('T')[0],
          price_24ct: rounded24ct,
          price_22ct: rounded22ct,
          currency: 'AED'
        })
      } else {
        alert('Could not fetch gold price. Please enter manually.')
      }
    } catch (error) {
      console.error('Failed to fetch gold price:', error)
      alert('Failed to fetch gold price. Please enter manually.')
    } finally {
      setIsFetching(false)
    }
  }
  
  const handleSavePrice = async () => {
    if (goldPrice24ct && goldPrice22ct) {
      await addGoldPrice({
        date: new Date().toISOString().split('T')[0],
        price_24ct: parseFloat(goldPrice24ct),
        price_22ct: parseFloat(goldPrice22ct),
        currency: 'AED'
      })
      alert('Gold prices saved successfully!')
    }
  }
  
  const handleAddHolding = async () => {
    if (newHolding.bar_size === '' || newHolding.units === '') {
      alert('Please enter bar size and units')
      return
    }
    
    const barSize = parseFloat(newHolding.bar_size)
    const units = parseInt(newHolding.units)
    const purchasePrice = newHolding.purchase_price ? parseFloat(newHolding.purchase_price) : 0
    
    if (barSize <= 0) {
      alert('Bar size must be a positive number')
      return
    }
    if (units <= 0) {
      alert('Units must be a positive number')
      return
    }
    if (purchasePrice < 0) {
      alert('Purchase price cannot be negative')
      return
    }
    
    if (newHolding.bar_size !== '' && newHolding.units !== '') {
      const totalWeight = parseFloat(newHolding.bar_size) * parseFloat(newHolding.units)
      await addGoldHolding({
        caratage: newHolding.caratage,
        bar_size: parseFloat(newHolding.bar_size),
        units: parseInt(newHolding.units),
        total_weight: totalWeight,
        purchase_price: parseFloat(newHolding.purchase_price) || 0,
        purchase_date: newHolding.purchase_date || new Date().toISOString().split('T')[0]
      })
      setShowAddHolding(false)
      setNewHolding({ caratage: '24ct', bar_size: '', units: '', purchase_price: '', purchase_date: '' })
    }
  }
  
  const toggleExpand = (key: string) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }
  
  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '-'
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(amount)
  }
  
  // Group holdings by caratage + bar_size
  const groupedHoldings: Record<string, any[]> = {}
  goldHoldings.forEach(h => {
    const key = `${h.caratage}-${h.bar_size}g`
    if (!groupedHoldings[key]) groupedHoldings[key] = []
    groupedHoldings[key].push(h)
  })
  
  const gold24ct = goldHoldings.filter(h => h.caratage === '24ct')
  const gold22ct = goldHoldings.filter(h => h.caratage === '22ct')
  const total24ctWeight = gold24ct.reduce((sum, h) => sum + (h.total_weight || 0), 0)
  const total22ctWeight = gold22ct.reduce((sum, h) => sum + (h.total_weight || 0), 0)
  const total24ctValue = total24ctWeight * (parseFloat(goldPrice24ct) || 0)
  const total22ctValue = total22ctWeight * (parseFloat(goldPrice22ct) || 0)
  const totalGoldValue = total24ctValue + total22ctValue
  
  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>Gold Holdings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '5px' }}>Track your physical gold</p>
        </div>
        <button onClick={() => setShowAddHolding(true)}
          style={{ padding: '10px 20px', background: '#c9a54a', color: '#0a1628', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
          + Add Holding
        </button>
      </div>
      
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '15px' }}>Current Gold Prices (AED/gram)</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '5px' }}>24ct Price</label>
            <input type="number" value={goldPrice24ct}
              onChange={(e) => setGoldPrice24ct(e.target.value)}
              style={{ width: '150px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '5px' }}>22ct Price</label>
            <input type="number" value={goldPrice22ct}
              onChange={(e) => setGoldPrice22ct(e.target.value)}
              style={{ width: '150px' }} />
          </div>
          <button onClick={fetchGoldPrice} disabled={isFetching}
            style={{ padding: '10px 20px', background: '#c9a54a', color: '#0a1628', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
            {isFetching ? 'Fetching...' : '🔄 Fetch Latest'}
          </button>
          <button onClick={handleSavePrice}
            style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Save Price
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '20px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>24ct Weight</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#d4b36a' }}>{total24ctWeight.toFixed(2)}g</p>
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '20px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>22ct Weight</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#d4b36a' }}>{total22ctWeight.toFixed(2)}g</p>
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '20px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>24ct Value</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#d4b36a' }}>{formatCurrency(total24ctValue)}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '20px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>22ct Value</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#d4b36a' }}>{formatCurrency(total22ctValue)}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '20px', border: '2px solid #c9a54a' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Total Gold Value</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#e0c78c' }}>{formatCurrency(totalGoldValue)}</p>
        </div>
      </div>
      
      {showAddHolding && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Add Gold Holding</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select value={newHolding.caratage}
                onChange={(e) => setNewHolding({...newHolding, caratage: e.target.value})}>
                <option value="24ct">24ct</option>
                <option value="22ct">22ct</option>
              </select>
              <input type="number" placeholder="Bar size (grams)" value={newHolding.bar_size}
                onChange={(e) => setNewHolding({...newHolding, bar_size: e.target.value})} />
              <input type="number" placeholder="Number of units" value={newHolding.units}
                onChange={(e) => setNewHolding({...newHolding, units: e.target.value})} />
              <input type="number" placeholder="Purchase price per gram (optional)" value={newHolding.purchase_price}
                onChange={(e) => setNewHolding({...newHolding, purchase_price: e.target.value})} />
              <input type="date" value={newHolding.purchase_date}
                onChange={(e) => setNewHolding({...newHolding, purchase_date: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={handleAddHolding}
                  style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  Save
                </button>
                <button onClick={() => setShowAddHolding(false)}
                  style={{ flex: 1, padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '15px' }}>Holdings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(groupedHoldings).map(([key, lots]) => {
            const [caratage, barSize] = key.split('-')
            const totalUnits = lots.reduce((sum, lot) => sum + (lot.units || 0), 0)
            const totalWeight = lots.reduce((sum, lot) => sum + (lot.total_weight || 0), 0)
            const price = caratage === '24ct' ? parseFloat(goldPrice24ct) || 0 : parseFloat(goldPrice22ct) || 0
            const value = totalWeight * price
            const isExpanded = expandedItems[key]
            
            return (
              <React.Fragment key={key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', background: 'var(--bg-tertiary)', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => toggleExpand(key)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{isExpanded ? '▼' : '▶'}</span>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{caratage} - {barSize}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{totalUnits} units • {totalWeight}g total</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#d4b36a' }}>{formatCurrency(value)}</span>
                </div>
                {isExpanded && (
                  <div style={{ marginLeft: '25px', marginTop: '5px', marginBottom: '10px' }}>
                    {lots.map((lot: any) => (
                      <div key={lot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 15px', background: 'var(--card-bg)', borderRadius: '6px', marginBottom: '3px', border: '1px solid var(--border)' }}>
                        <div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{lot.purchase_date || 'No date'}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{lot.units} units @ {lot.bar_size}g</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{lot.total_weight}g</span>
                          <button onClick={(e) => {
                            e.stopPropagation()
                            setSellItem(lot)
                            setSellUnits('')
                            setSellPrice(lot.purchase_price ? (currentGoldPrice ? (lot.caratage === '24ct' ? currentGoldPrice : currentGoldPrice).toString() : '') : '')
                          }}
                            style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#c9a54a', marginRight: '5px' }}>
                            Sell
                          </button>
                          <button onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm('Remove this gold holding?')) {
                              await deleteGoldHolding(lot.id)
                            }
                          }}
                            style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#c05a6e' }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            )
          })}
          {Object.keys(groupedHoldings).length === 0 && (
            <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>No holdings added yet</p>
          )}
        </div>
      </div>
      {sellItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Sell Gold</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {sellItem.caratage} - {sellItem.bar_size}g bar | Current: {sellItem.units} units | Total weight: {sellItem.total_weight}g
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Units to Sell</label>
                <input type="number" min="1" max={sellItem.units} value={sellUnits}
                  onChange={(e) => setSellUnits(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Sale Price per Gram (AED)</label>
                <input type="number" step="0.01" value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={async () => {
                  const unitsToSell = parseInt(sellUnits)
                  if (!unitsToSell || unitsToSell <= 0 || unitsToSell > sellItem.units) {
                    alert('Please enter a valid number of units to sell')
                    return
                  }
                  const remainingUnits = sellItem.units - unitsToSell
                  const weightPerUnit = sellItem.total_weight / sellItem.units
                  const remainingWeight = remainingUnits * weightPerUnit
                  const salePriceVal = parseFloat(sellPrice) || 0
                  const weightSold = unitsToSell * weightPerUnit
                  const costBasis = (sellItem.purchase_price || 0) * weightSold
                  const saleValue = salePriceVal * weightSold
                  const pnl = saleValue - costBasis
                  
                  if (remainingUnits > 0) {
                    await updateGoldHolding(sellItem.id, { units: remainingUnits, total_weight: remainingWeight })
                  } else {
                    await deleteGoldHolding(sellItem.id)
                  }
                  
                  if (salePriceVal > 0) {
                    await addRealizedPnl({
                      asset_type: 'gold',
                      asset_name: `${sellItem.caratage} - ${sellItem.bar_size}g`,
                      quantity_sold: weightSold,
                      sale_price: salePriceVal,
                      cost_basis: sellItem.purchase_price || 0,
                      realized_pnl: pnl,
                      sale_date: new Date().toISOString().split('T')[0],
                      currency: 'AED'
                    })
                    alert(`Sold ${unitsToSell} units (${weightSold.toFixed(2)}g). P&L: ${pnl.toFixed(2)} AED`)
                  }
                  setSellItem(null)
                  setSellUnits('')
                  setSellPrice('')
                }}
                  style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  Confirm Sale
                </button>
                <button onClick={() => { setSellItem(null); setSellUnits(''); setSellPrice('') }}
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
