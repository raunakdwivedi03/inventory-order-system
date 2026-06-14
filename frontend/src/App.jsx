import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Database,
  WifiOff
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';

// Configure global API endpoint
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

function Navigation() {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/orders', label: 'Orders', icon: ShoppingCart },
  ];

  return (
    <nav className="sidebar-nav">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="nav-icon" />
            <span className="nav-text">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function App() {
  const [backendHealthy, setBackendHealthy] = useState(true);

  // Health check on boot
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get(`${API_BASE_URL}/`);
        setBackendHealthy(true);
      } catch (err) {
        setBackendHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo-section">
            <div className="logo-icon">
              <Database size={24} />
            </div>
            <span className="logo-text">FlowStock</span>
          </div>

          <Navigation />

          <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            v1.0.0 • Connected
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {!backendHealthy && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              <WifiOff size={20} />
              <span>Backend API is currently offline. Please verify that your Docker containers or local backend server is running.</span>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
// Trigger Vercel rebuild with correct directory settings
