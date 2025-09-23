// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// interface Agent {
//   _id: string;
//   name: string;
//   email: string;
//   phone?: string;
//   isApproved: boolean;
//   declined: boolean;
// }

// export default function AdminAgentsPage() {
//   const [agents, setAgents] = useState<Agent[]>([]);
//   const [aName, setAName] = useState('');
//   const [aEmail, setAEmail] = useState('');
//   const [aPhone, setAPhone] = useState('');
//   const [aPassword, setAPassword] = useState('');

//   const token = typeof window !== 'undefined' ? localStorage.getItem('clinicToken') : null;

//   // Fetch agents
//   async function loadAgents() {
//     const { data } = await axios.get('/api/lead-ms/get-agents', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     if (data.success) setAgents(data.agents);
//   }

//   useEffect(() => {
//     loadAgents();
//   }, []);

//   async function createAgent(e: React.FormEvent) {
//     e.preventDefault();
//     const { data } = await axios.post('/api/lead-ms/create-agent', {
//       name: aName, email: aEmail, phone: aPhone, password: aPassword
//     }, { headers: { Authorization: `Bearer ${token}` } });
//     if (data?.success) {
//       alert('Agent created');
//       loadAgents();
//       setAName(''); setAEmail(''); setAPhone(''); setAPassword('');
//     } else {
//       alert(data?.message || 'Failed');
//     }
//   }

//   async function handleAction(agentId: string, action: 'approve' | 'decline') {
//     const { data } = await axios.patch('/api/lead-ms/get-agents',
//       { agentId, action },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     if (data.success) {
//       setAgents(prev => prev.map(a => a._id === agentId ? data.agent : a));
//     }
//   }

//   return (
//     <div style={{ padding: 24 }}>
//       <h2>Lead Admin — Manage Agents</h2>

//       {/* Create Agent Form */}
//       <form onSubmit={createAgent} style={{ marginBottom: 24, border: '1px solid #ddd', padding: 16, borderRadius: 12 }}>
//         <h3>Create Agent</h3>
//         <input placeholder="Name" value={aName} onChange={e => setAName(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
//         <input placeholder="Email" value={aEmail} onChange={e => setAEmail(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
//         <input placeholder="Phone" value={aPhone} onChange={e => setAPhone(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
//         <input placeholder="Password" type="password" value={aPassword} onChange={e => setAPassword(e.target.value)} style={{ width: '100%', marginBottom: 12 }} />
//         <button type="submit">Create Agent</button>
//       </form>

//       {/* Agents List */}
//       <h3>Agents</h3>
//       <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
//         <thead>
//           <tr>
//             <th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {agents.map(agent => (
//             <tr key={agent._id}>
//               <td>{agent.name}</td>
//               <td>{agent.email}</td>
//               <td>{agent.phone}</td>
//               <td>
//                 {agent.declined ? 'Declined' : agent.isApproved ? 'Approved' : 'Pending'}
//               </td>
//               <td>
//                 <button onClick={() => handleAction(agent._id, 'approve')} disabled={agent.isApproved}>Approve</button>
//                 <button onClick={() => handleAction(agent._id, 'decline')} disabled={agent.declined}>Decline</button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
