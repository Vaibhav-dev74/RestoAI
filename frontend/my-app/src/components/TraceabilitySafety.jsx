import React, { useState } from 'react';

// Simple hash function for demo
function simpleHash(str) {
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

// Simple AI anomaly detection
function detectAnomalies(batches) {
  const now = new Date();
  const seen = new Set();
  return batches.map(batch => {
    let issues = [];
    if (new Date(batch.expiry) < now) issues.push('Expired');
    if (seen.has(batch.batchId)) issues.push('Duplicate Batch ID');
    seen.add(batch.batchId);
    if (batch.name.toLowerCase().includes('suspicious')) issues.push('Suspicious Ingredient');
    return { ...batch, issues };
  });
}

export default function TraceabilitySafety({ restaurantId }) {
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ name: '', batchId: '', expiry: '' });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddBatch = e => {
    e.preventDefault();
    if (!form.name || !form.batchId || !form.expiry) return;
    const newBatch = {
      ...form,
      hash: simpleHash(form.name + form.batchId + form.expiry + Date.now())
    };
    setBatches([...batches, newBatch]);
    setForm({ name: '', batchId: '', expiry: '' });
  };

  const flaggedBatches = detectAnomalies(batches).filter(b => b.issues.length > 0);
  const allBatches = detectAnomalies(batches);

  return (
    <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6' }}>
      <h2>🔗 Blockchain-Based Food Traceability & Safety</h2>
      <p>Track ingredient batches on a simulated blockchain and view AI-powered safety alerts.</p>
      <p><b>Restaurant ID:</b> {restaurantId}</p>
      <form onSubmit={handleAddBatch} style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Ingredient Name" required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <input name="batchId" value={form.batchId} onChange={handleChange} placeholder="Batch ID" required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <input name="expiry" value={form.expiry} onChange={handleChange} type="date" required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <button type="submit" style={{ padding: '8px 16px', borderRadius: 6, background: '#343a40', color: 'white', border: 'none', cursor: 'pointer' }}>Add Batch</button>
      </form>
      {flaggedBatches.length > 0 && (
        <div style={{ marginBottom: 16, background: '#fff3cd', color: '#856404', padding: 12, borderRadius: 6, border: '1px solid #ffeeba' }}>
          <b>AI Safety Alerts:</b>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {flaggedBatches.map((b, i) => (
              <li key={i}>
                Batch <b>{b.batchId}</b> ({b.name}): {b.issues.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: 8, border: '1px solid #dee2e6' }}>Ingredient</th>
              <th style={{ padding: 8, border: '1px solid #dee2e6' }}>Batch ID</th>
              <th style={{ padding: 8, border: '1px solid #dee2e6' }}>Expiry</th>
              <th style={{ padding: 8, border: '1px solid #dee2e6' }}>Blockchain Hash</th>
              <th style={{ padding: 8, border: '1px solid #dee2e6' }}>AI Issues</th>
            </tr>
          </thead>
          <tbody>
            {allBatches.map((b, i) => (
              <tr key={i} style={b.issues.length > 0 ? { background: '#fff3cd' } : {}}>
                <td style={{ padding: 8, border: '1px solid #dee2e6' }}>{b.name}</td>
                <td style={{ padding: 8, border: '1px solid #dee2e6' }}>{b.batchId}</td>
                <td style={{ padding: 8, border: '1px solid #dee2e6' }}>{b.expiry}</td>
                <td style={{ padding: 8, border: '1px solid #dee2e6', fontFamily: 'monospace', fontSize: 13 }}>{b.hash}</td>
                <td style={{ padding: 8, border: '1px solid #dee2e6', color: b.issues.length > 0 ? '#856404' : '#28a745' }}>
                  {b.issues.length > 0 ? b.issues.join(', ') : 'None'}
                </td>
              </tr>
            ))}
            {allBatches.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16, color: '#aaa' }}>No batches added yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 