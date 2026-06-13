import React, { useState, useEffect } from 'react';
import { api } from '../App';
import { 
  Plus, 
  Trash2, 
  Search, 
  X,
  UserCheck
} from 'lucide-react';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal control
  const [showModal, setShowModal] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Validation errors
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve customers list.');
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
    setFullName('');
    setEmail('');
    setPhone('');
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid';
    }
    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      full_name: fullName,
      email: email,
      phone_number: phone
    };

    try {
      await api.post('/customers', payload);
      setSuccessMsg(`Customer '${fullName}' added successfully!`);
      setShowModal(false);
      fetchCustomers();
      clearNotification();
    } catch (err) {
      console.error(err);
      const apiErr = err.response?.data?.detail || 'An error occurred during submission.';
      setFormErrors({ apiError: apiErr });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove customer '${name}'? All related orders will also be deleted.`)) return;
    try {
      await api.delete(`/customers/${id}`);
      setSuccessMsg(`Customer '${name}' removed successfully!`);
      fetchCustomers();
      clearNotification();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to remove customer.');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Client side filtering
  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="header-container">
        <div className="header-title">
          <h1>Customer Management</h1>
          <p>Register new customers and view directories</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="alert alert-success">
          <UserCheck size={20} />
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
            placeholder="Search by name or email..." 
            className="form-control" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {searchTerm ? 'No customers match your search.' : 'No customers registered yet.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 600 }}>{customer.full_name}</td>
                    <td><a href={`mailto:${customer.email}`}>{customer.email}</a></td>
                    <td>{customer.phone_number}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '0.4rem 0.6rem' }}
                        onClick={() => handleDelete(customer.id, customer.full_name)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Customer</h3>
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
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  {formErrors.fullName && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{formErrors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Must be unique)</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {formErrors.email && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{formErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  {formErrors.phone && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{formErrors.phone}</span>}
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
