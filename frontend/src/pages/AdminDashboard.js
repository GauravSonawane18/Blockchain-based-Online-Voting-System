import React, { useState, useEffect } from 'react';
import { adminAPI, electionAPI, candidateAPI, auditAPI } from '../api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Plus, Users, Vote, Activity, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';

export default function AdminDashboard() {
  const [tab, setTab] = useState('voters');
  const [pending, setPending] = useState([]);
  const [elections, setElections] = useState([]);
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [showCreateElection, setShowCreateElection] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(null); // electionId
  const [newElection, setNewElection] = useState({ title: '', description: '', startTime: '', endTime: '' });
  const [newCandidate, setNewCandidate] = useState({ name: '', party: '', description: '' });
  const [assignForm, setAssignForm] = useState({ voterId: '', electionId: '' });
  const [loading, setLoading] = useState({});
  const [rejectReason, setRejectReason] = useState({});

  useEffect(() => {
    adminAPI.getPending().then(r => setPending(r.data)).catch(() => {});
    electionAPI.getAll().then(r => setElections(r.data)).catch(() => {});
    adminAPI.getStats().then(r => setStats(r.data)).catch(() => {});
    auditAPI.getLogs().then(r => setLogs(r.data.content || [])).catch(() => {});
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
    if (!newElection.title.trim()) return toast.error('Title is required');
    if (!newElection.startTime) return toast.error('Start time is required');
    if (!newElection.endTime) return toast.error('End time is required');

    try {
      // Convert datetime-local format "2026-03-01T10:30" to ISO "2026-03-01T10:30:00"
      const payload = {
        title: newElection.title.trim(),
        description: newElection.description.trim(),
        startTime: newElection.startTime.length === 16
          ? newElection.startTime + ':00'
          : newElection.startTime,
        endTime: newElection.endTime.length === 16
          ? newElection.endTime + ':00'
          : newElection.endTime,
      };
      await electionAPI.create(payload);
      const r = await electionAPI.getAll();
      setElections(r.data);
      setShowCreateElection(false);
      setNewElection({ title: '', description: '', startTime: '', endTime: '' });
      toast.success('Election created!');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create election';
      toast.error(msg, { duration: 6000 });
      console.error('Create election error:', err.response?.data);
    }
  };

  const startElection = async (id) => {
    setLoading(p => ({...p, [`start${id}`]: true}));
    try {
      await electionAPI.start(id);
      const r = await electionAPI.getAll(); setElections(r.data);
      toast.success('Election started on blockchain!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start');
    } finally { setLoading(p => ({...p, [`start${id}`]: false})); }
  };

  const endElection = async (id) => {
    setLoading(p => ({...p, [`end${id}`]: true}));
    try {
      await electionAPI.end(id);
      const r = await electionAPI.getAll(); setElections(r.data);
      toast.success('Election ended');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end');
    } finally { setLoading(p => ({...p, [`end${id}`]: false})); }
  };

  const addCandidate = async (electionId) => {
    if (!newCandidate.name.trim()) return toast.error('Candidate name is required');
    try {
      await candidateAPI.add({ ...newCandidate, electionId });
      setNewCandidate({ name: '', party: '', description: '' });
      setShowAddCandidate(null);
      toast.success('Candidate added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add candidate');
    }
  };

  const assignVoter = async () => {
    if (!assignForm.voterId || !assignForm.electionId) return toast.error('Fill both fields');
    try {
      await adminAPI.assignVoter(Number(assignForm.voterId), Number(assignForm.electionId));
      toast.success('Voter assigned to election!');
      setAssignForm({ voterId: '', electionId: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign');
    }
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
          { label: 'Total Voters', value: stats.totalVoters ?? 0 },
          { label: 'Pending Approval', value: stats.pendingCount ?? pending.length },
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
            fontSize: 13, fontWeight: 700,
            borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s', marginBottom: -1
          }}>
            <Icon size={14} /> {label}
            {id === 'voters' && pending.length > 0 && (
              <span className="badge badge-red" style={{ padding: '1px 6px', fontSize: 10 }}>{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── VOTERS TAB ── */}
      {tab === 'voters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Pending voters */}
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Pending Verification ({pending.length})</h3>
            {pending.length === 0 ? (
              <p className="text-muted text-sm">No pending voters.</p>
            ) : pending.map(v => (
              <div className="card" key={v.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{v.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{v.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>ID: {v.id}</div>
                    {v.walletAddress && (
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', marginTop: 2 }}>{v.walletAddress}</div>
                    )}
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
                  <input placeholder="Rejection reason (optional)"
                    value={rejectReason[v.id] || ''}
                    onChange={e => setRejectReason(p => ({...p, [v.id]: e.target.value}))}
                    style={{ fontSize: 12, padding: '6px 10px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Assign voter to election */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <UserPlus size={16} color="var(--accent2)" />
              <h3 style={{ fontSize: 15 }}>Assign Voter to Election</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
              Enter the voter's User ID (visible above in pending list, or check pgAdmin).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <div className="input-group">
                <label>Voter User ID</label>
                <input type="number" value={assignForm.voterId}
                  onChange={e => setAssignForm(p => ({...p, voterId: e.target.value}))}
                  placeholder="e.g. 2" />
              </div>
              <div className="input-group">
                <label>Election</label>
                <select value={assignForm.electionId}
                  onChange={e => setAssignForm(p => ({...p, electionId: e.target.value}))}>
                  <option value="">Select election</option>
                  {elections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={assignVoter}
                disabled={!assignForm.voterId || !assignForm.electionId}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ELECTIONS TAB ── */}
      {tab === 'elections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <button className="btn btn-primary" onClick={() => setShowCreateElection(!showCreateElection)}
            style={{ alignSelf: 'flex-start' }}>
            <Plus size={14} />
            {showCreateElection ? 'Cancel' : 'Create New Election'}
            {showCreateElection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showCreateElection && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontSize: 15 }}>New Election</h3>
              <div className="input-group">
                <label>Title *</label>
                <input value={newElection.title}
                  onChange={e => setNewElection(p => ({...p, title: e.target.value}))}
                  placeholder="e.g. Student Council Election 2026" />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea value={newElection.description}
                  onChange={e => setNewElection(p => ({...p, description: e.target.value}))}
                  rows={2} placeholder="Brief description..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label>Start Time *</label>
                  <input type="datetime-local" value={newElection.startTime}
                    onChange={e => setNewElection(p => ({...p, startTime: e.target.value}))} />
                </div>
                <div className="input-group">
                  <label>End Time *</label>
                  <input type="datetime-local" value={newElection.endTime}
                    onChange={e => setNewElection(p => ({...p, endTime: e.target.value}))} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={createElection}
                disabled={!newElection.title.trim() || !newElection.startTime || !newElection.endTime}
                style={{ alignSelf: 'flex-start' }}>
                <Plus size={14} /> Create Election
              </button>
            </div>
          )}

          {/* Election list */}
          {elections.length === 0 && !showCreateElection && (
            <p className="text-muted text-sm">No elections yet. Create one above.</p>
          )}

          {elections.map(el => (
            <div className="card" key={el.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 15 }}>{el.title}</h3>
                    <span className={`badge ${el.status === 'ACTIVE' ? 'badge-green' : el.status === 'ENDED' ? 'badge-gray' : 'badge-blue'}`}>
                      {el.status}
                    </span>
                  </div>
                  {el.description && <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{el.description}</p>}
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    ID: {el.id}
                    {el.startTime && ` · ${new Date(el.startTime).toLocaleString()} → ${new Date(el.endTime).toLocaleString()}`}
                  </div>
                  {el.contractAddress && (
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent2)', marginTop: 4 }}>
                      Contract: {el.contractAddress}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {el.status === 'PENDING' && (
                  <button className="btn btn-primary" onClick={() => startElection(el.id)}
                    disabled={loading[`start${el.id}`]} style={{ padding: '6px 14px' }}>
                    {loading[`start${el.id}`] ? 'Starting...' : '▶ Start Election'}
                  </button>
                )}
                {el.status === 'ACTIVE' && (
                  <button className="btn btn-danger" onClick={() => endElection(el.id)}
                    disabled={loading[`end${el.id}`]} style={{ padding: '6px 14px' }}>
                    {loading[`end${el.id}`] ? 'Ending...' : '■ End Election'}
                  </button>
                )}
                {el.status === 'PENDING' && (
                  <button className="btn btn-secondary"
                    onClick={() => setShowAddCandidate(showAddCandidate === el.id ? null : el.id)}
                    style={{ padding: '6px 14px' }}>
                    <Plus size={13} /> Add Candidate
                  </button>
                )}
              </div>

              {/* Add candidate inline */}
              {showAddCandidate === el.id && (
                <div style={{ marginTop: 14, padding: 14, background: 'var(--bg3)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>Add Candidate to "{el.title}"</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="input-group">
                      <label>Name *</label>
                      <input value={newCandidate.name}
                        onChange={e => setNewCandidate(p => ({...p, name: e.target.value}))}
                        placeholder="Candidate full name" />
                    </div>
                    <div className="input-group">
                      <label>Party / Department</label>
                      <input value={newCandidate.party}
                        onChange={e => setNewCandidate(p => ({...p, party: e.target.value}))}
                        placeholder="e.g. Computer Science Dept" />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Bio / Description</label>
                    <input value={newCandidate.description}
                      onChange={e => setNewCandidate(p => ({...p, description: e.target.value}))}
                      placeholder="Short bio..." />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => addCandidate(el.id)}
                      disabled={!newCandidate.name.trim()} style={{ padding: '6px 14px' }}>
                      <Plus size={13} /> Add
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowAddCandidate(null)}
                      style={{ padding: '6px 14px' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── AUDIT LOGS TAB ── */}
      {tab === 'logs' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>User ID</th>
                <th>TX Hash</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                  </td>
                  <td><span className="badge badge-blue">{log.action}</span></td>
                  <td style={{ fontSize: 12 }}>{log.userId || '-'}</td>
                  <td style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent2)' }}>
                    {log.transactionHash ? log.transactionHash.slice(0, 16) + '...' : '-'}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text2)', maxWidth: 220,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="text-muted text-sm" style={{ padding: 16 }}>No audit logs yet.</p>
          )}
        </div>
      )}
    </div>
  );
}