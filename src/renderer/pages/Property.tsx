import React, { useState, useEffect } from 'react'
import { useFinanceStore } from '../store/financeStore'
import { CalculationEngine } from '../services/calculations'
import { ValidationService } from '../services/validation'

export default function Property() {
  const { properties, addProperty, updateProperty, deleteProperty } = useFinanceStore()
  const [showFullSchedule, setShowFullSchedule] = useState(false)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null)
  const [newProperty, setNewProperty] = useState({
    name: '', purchase_price: '', additional_costs: '', equity_upfront: '',
    mortgage_amount: '', interest_rate: '', tenure_years: '', emi_amount: '',
    additional_fees: '', start_date: ''
  })
  
  // Display all properties - each gets its own section
  
  // Helper to calculate schedule for a specific property
  const getScheduleForProperty = (prop: any) => {
    if (!prop) return []
    const sched = CalculationEngine.calculateAmortization(
      prop.mortgage_amount,
      prop.interest_rate,
      prop.tenure_years,
      prop.emi_amount
    )
    
    const startDate = new Date(prop.start_date)
    const today = new Date()
    return sched.map(payment => {
      const paymentDate = new Date(startDate)
      paymentDate.setMonth(paymentDate.getMonth() + payment.paymentNumber - 1)
      const isPaid = paymentDate <= today
      
      return {
        ...payment,
        payment_date: paymentDate.toISOString().split('T')[0],
        payment_amount: prop.emi_amount,
        is_paid: isPaid ? 1 : 0
      }
    })
  }
  
  // Schedule is now calculated per property via getScheduleForProperty
  
  const handleSaveProperty = async () => {
    console.log('handleSaveProperty called', newProperty)
    
    if (!newProperty.name) {
      alert('Property name is required')
      return
    }
    
    if (newProperty.name && newProperty.mortgage_amount) {
      const totalCost = (parseFloat(newProperty.purchase_price) || 0) + (parseFloat(newProperty.additional_costs) || 0)
      const propertyData = {
        ...newProperty,
        total_cost: totalCost,
        purchase_price: parseFloat(newProperty.purchase_price) || 0,
        additional_costs: parseFloat(newProperty.additional_costs) || 0,
        equity_upfront: parseFloat(newProperty.equity_upfront) || 0,
        mortgage_amount: parseFloat(newProperty.mortgage_amount) || 0,
        interest_rate: parseFloat(newProperty.interest_rate) || 0,
        tenure_years: parseInt(newProperty.tenure_years) || 0,
        emi_amount: parseFloat(newProperty.emi_amount) || 0,
        additional_fees: parseFloat(newProperty.additional_fees) || 0
      }
      
      if (editingPropertyId) {
        await updateProperty(editingPropertyId, propertyData)
        setEditingPropertyId(null)
      } else {
        await addProperty(propertyData)
      }
      
      setShowAddProperty(false)
    }
  }
  
  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '-'
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(amount)
  }
  
  const calculateCurrentEquity = (prop: any) => {
    if (!prop) return 0
    const propSchedule = getScheduleForProperty(prop)
    const paidPrincipal = propSchedule
      .filter(p => p.is_paid === 1)
      .reduce((sum, p) => sum + p.principal, 0)
    return prop.equity_upfront + paidPrincipal
  }
  
  // These are now calculated per property in the render
  
  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>Property</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '5px' }}>Track your property and mortgage</p>
        </div>
        <button onClick={() => {
          setEditingPropertyId(null)
          setNewProperty({
            name: '', purchase_price: '', additional_costs: '', equity_upfront: '',
            mortgage_amount: '', interest_rate: '', tenure_years: '', emi_amount: '',
            additional_fees: '', start_date: ''
          })
          setShowAddProperty(true)
        }}
          style={{ padding: '10px 20px', background: '#c9a54a', color: '#0a1628', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
          + Add Property
        </button>
      </div>
      
      {properties.length === 0 ? (
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>No property added yet</p>
        </div>
      ) : (
        properties.map(property => (
        <>
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>{property.name}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Started: {property.start_date || 'Not set'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => {
                setEditingPropertyId(property.id)
                setNewProperty({
                  name: property.name,
                  purchase_price: property.purchase_price?.toString() || '',
                  additional_costs: property.additional_costs?.toString() || '',
                  equity_upfront: property.equity_upfront?.toString() || '',
                  mortgage_amount: property.mortgage_amount?.toString() || '',
                  interest_rate: property.interest_rate?.toString() || '',
                  tenure_years: property.tenure_years?.toString() || '',
                  emi_amount: property.emi_amount?.toString() || '',
                  additional_fees: property.additional_fees?.toString() || '',
                  start_date: property.start_date || ''
                })
                setShowAddProperty(true)
              }}
                style={{ padding: '8px 15px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Edit
              </button>
              <button onClick={async () => {
                if (confirm(`Delete property "${property.name}"? This will remove all mortgage data.`)) {
                  await deleteProperty(property.id)
                }
              }}
                style={{ padding: '8px 15px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#c05a6e' }}>
                Delete
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <div style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '18px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Total Cost</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(property.total_cost)}</p>
            </div>
            <div style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '18px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Equity Upfront</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#d4b36a' }}>{formatCurrency(property.equity_upfront)}</p>
            </div>
            <div style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '18px', border: '2px solid #c9a54a' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Current Equity</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#e0c78c' }}>{formatCurrency(calculateCurrentEquity(property))}</p>
            </div>
            <div style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '18px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Mortgage Amount</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#c05a6e' }}>{formatCurrency(property.mortgage_amount)}</p>
            </div>
            <div style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '18px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Monthly EMI</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(property.emi_amount)}</p>
            </div>
            {property.additional_fees > 0 && (
              <div style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '18px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Additional Fees</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#e0c78c' }}>{formatCurrency(property.additional_fees)}</p>
              </div>
            )}
          </div>
          
          {(() => {
            const propSchedule = getScheduleForProperty(property)
            const nextUnpaid = propSchedule.find(row => !row.is_paid)
            const visibleSchedule = showFullSchedule ? propSchedule : (nextUnpaid ? [nextUnpaid] : [])
            
            return (
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Amortization Schedule</h3>
              <button onClick={() => setShowFullSchedule(!showFullSchedule)}
                style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {showFullSchedule ? 'Show Next EMI Only' : 'Show Full Schedule'}
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>Date</th>
                    <th style={{ textAlign: 'right', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>Payment</th>
                    <th style={{ textAlign: 'right', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>Principal</th>
                    <th style={{ textAlign: 'right', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>Profit</th>
                    <th style={{ textAlign: 'right', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>Balance</th>
                    <th style={{ textAlign: 'center', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSchedule.map((row: any) => (
                    <tr key={row.paymentNumber} style={{ borderBottom: '1px solid var(--border)', background: row.is_paid ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                      <td style={{ padding: '8px 10px', fontSize: '13px', color: 'var(--text-primary)' }}>{row.paymentNumber}</td>
                      <td style={{ padding: '8px 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>{row.payment_date}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '13px', color: 'var(--text-primary)' }}>{formatCurrency(row.payment_amount)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '13px', color: '#10b981' }}>{formatCurrency(row.principal)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '13px', color: '#c05a6e' }}>{formatCurrency(row.interest)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '13px', color: 'var(--text-primary)' }}>{formatCurrency(row.balance)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {row.is_paid ? <span style={{ color: '#10b981' }}>✓ Paid</span> : <span style={{ color: 'var(--text-tertiary)' }}>Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            )
          })()}
          
          <div style={{ borderTop: '2px solid var(--border)', margin: '30px 0' }} />
        </>
        ))
      )}
      
      {showAddProperty && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>{editingPropertyId ? 'Edit Property Details' : 'Add Property Details'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Property Name</label>
                <input type="text" placeholder="e.g., Dubai Marina Apartment" value={newProperty.name}
                  onChange={(e) => setNewProperty({...newProperty, name: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Purchase Price (AED)</label>
                  <input type="number" placeholder="0" value={newProperty.purchase_price}
                    onChange={(e) => setNewProperty({...newProperty, purchase_price: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Additional Costs (AED)</label>
                  <input type="number" placeholder="0" value={newProperty.additional_costs}
                    onChange={(e) => setNewProperty({...newProperty, additional_costs: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Equity Paid Upfront (AED)</label>
                <input type="number" placeholder="0" value={newProperty.equity_upfront}
                  onChange={(e) => setNewProperty({...newProperty, equity_upfront: e.target.value})} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Mortgage Amount (AED)</label>
                <input type="number" placeholder="0" value={newProperty.mortgage_amount}
                  onChange={(e) => setNewProperty({...newProperty, mortgage_amount: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Profit Rate (%)</label>
                  <input type="number" step="0.01" placeholder="0" value={newProperty.interest_rate}
                    onChange={(e) => setNewProperty({...newProperty, interest_rate: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Tenure (Years)</label>
                  <input type="number" placeholder="25" value={newProperty.tenure_years}
                    onChange={(e) => setNewProperty({...newProperty, tenure_years: e.target.value})} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>EMI Amount (AED/month)</label>
                  <input type="number" placeholder="0" value={newProperty.emi_amount}
                    onChange={(e) => setNewProperty({...newProperty, emi_amount: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Additional Fees (AED)</label>
                  <input type="number" placeholder="0" value={newProperty.additional_fees}
                    onChange={(e) => setNewProperty({...newProperty, additional_fees: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Start Date</label>
                <input type="date" value={newProperty.start_date}
                  onChange={(e) => setNewProperty({...newProperty, start_date: e.target.value})} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                Schedule is auto-calculated based on mortgage amount, rate, and tenure
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={handleSaveProperty}
                  style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  {editingPropertyId ? 'Update Property' : 'Save Property'}
                </button>
                <button onClick={() => setShowAddProperty(false)}
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
