import React, { useState, useEffect } from 'react';
import { api } from '../App';
import { 
  Plus, 
  Trash2, 
  Eye, 
  X, 
  ShoppingCart,
  Calendar,
  DollarSign,
  User,
  PlusCircle
} from 'lucide-react';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal control
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Checkout form fields
  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1, max_stock: 0, price: 0 }
  ]);

  // Form errors
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products'),
        api.get('/customers')
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      setCustomers(customersRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data from server.');
    } finally {
      setLoading(false);
    }
  };

  const clearNotification = () => {
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const handleOpenCreate = () => {
    if (customers.length === 0) {
      alert('Please register at least one Customer before placing an order.');
      return;
    }
    if (products.length === 0) {
      alert('Please add at least one Product to the catalog before placing an order.');
      return;
    }
    setCustomerId(customers[0]?.id || '');
    setOrderItems([{ product_id: '', quantity: 1, max_stock: 0, price: 0 }]);
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleAddRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, max_stock: 0, price: 0 }]);
  };

  const handleRemoveRow = (index) => {
    if (orderItems.length === 1) return;
    const items = [...orderItems];
    items.splice(index, 1);
    setOrderItems(items);
  };

  const handleItemChange = (index, field, value) => {
    const items = [...orderItems];
    if (field === 'product_id') {
      const prodId = parseInt(value);
      const selectedProd = products.find(p => p.id === prodId);
      if (selectedProd) {
        items[index] = {
          ...items[index],
          product_id: prodId,
          max_stock: selectedProd.quantity_in_stock,
          price: selectedProd.price,
          quantity: Math.min(items[index].quantity, selectedProd.quantity_in_stock || 1)
        };
      } else {
        items[index] = { product_id: '', quantity: 1, max_stock: 0, price: 0 };
      }
    } else if (field === 'quantity') {
      const qty = parseInt(value) || 0;
      items[index] = {
        ...items[index],
        quantity: Math.max(1, qty)
      };
    }
    setOrderItems(items);
  };

  const calculateRunningTotal = () => {
    return orderItems.reduce((acc, item) => {
      return acc + (item.price * item.quantity);
    }, 0);
  };

  const validateOrderForm = () => {
    const errors = {};
    if (!customerId) {
      errors.customerId = 'Customer is required';
    }

    const itemsErrors = [];
    orderItems.forEach((item, idx) => {
      if (!item.product_id) {
        itemsErrors.push(`Row #${idx + 1}: Select a product`);
      } else {
        if (item.quantity <= 0) {
          itemsErrors.push(`Row #${idx + 1}: Quantity must be greater than zero`);
        }
        if (item.quantity > item.max_stock) {
          itemsErrors.push(`Row #${idx + 1}: Insufficient stock (${item.max_stock} units available)`);
        }
      }
    });

    if (itemsErrors.length > 0) {
      errors.items = itemsErrors;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!validateOrderForm()) return;

    const payload = {
      customer_id: parseInt(customerId),
      items: orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    try {
      await api.post('/orders', payload);
      setSuccessMsg('Order placed successfully!');
      setShowCreateModal(false);
      fetchInitialData();
      clearNotification();
    } catch (err) {
      console.error(err);
      const apiErr = err.response?.data?.detail || 'An error occurred while creating order.';
      setFormErrors({ apiError: apiErr });
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this order? Inventory items will be returned to stock.')) return;
    try {
      await api.delete(`/orders/${id}`);
      setSuccessMsg('Order cancelled and deleted. Stock levels refunded.');
      fetchInitialData();
      clearNotification();
    } catch (err) {
      console.error(err);
      setError('Failed to cancel order.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="header-container">
        <div className="header-title">
          <h1>Order Management</h1>
          <p>Create orders, checkout items, and monitor historical sales</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Create Order
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="alert alert-success">
          <ShoppingCart size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      {/* Orders Directory Card */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading orders list...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No orders placed yet. Click "Create Order" to begin.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date Placed</th>
                  <th>Total Amount</th>
                  <th>Items Purchased</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
                  return (
                    <tr key={order.id}>
                      <td><code>#ORD-{order.id.toString().padStart(4, '0')}</code></td>
                      <td style={{ fontWeight: 600 }}>{order.customer_name}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          {formatDate(order.created_at)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.6rem' }}
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye size={14} />
                            Details
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.4rem 0.6rem' }}
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Place Order (Checkout) Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Create Sales Order</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder}>
              <div className="modal-body">
                {formErrors.apiError && (
                  <div className="alert alert-danger" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                    {formErrors.apiError}
                  </div>
                )}

                {/* Customer selection */}
                <div className="form-group">
                  <label className="form-label">Select Customer</label>
                  <select 
                    className="form-control" 
                    value={customerId} 
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                    ))}
                  </select>
                  {formErrors.customerId && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{formErrors.customerId}</span>}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1rem' }}>Order Items</h4>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleAddRow}>
                      <PlusCircle size={14} />
                      Add Product
                    </button>
                  </div>

                  {formErrors.items && (
                    <div style={{ marginBottom: '1rem' }}>
                      {formErrors.items.map((err, idx) => (
                        <div key={idx} style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                          ⚠️ {err}
                        </div>
                      ))}
                    </div>
                  )}

                  {orderItems.map((item, index) => {
                    // Filter options to hide products already selected in other rows
                    const selectedOtherProductIds = orderItems
                      .map((o, idx) => idx !== index ? o.product_id : null)
                      .filter(id => id !== null);

                    const availableProductOptions = products.filter(p => !selectedOtherProductIds.includes(p.id));

                    return (
                      <div key={index} className="order-item-row">
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Product</label>
                          <select 
                            className="form-control"
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                            required
                          >
                            <option value="">-- Select Product --</option>
                            {availableProductOptions.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (${p.price.toFixed(2)} - {p.quantity_in_stock} stock)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Quantity</label>
                          <input 
                            type="number" 
                            min="1" 
                            className="form-control"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            required
                            disabled={!item.product_id}
                          />
                        </div>

                        <div style={{ paddingBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Sub: ${(item.price * item.quantity).toFixed(2)}
                        </div>

                        <div>
                          <button 
                            type="button" 
                            className="btn btn-danger" 
                            style={{ padding: '0.6rem', opacity: orderItems.length === 1 ? 0.3 : 1 }}
                            onClick={() => handleRemoveRow(index)}
                            disabled={orderItems.length === 1}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total amount summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Estimated Total Amount:</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-teal)' }}>
                    ${calculateRunningTotal().toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Place Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Order Detail Summary</h3>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Order Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Order Number:</div>
                  <code style={{ fontSize: '1rem', fontWeight: 700 }}>#ORD-{selectedOrder.id.toString().padStart(4, '0')}</code>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Customer Name:</div>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={14} />{selectedOrder.customer_name}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Date Placed:</div>
                  <span style={{ fontSize: '0.9rem' }}>{formatDate(selectedOrder.created_at)}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Total Amount Charged:</div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><DollarSign size={14} />{selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Items Purchased List */}
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Purchased Items</h4>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price Per Unit</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price_per_unit.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          ${(item.quantity * item.price_per_unit).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close Summary</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
