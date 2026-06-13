import React, { useState, useEffect } from 'react';
import { api } from '../App';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X,
  PackageCheck
} from 'lucide-react';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal control
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState(0.0);
  const [quantity, setQuantity] = useState(0);

  // Validation errors
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve products list.');
    } finally {
      setLoading(false);
    }
  };

  const clearNotification = () => {
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setName('');
    setSku('');
    setPrice(0.0);
    setQuantity(0);
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setIsEditing(true);
    setCurrentId(product.id);
    setName(product.name);
    setSku(product.sku);
    setPrice(product.price);
    setQuantity(product.quantity_in_stock);
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Product name is required';
    if (!sku.trim()) errors.sku = 'SKU is required';
    if (price < 0) errors.price = 'Price cannot be negative';
    if (quantity < 0) errors.quantity = 'Quantity cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name,
      sku,
      price: parseFloat(price),
      quantity_in_stock: parseInt(quantity)
    };

    try {
      if (isEditing) {
        await api.put(`/products/${currentId}`, payload);
        setSuccessMsg(`Product '${name}' updated successfully!`);
      } else {
        await api.post('/products', payload);
        setSuccessMsg(`Product '${name}' created successfully!`);
      }
      setShowModal(false);
      fetchProducts();
      clearNotification();
    } catch (err) {
      console.error(err);
      const apiErr = err.response?.data?.detail || 'An error occurred during submission.';
      setFormErrors({ apiError: apiErr });
    }
  };

  const handleDelete = async (id, productName) => {
    if (!window.confirm(`Are you sure you want to delete product '${productName}'?`)) return;
    try {
      await api.delete(`/products/${id}`);
      setSuccessMsg(`Product '${productName}' deleted successfully!`);
      fetchProducts();
      clearNotification();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to delete product. It might be referenced in orders.');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Client side filtering
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="header-container">
        <div className="header-title">
          <h1>Product Management</h1>
          <p>Create, update, and manage your inventory catalog</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="alert alert-success">
          <PackageCheck size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      {/* Main card */}
      <div className="card">
        {/* Search bar */}
        <div className="form-group" style={{ position: 'relative', maxWidth: '350px', marginBottom: '1.5rem' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Search by Name or SKU..." 
            className="form-control" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {searchTerm ? 'No products match your search.' : 'No products in the catalog yet.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock Quantity</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td><code>{product.sku}</code></td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.quantity_in_stock}</td>
                    <td>
                      <span className={`badge ${
                        product.quantity_in_stock === 0 ? 'badge-danger' : 
                        product.quantity_in_stock < 10 ? 'badge-warning' : 'badge-success'
                      }`}>
                        {product.quantity_in_stock === 0 ? 'Out of Stock' : 
                         product.quantity_in_stock < 10 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.6rem' }}
                          onClick={() => handleOpenEdit(product)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.4rem 0.6rem' }}
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formErrors.apiError && (
                  <div className="alert alert-danger" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                    {formErrors.apiError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  {formErrors.name && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">SKU / Code (Must be unique)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                  />
                  {formErrors.sku && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{formErrors.sku}</span>}
                </div>

                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-control" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                    {formErrors.price && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{formErrors.price}</span>}
                  </div>
                  <div>
                    <label className="form-label">Stock Quantity</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-control" 
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                    {formErrors.quantity && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{formErrors.quantity}</span>}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Create Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
