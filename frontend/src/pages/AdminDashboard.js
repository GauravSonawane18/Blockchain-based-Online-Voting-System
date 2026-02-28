import React, { useState, useEffect } from 'react';
import { adminAPI, electionAPI, auditAPI } from '../api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Plus, Users, Vote, Activity, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminDashboard() {
  const [tab, setTab] = useState('voters');
  const [pending, setPending] = useState([]);
  const [elections, setElections] = useState([]);
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [showCreateElection, setShowCreateElection] = useState(false);
  const [newElection, setNewElection] = useState({ title: '', description: '', startTime: '', endTime: '' });
  const [assignForm, setAssignForm] = useState({ voterId: '', electionId: '' });
  const [loading, setLoading] = useState({});
  const [rejectReason, setRejectReason] = useState({});

  useEffect(() => {
    adminAPI.getPending().then(r => setPending(r.data));
    electionAPI.getAll().then(r => setElections(r.data));
    adminAPI.getStats().then(r => setStats(r.data));
    auditAPI.getLogs().then(r => setLogs(r.data.content || []));
  }, []);

  const approve = async (id) => {
    setLoading(p => ({...p, [id]: true}));
    try {
      await adminAPI.approve(id);
      setPending(p => p.filter(v => v.id !== id));
      toast.success('Voter approved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(p => ({...p, [id]: false})); }
  };

  const reject = async (id) => {
    setLoading(p => ({...p, [`r${id}`]: true}));
    try {
      await adminAPI.reject(id, rejectReason[id] || 'Not approved');
      setPending(p => p.filter(v => v.id !== id));
      toast.success('Voter rejected');
    } catch (err) {
      toast.error('Failed');
    } finally { setLoading(p => ({...p, [`r${id}`]: false})); }
  };

  const createElection = async () => {
    try {
      await electionAPI.create(newElection);
      const r = await electionAPI.getAll();
      setElections(r.data);
      setShowCreateElection(false);
      setNewElection({ title: '', description: '', startTime: '', endTime: '' });
      toast.success('Election created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create election');
    }
  };

  const startElection = async (id) => {
    try {
      await electionAPI.start(id);
      const r = await electionAPI.getAll(); setElections(r.data);
      toast.success('Election started on blockchain!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const endElection = async (id) => {
    try {
      await electionAPI.end(id);
      const r = await electionAPI.getAll(); setElections(r.data);
      toast.success('Election ended');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const assignVoter = async () => {
    try {
      await adminAPI.assignVoter(Number(assignForm.voterId), Number(assignForm.electionId));
      toast.success('Voter assigned!');
      setAssignForm({ voterId: '', electionId: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const TABS = [
    { id: 'voters', label: 'Voters', icon: Users },
    { id: 'elections', label: 'Elections', icon: Vote },
    { id: 'logs', label: 'Audit Logs', icon: Activity },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="text-muted">Manage voters, elections, and audit logs</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total Voters', value: stats.totalVoters || 0 },
          { label: 'Pending Approval', value: stats.pendingCount || pending.length },
          { label: 'Total Elections', value: elections.length },
          { label: 'Active Elections', value: elections.filter(e => e.status === 'ACTIVE').length },
        ].map(({ label, value }) => (
          <div className="card" key={label} style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            color: tab === id ? 'var(--accent)' : 'var(--text2)', fontFamily: 'var(--font-mono)',
            fontSize: 13, fontWeight: 700, borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s', marginBottom: -1
          }}>
            <Icon size={14} /> {label}
            {id === 'voters' && pending.length > 0 && <span className="badge badge-red" style={{ padding: '1px 6px', fontSize: 10 }}>{pending.length}</span>}
          </button>
        ))}
      </div>

      {/* Voters Tab */}
      {tab === 'voters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Pending Verification ({pending.length})</h3>
            {pending.length === 0 ? (
              <p className="text-muted text-sm">No pending voters.</p>
            ) : pending.map(v => (
              <div className="card" key={v.id} style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{v.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{v.email}</div>
                    {v.walletAddress && <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', marginTop: 4 }}>{v.walletAddress}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => approve(v.id)} disabled={loading[v.id]} style={{ padding: '6px 14px' }}>
                      <CheckCircle size={13} /> {loading[v.id] ? '...' : 'Approve'}
                    </button>
                    <button className="btn btn-danger" onClick={() => reject(v.id)} disabled={loading[`r${v.id}`]} style={{ padding: '6px 14px' }}>
                      <XCircle size={13} /> {loading[`r${v.id}`] ? '...' : 'Reject'}
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <input placeholder="Rejection reason (optional)" value={rejectReason[v.id] || ''} onChange={e => setRejectReason(p => ({...p, [v.id]: e.target.value}))} style={{ fontSize: 12, padding: '6px 10px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Assign voter */}
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Assign Voter to Election</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <div className="input-group">
                <label>Voter ID</label>
                <input type="number" value={assignForm.voterId} onChange={e => setAssignForm(p => ({...p, voterId: e.target.value}))} placeholder="User ID" />
              </div>
              <div className="input-group">
                <label>Election</label>
                <select value={assignForm.electionId} onChange={e => setAssignForm(p => ({...p, electionId: e.target.value}))}>
                  <option value="">Select election</option>
                  {elections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={assignVoter} disabled={!assignForm.voterId || !assignForm.electionId}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elections Tab */}
      {tab === 'elections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button className="btn btn-primary" onClick={() => setShowCreateElection(!showCreateElection)} style={{ alignSelf: 'flex-start' }}>
            <Plus size={14} /> {showCreateElection ? 'Cancel' : 'Create Election'}
            {showCreateElection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showCreateElection && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 15 }}>New Election</h3>
              <div className="input-group"><label>Title</label><input value={newElection.title} onChange={e => setNewElection(p => ({...p, title: e.target.value}))} placeholder="Student Council Election 2025" /></div>
              <div className="input-group"><label>Description</label><textarea value={newElection.description} onChange={e => setNewElection(p => ({...p, description: e.target.value}))} rows={2} placeholder="Brief description..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group"><label>Start Time</label><input type="datetime-local" value={newElection.startTime} onChange={e => setNewElection(p => ({...p, startTime: e.target.value}))} /></div>
                <div className="input-group"><label>End Time</label><input type="datetime-local" value={newElection.endTime} onChange={e => setNewElection(p => ({...p, endTime: e.target.value}))} /></div>
              </div>
              <button className="btn btn-primary" onClick={createElection} disabled={!newElection.title} style={{ alignSelf: 'flex-start' }}>Create</button>
            </div>
          )}

          {elections.map(el => (
            <div className="card" key={el.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15 }}>{el.title}</h3>
                  {el.description && <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{el.description}</p>}
                  {el.contractAddress && <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', marginTop: 4 }}>Contract: {el.contractAddress}</p>}
                </div>
                <span className={`badge ${el.status === 'ACTIVE' ? 'badge-green' : el.status === 'ENDED' ? 'badge-gray' : 'badge-blue'}`}>{el.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {el.status === 'PENDING' && <button className="btn btn-primary" onClick={() => startElection(el.id)} style={{ padding: '6px 14px' }}>Start Election</button>}
                {el.status === 'ACTIVE' && <button className="btn btn-danger" onClick={() => endElection(el.id)} style={{ padding: '6px 14px' }}>End Election</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Logs Tab */}
      {tab === 'logs' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Timestamp</th><th>Action</th><th>User ID</th><th>TX Hash</th><th>Details</th></tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</td>
                  <td><span className="badge badge-blue">{log.action}</span></td>
                  <td style={{ fontSize: 12 }}>{log.userId || '-'}</td>
                  <td style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent2)' }}>{log.transactionHash ? log.transactionHash.slice(0, 16) + '...' : '-'}</td>
                  <td style={{ fontSize: 11, color: 'var(--text2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p className="text-muted text-sm" style={{ padding: 16 }}>No audit logs yet.</p>}
        </div>
      )}
    </div>
  );
}
