import React from 'react'
import { useFinanceStore } from '../store/financeStore'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'budget', label: 'Monthly Budget', icon: '💰' },
  { id: 'accounts', label: 'Accounts', icon: '🏦' },
  { id: 'investments', label: 'Investments', icon: '📈' },
  { id: 'gold', label: 'Gold', icon: '🥇' },
  { id: 'property', label: 'Property', icon: '🏠' },
  { id: 'reports', label: 'Reports', icon: '📄' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const { currentPage, setCurrentPage, theme, toggleTheme, createBackup } = useFinanceStore()
  
  const handleBackup = async () => {
    await createBackup()
    alert('Backup created successfully!')
  }
  
  return (
    <div className="sidebar">
      <div className="brand-name">Finance Manager</div>
      
      <nav style={{ flex: 1 }}>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            <span style={{ marginRight: '10px' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
      
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
        <button 
          onClick={handleBackup}
          style={{ 
            width: '100%', 
            backgroundColor: 'transparent',
            border: '1px solid var(--gold-accent)',
            color: 'var(--gold-accent)',
            marginBottom: '10px'
          }}
        >
          💾 Backup Now
        </button>
        
        <button 
          onClick={toggleTheme}
          style={{ 
            width: '100%',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white'
          }}
        >
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </div>
    </div>
  )
}
