import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { electionAPI, candidateAPI, voteAPI } from '../api';
import { Calendar, BarChart2 } from 'lucide-react';

export default function Elections() {
  const [elections, setElections] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [myElectionIds, setMyElectionIds] = useState(new Set());
  const [votedMap, setVotedMap] = useState({});
  const [candidateCounts, setCandidateCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await electionAPI.getAll();
        const all = res.data || [];
        setElections(all);

        // Only fetch voter-specific data for non-admins
        if (!isAdmin) {
          try {
            const myRes = await electionAPI.getMyElections();
            const assigned = (myRes.data || []).map(e => (e.election || e).id);
            setMyElectionIds(new Set(assigned));

            // Check voted status for each active election
            const voted = {};
            for (const el of all) {
              if (el.status === 'ACTIVE') {
                try {
                  const r = await voteAPI.hasVoted(el.id);
                  voted[el.id] = r.data?.hasVoted || false;
                } catch { voted[el.id] = false; }
              }
            }
            setVotedMap(voted);
          } catch {}
        }

        // Get candidate counts for all elections
        const counts = {};
        for (const el of all) {
          try {
            const r = await candidateAPI.getByElection(el.id);
            counts[el.id] = (r.data || []).length;
          } catch { counts[el.id] = 0; }
        }
        setCandidateCounts(counts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const filtered = elections.filter(e => filter === 'ALL' || e.status === filter);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Elections</h1>
        <p className="text-muted">All elections on the platform</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['ALL', 'ACTIVE', 'PENDING', 'ENDED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 16px', fontSize: 13 }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">Loading elections...</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p className="text-muted">No {filter !== 'ALL' ? filter.toLowerCase() : ''} elections found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(el => {
            // Admin can NEVER vote — only non-admin voters who are assigned can
            const isAssigned = !isAdmin && myElectionIds.has(el.id);
            const hasVoted   = votedMap[el.id];
            const candCount  = candidateCounts[el.id] || 0;

            return (
              <div className="card" key={el.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 15, flex: 1, marginRight: 8 }}>{el.title}</h3>
                  <span className={`badge ${
                    el.status === 'ACTIVE' ? 'badge-green' :
                    el.status === 'ENDED'  ? 'badge-gray'  : 'badge-blue'
                  }`}>
                    {el.status}
                  </span>
                </div>

                {el.description && (
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>{el.description}</p>
                )}

                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    {el.startTime ? new Date(el.startTime).toLocaleDateString() : '—'}
                    {' – '}
                    {el.endTime   ? new Date(el.endTime).toLocaleDateString()   : '—'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BarChart2 size={12} />
                    {candCount} candidate{candCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* ── Action buttons ── */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>

                  {/* VOTER: assigned, active, not voted yet → Cast Vote */}
                  {el.status === 'ACTIVE' && isAssigned && !hasVoted && (
                    <Link
                      to={`/vote/${el.id}`}
                      className="btn btn-primary"
                      style={{ flex: 1, textAlign: 'center', padding: '8px 12px', fontSize: 13 }}
                    >
                      🗳 Cast Your Vote
                    </Link>
                  )}

                  {/* VOTER: assigned, active, already voted */}
                  {el.status === 'ACTIVE' && isAssigned && hasVoted && (
                    <span style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ✓ Already Voted
                    </span>
                  )}

                  {/* VOTER: active but NOT assigned */}
                  {el.status === 'ACTIVE' && !isAdmin && !isAssigned && (
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                      Not assigned to this election
                    </span>
                  )}

                  {/* ADMIN: read-only label on active elections */}
                  {el.status === 'ACTIVE' && isAdmin && (
                    <span style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>
                      Admin view — voting not allowed
                    </span>
                  )}

                  {/* View Results — available to everyone for ACTIVE and ENDED */}
                  {(el.status === 'ACTIVE' || el.status === 'ENDED') && (
                    <Link
                      to={`/results/${el.id}`}
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: 13 }}
                    >
                      <BarChart2 size={13} /> View Results
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}