import React, { useState } from 'react';
import axios from 'axios';
import '../styles/BillScanModal.css';

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Utilities', 'Other'];

const BillScanModal = ({ isOpen, onClose, onExpenseAdded }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Extracted/Editable fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState('');
  const [hasScanned, setHasScanned] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setErrorMessage('');
      setSuccessNotice('');
      setHasScanned(false);
    }
  };

  const handleScanBill = async () => {
    if (!file) {
      setErrorMessage('Please select or capture a bill image first.');
      return;
    }

    setAnalyzing(true);
    setErrorMessage('');
    setSuccessNotice('');

    const formData = new FormData();
    formData.append('bill', file);

    try {
      const res = await axios.post('http://localhost:5000/api/expenses/scan-bill', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      const data = res.data.expense;
      setTitle(data.title || '');
      setAmount(data.amount ? data.amount.toString() : '');
      setCategory(CATEGORIES.includes(data.category) ? data.category : 'Other');
      setDate(data.date || new Date().toISOString().split('T')[0]);
      setHasScanned(true);
      setSuccessNotice('✨ AI successfully extracted receipt details! Verify below:');
    } catch (err) {
      console.error('AI Scan Error:', err);
      const serverMsg = err.response?.data?.message || err.message;
      setErrorMessage(serverMsg || 'Failed to scan bill. Please check your Gemini API key in backend .env.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount || !date) {
      setErrorMessage('Please fill in Title, Amount, and Date.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const res = await axios.post(
        'http://localhost:5000/api/expenses',
        {
          title,
          amount: parseFloat(amount),
          category,
          date,
        },
        { withCredentials: true }
      );

      if (onExpenseAdded && res.data.newExpense) {
        onExpenseAdded(res.data.newExpense);
      }
      handleClose();
    } catch (err) {
      console.error('Error saving expense:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewUrl('');
    setTitle('');
    setAmount('');
    setCategory('Food');
    setDate('');
    setHasScanned(false);
    setErrorMessage('');
    setSuccessNotice('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge">✨ Gen AI Powered</span>
            <h2>Scan Bill / Receipt</h2>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>&times;</button>
        </div>

        {errorMessage && (
          <div className="alert-box error-alert">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="alert-box success-alert">
            <span>{successNotice}</span>
          </div>
        )}

        <div className="scan-layout">
          {/* File Upload & Preview Section */}
          <div className="upload-preview-panel">
            <label className="file-dropzone">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={analyzing}
              />
              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="Receipt preview" className="receipt-preview-img" />
                  <span className="change-img-text">Click or drag to change receipt</span>
                </div>
              ) : (
                <div className="dropzone-placeholder">
                  <div className="dropzone-icon">🧾</div>
                  <p><strong>Click to upload</strong> or drag & drop</p>
                  <span>Supports PNG, JPG, WEBP receipt photos</span>
                </div>
              )}
            </label>

            <button
              type="button"
              className="scan-action-btn"
              onClick={handleScanBill}
              disabled={!file || analyzing}
            >
              {analyzing ? (
                <>
                  <span className="scan-spinner"></span>
                  Gemini Vision Analyzing...
                </>
              ) : (
                '🔍 Analyze with Gemini AI'
              )}
            </button>
          </div>

          {/* Verification & Save Form */}
          <div className="details-panel">
            <h3>Receipt Details {hasScanned && <span className="verified-pill">AI Extracted</span>}</h3>
            <form onSubmit={handleSaveExpense}>
              <div className="form-group">
                <label>Merchant / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Starbucks, Grocery Store"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Total Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving || analyzing}
                >
                  {saving ? 'Saving...' : '💾 Save to Expenses'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillScanModal;
