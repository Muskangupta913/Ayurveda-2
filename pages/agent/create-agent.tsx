import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AgentLayout from "../../components/AgentLayout"; // ✅ agent layout
import withAgentAuth from "../../components/withAgentAuth"; // ✅ agent auth
import type { NextPageWithLayout } from '../_app';

interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isApproved: boolean;
  declined: boolean;
}

const ManageAgentsPage: NextPageWithLayout = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [aName, setAName] = useState('');
  const [aEmail, setAEmail] = useState('');
  const [aPhone, setAPhone] = useState('');
  const [aPassword, setAPassword] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;

  async function loadAgents() {
    try {
      const { data } = await axios.get('/api/lead-ms/get-agents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setAgents(data.agents);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { loadAgents(); }, []);

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/lead-ms/create-agent', {
        name: aName, email: aEmail, phone: aPhone, password: aPassword
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (data?.success) {
        loadAgents();
        setAName(''); setAEmail(''); setAPhone(''); setAPassword('');
      } else {
        alert(data?.message || 'Failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create agent');
    }
  }

  async function handleAction(agentId: string, action: 'approve' | 'decline') {
    try {
      const { data } = await axios.patch('/api/lead-ms/get-agents', { agentId, action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setAgents(prev => prev.map(a => a._id === agentId ? data.agent : a));
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Lead Admin — Manage Agents</h2>

      {/* Full-width form card */}
      <form onSubmit={createAgent} className="w-full bg-white p-8 rounded-2xl shadow-lg mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-gray-700">Create New Agent</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input
            placeholder="Name" value={aName} onChange={e => setAName(e.target.value)}
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <input
            placeholder="Email" value={aEmail} onChange={e => setAEmail(e.target.value)}
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <input
            placeholder="Phone" value={aPhone} onChange={e => setAPhone(e.target.value)}
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <input
            placeholder="Password" type="password" value={aPassword} onChange={e => setAPassword(e.target.value)}
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="mt-6 w-full md:w-auto bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-xl transition duration-200"
        >
          Create Agent
        </button>
      </form>

      {/* Full-width table card */}
      <div className="w-full bg-white rounded-2xl shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-teal-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agents.map(agent => (
              <tr key={agent._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{agent.name}</td>
                <td className="px-6 py-4">{agent.email}</td>
                <td className="px-6 py-4">{agent.phone || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${
                    agent.declined ? 'bg-red-500' : agent.isApproved ? 'bg-green-500' : 'bg-yellow-500'
                  }`}>
                    {agent.declined ? 'Declined' : agent.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => handleAction(agent._id, 'approve')}
                    disabled={agent.isApproved}
                    className={`px-3 py-1 rounded-lg text-white font-semibold ${
                      agent.isApproved ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(agent._id, 'decline')}
                    disabled={agent.declined}
                    className={`px-3 py-1 rounded-lg text-white font-semibold ${
                      agent.declined ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    Decline
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// Wrap page in AgentLayout
ManageAgentsPage.getLayout = (page: React.ReactNode) => <AgentLayout>{page}</AgentLayout>;

// Protect page
const ProtectedManageAgents: NextPageWithLayout = withAgentAuth(ManageAgentsPage as any);
ProtectedManageAgents.getLayout = ManageAgentsPage.getLayout;

export default ProtectedManageAgents;
