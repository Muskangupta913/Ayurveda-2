import React, { useState } from 'react';
import axios from 'axios';

const CreateAgentModal = ({ isOpen, onClose, onCreated, token, doctorToken, adminToken }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Determine which token to use: priority order is adminToken > doctorToken > token
  const authToken = adminToken || doctorToken || token || null;
  
  if (!authToken) {
    console.error('No authentication token provided');
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        '/api/lead-ms/create-agent',
        { name, email, phone, password },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (data?.success) {
        setName(''); setEmail(''); setPhone(''); setPassword('');
        onCreated?.();
        onClose?.();
      } else {
        alert(data?.message || 'Failed to create agent');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900">Create agent</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100" aria-label="Close">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Full name <span className="text-red-500">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" required className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email address <span className="text-red-500">*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@example.com" required className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Phone number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-sm rounded-md">{submitting ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAgentModal;


