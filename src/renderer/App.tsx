import React, { useEffect, useState } from 'react'
import { useFinanceStore } from './store/financeStore'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Accounts from './pages/Accounts'
import Investments from './pages/Investments'
import Gold from './pages/Gold'
import Property from './pages/Property'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'budget', label: 'Monthly Budget', icon: '◧' },
  { id: 'accounts', label: 'Accounts', icon: '◈' },
  { id: 'assets', label: 'Assets', icon: '▣', hasSubmenu: true },
  { id: 'reports', label: 'Reports', icon: '≡' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

const assetSubmenu = [
  { id: 'investments', label: 'Investments', icon: '↗' },
  { id: 'gold', label: 'Gold', icon: '◆' },
  { id: 'property', label: 'Property', icon: '▣' },
]

export default function App() {
  const { currentPage, setCurrentPage, theme, toggleTheme, refreshData, createBackup } = useFinanceStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [assetsExpanded, setAssetsExpanded] = useState(false)
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  
  useEffect(() => {
    refreshData()
  }, [])
  
  const handleBackup = async () => {
    await createBackup()
    alert('Backup saved successfully!')
  }
  
  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard />
      case 'budget': return <Budget />
      case 'accounts': return <Accounts />
      case 'investments': return <Investments />
      case 'gold': return <Gold />
      case 'property': return <Property />
      case 'reports': return <Reports />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }
  
  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', background: 'var(--bg-primary)' }}>
      <div className="sidebar" style={{ width: sidebarCollapsed ? '70px' : '230px' }}>
        <div style={{ height: '38px', flexShrink: 0, WebkitAppRegion: 'drag' }} />
        <div style={{ 
          WebkitAppRegion: 'drag', 
          padding: sidebarCollapsed ? '15px 10px' : '20px 20px',
          borderBottom: '1px solid rgba(201,165,74,0.2)', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start', 
          gap: '12px' 
        }}>
          <div style={{ 
            width: '36px', 
            height: '36px',
            background: 'linear-gradient(135deg, #c9a54a, #e0c78c)',
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#0a1628',
            fontFamily: "'Georgia', serif", 
            flexShrink: 0 
          }}>Y</div>
          {!sidebarCollapsed && (
            <span className="brand-name">
              Yasir Bin Yousuf
            </span>
          )}
        </div>

        <nav style={{ padding: '15px 10px', flex: 1, overflowY: 'auto' }}>
          {navigation.map(item => {
            const isSelected = currentPage === item.id || 
              (item.id === 'assets' && assetSubmenu.some(sub => sub.id === currentPage))
            return (
              <React.Fragment key={item.id}>
                <button 
                  onClick={() => { 
                    if (item.hasSubmenu) { 
                      setAssetsExpanded(!assetsExpanded) 
                    } else { 
                      setCurrentPage(item.id) 
                    } 
                  }}
                  className={`nav-item ${isSelected ? 'active' : ''}`}
                  style={{ 
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    padding: sidebarCollapsed ? '12px 0' : '12px 15px'
                  }}
                >
                  <span style={{ fontSize: '18px', width: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && item.label}
                  {item.hasSubmenu && !sidebarCollapsed && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'rgba(226,232,240,0.5)' }}>
                      {assetsExpanded ? '▼' : '▶'}
                    </span>
                  )}
                </button>
                {item.hasSubmenu && assetsExpanded && !sidebarCollapsed && (
                  <div style={{ paddingLeft: '36px' }}>
                    {assetSubmenu.map(sub => (
                      <button 
                        key={sub.id} 
                        onClick={() => setCurrentPage(sub.id)}
                        className={`subnav-item ${currentPage === sub.id ? 'active' : ''}`}
                      >
                        <span style={{ fontSize: '16px' }}>{sub.icon}</span>
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </nav>

        <div style={{ padding: '15px 10px', borderTop: '1px solid rgba(201,165,74,0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={handleBackup}
            style={{ 
              padding: '10px', 
              background: 'rgba(16,185,129,0.1)', 
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '8px', 
              color: '#10b981', 
              cursor: 'pointer', 
              fontSize: '13px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px' 
            }}
          >
            <span>💾</span>
            {!sidebarCollapsed && <span>Backup</span>}
          </button>
          <button 
            onClick={toggleTheme}
            style={{ 
              padding: '10px', 
              background: 'transparent', 
              border: '1px solid rgba(201,165,74,0.3)', 
              borderRadius: '8px', 
              color: '#d4b36a', 
              cursor: 'pointer', 
              fontSize: '13px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px' 
            }}
          >
            <span>{theme === 'dark' ? '☀' : '☾'}</span>
            {!sidebarCollapsed && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
          </button>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ 
              padding: '10px', 
              background: 'rgba(201,165,74,0.1)', 
              border: '1px solid rgba(201,165,74,0.25)', 
              borderRadius: '8px', 
              color: '#d4b36a', 
              cursor: 'pointer', 
              fontSize: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px' 
            }}
          >
            <span>{sidebarCollapsed ? '→' : '←'}</span>
            {!sidebarCollapsed && <span style={{ fontSize: '13px' }}>Collapse</span>}
          </button>
        </div>
      </div>

      <div className="main-content">
        <div style={{ height: '38px' }} />
        {renderPage()}
      </div>
    </div>
  )
}
