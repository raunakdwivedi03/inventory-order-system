import React, { useState, useEffect } from 'react';
import { api } from '../App';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="header-container">
          <div className="header-title">
            <h1>Dashboard</h1>
            <p>Overview of system metrics</p>
          </div>
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="header-container">
          <div className="header-title">
            <h1>Dashboard</h1>
            <p>Overview of system metrics</p>
          </div>
        </div>
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-secondary" onClick={fetchStats}>Retry</button>
      </div>
    );
  }

  const { total_products, total_customers, total_orders, low_stock_products } = stats;

  return (
    <div>
      {/* Header */}
      <div className="header-container">
        <div className="header-title">
          <h1>Dashboard</h1>
          <p>Real-time analytics & status overview</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-stats">
        <div className="card stat-card">
          <div className="stat-icon-wrapper primary">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{total_products}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper teal">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{total_customers}</div>
            <div className="stat-label">Total Customers</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper success">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{total_orders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className={`stat-icon-wrapper ${low_stock_products.length > 0 ? 'warning' : 'success'}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{low_stock_products.length}</div>
            <div className="stat-label">Low Stock items</div>
          </div>
        </div>
      </div>

      {/* Split Section: Low Stock Warning & Quick Actions */}
      <div className="layout-split">
        {/* Left Side: Low Stock Warnings */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} className="text-warning" style={{ color: 'var(--warning)' }} />
              Low Stock Warnings
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Threshold: &lt; 10 units</span>
          </div>

          {low_stock_products.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              All products have sufficient stock levels. Good job!
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {low_stock_products.map((product) => (
                    <tr key={product.id}>
                      <td style={{ fontWeight: 600 }}>{product.name}</td>
                      <td><code>{product.sku}</code></td>
                      <td>
                        <span style={{ fontWeight: 700, color: product.quantity_in_stock === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                          {product.quantity_in_stock}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${product.quantity_in_stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {product.quantity_in_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Quick Action Navigation */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} className="text-teal" style={{ color: 'var(--accent-teal)' }} />
            Quick Actions
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/orders" className="btn btn-primary" style={{ justifyContent: 'space-between', width: '100%' }}>
              <span>Create New Order</span>
              <ArrowRight size={16} />
            </Link>
            
            <Link to="/products" className="btn btn-secondary" style={{ justifyContent: 'space-between', width: '100%' }}>
              <span>Manage Products</span>
              <ArrowRight size={16} />
            </Link>

            <Link to="/customers" className="btn btn-secondary" style={{ justifyContent: 'space-between', width: '100%' }}>
              <span>Manage Customers</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Need Help?
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Add customers and products first before placing orders. The inventory levels will decrement automatically upon checking out.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
