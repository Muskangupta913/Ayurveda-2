// /pages/admin/agents.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Agent { _id: string; name: string; email: string; }
interface Lead { _id: string; name: string; email?: string; phone?: string; assignedTo?: Agent; }

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // create agent form
  const [aName, setAName] = useState('');
  const [aEmail, setAEmail] = useState('');
  const [aPhone, setAPhone] = useState('');
  const [aPassword, setAPassword] = useState('');

  // create lead form
  const [lName, setLName] = useState('');
  const [lEmail, setLEmail] = useState('');
  const [lPhone, setLPhone] = useState('');
  const [lSource, setLSource] = useState('other');

  const token = typeof window !== 'undefined' ? localStorage.getItem('leadToken') : null;

  async function loadData() {
    // load all agents (simple approach: get all users by role via /api/leads/all?assigned=false and track agents separately)
    // For brevity, we’ll infer agents from leads assignment plus newly created agents.
    // In a production app, add /api/agents/list.
    const allLeads = await axios.get('/api/leads/all', { headers: { Authorization: `Bearer ${token}` } });
    if (allLeads.data?.success) setLeads(allLeads.data.leads);

    // quick-and-dirty agent list: fetch from custom endpoint or maintain state after create.
    // As a placeholder, build unique agents from leads.assignedTo:
    const uniq: Record<string, Agent> = {};
    for (const ld of allLeads.data?.leads || []) {
      if (ld.assignedTo?._id) {
        uniq[ld.assignedTo._id] = { _id: ld.assignedTo._id, name: ld.assignedTo.name, email: ld.assignedTo.email };
      }
    }
    setAgents(Object.values(uniq));
  }

  useEffect(() => { loadData(); /* eslint-disable react-hooks/exhaustive-deps */ }, []);

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await axios.post('/api/lead-ms/create-agent', {
      name: aName, email: aEmail, phone: aPhone, password: aPassword
    }, { headers: { Authorization: `Bearer ${token}` } });
    if (data?.success) {
      alert('Agent created');
      setAgents(prev => [{ _id: data.agent._id, name: data.agent.name, email: data.agent.email }, ...prev]);
      setAName(''); setAEmail(''); setAPhone(''); setAPassword('');
    } else {
      alert(data?.message || 'Failed');
    }
  }

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await axios.post('/api/leads/create', {
      name: lName, email: lEmail, phone: lPhone, source: lSource
    }, { headers: { Authorization: `Bearer ${token}` } });
    if (data?.success) {
      alert('Lead created');
      setLeads(prev => [data.lead, ...prev]);
      setLName(''); setLEmail(''); setLPhone('');
    } else {
      alert(data?.message || 'Failed');
    }
  }

  async function assignLead(leadId: string, agentId: string) {
    const { data } = await axios.post('/api/leads/assign', { leadId, agentId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (data?.success) {
      alert('Lead assigned');
      loadData();
    } else {
      alert(data?.message || 'Assign failed');
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Lead Admin — Manage Agents & Leads</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <form onSubmit={createAgent} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
          <h3>Create Agent</h3>
          <input placeholder="Name" value={aName} onChange={e => setAName(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          <input placeholder="Email" value={aEmail} onChange={e => setAEmail(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          <input placeholder="Phone" value={aPhone} onChange={e => setAPhone(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          <input placeholder="Password" type="password" value={aPassword} onChange={e => setAPassword(e.target.value)} style={{ width: '100%', marginBottom: 12 }} />
          <button type="submit">Create Agent</button>
        </form>

        <form onSubmit={createLead} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
          <h3>Create Lead</h3>
          <input placeholder="Name" value={lName} onChange={e => setLName(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          <input placeholder="Email" value={lEmail} onChange={e => setLEmail(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          <input placeholder="Phone" value={lPhone} onChange={e => setLPhone(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          <select value={lSource} onChange={e => setLSource(e.target.value)} style={{ width: '100%', marginBottom: 12 }}>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </select>
          <button type="submit">Create Lead</button>
        </form>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>All Leads</h3>
        <table border={1} cellPadding={6} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>Assigned To</th><th>Assign</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(ld => (
              <tr key={ld._id}>
                <td>{ld.name}</td>
                <td>{ld.email || '-'}</td>
                <td>{ld.phone || '-'}</td>
                <td>{ld.assignedTo ? `${ld.assignedTo.name} (${ld.assignedTo.email})` : 'Unassigned'}</td>
                <td>
                  <select
                    onChange={(e) => assignLead(ld._id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Select agent</option>
                    {agents.map(a => <option key={a._id} value={a._id}>{a.name} - {a.email}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
