import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { electionAPI, voteAPI } from '../api';
import { Vote, Clock, CheckCircle, BarChart2, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const [elections, setElections] = useState([]);
  const [voteStatuses, setVoteStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const fullName = localStorage.getItem('fullName') || 'Voter';

  useEffect(() => {
    electionAPI.getMyElections()
      .then(async res => {
        const myElections = res.data.map(e => e.election);
        setElections(myElections);
        const statuses = {};
        for (const el of myElections) {
          try {
            const s = await voteAPI.getStatus(el.id);
            statuses[el.id] = s.data.hasVoted;
          } catch {}
        }
        setVoteStatuses(statuses);
      })
      .catch(() => electionAPI.getActive().then(r => setElections(r.data)))
      .finally(() => setLoading(false));
  }, []);

  const active = elections.filter(e => e.status === 'ACTIVE');
  const voted = Object.values(voteStatuses).filter(Boolean).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Welcome, {fullName.split(' ')[0]}</h1>
        <p className="text-muted">Your blockchain voting portal</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Active Elections', value: active.length, icon: Vote, color: 'var(--accent)' },
          { label: 'Votes Cast', value: voted, icon: CheckCircle, color: 'var(--accent2)' },
          { label: 'Total Assigned', value: elections.length, icon: BarChart2, color: '#aa88ff' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div className="card" key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Elections */}
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Your Elections</h2>
      {loading ? (
        <p className="text-muted pulse">Loading elections...</p>
      ) : elections.length === 0 ? (
        <div className="card text-center" style={{ padding: 48 }}>
          <Vote size={40} color="var(--text3)" style={{ marginBottom: 12 }} />
          <p className="text-muted">No elections assigned yet.</p>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>Contact an admin to be assigned to an election.</p>
        </div>
      ) : (
        <div className="grid-2">
          {elections.map(el => {
            const hasVoted = voteStatuses[el.id];
            const isActive = el.status === 'ACTIVE';
            return (
              <div className="card" key={el.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 16, flex: 1 }}>{el.title}</h3>
                  <span className={`badge ${isActive ? 'badge-green' : el.status === 'ENDED' ? 'badge-gray' : 'badge-blue'}`}>
                    {el.status}
                  </span>
                </div>
                {el.description && <p style={{ fontSize: 12, color: 'var(--text2)' }}>{el.description}</p>}
                {hasVoted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)' }}>
                    <CheckCircle size={13} /> Vote recorded on blockchain
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  {isActive && !hasVoted && (
                    <Link to={`/vote/${el.id}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      <Vote size={14} /> Cast Vote
                    </Link>
                  )}
                  <Link to={`/results/${el.id}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    <BarChart2 size={14} /> Results
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
