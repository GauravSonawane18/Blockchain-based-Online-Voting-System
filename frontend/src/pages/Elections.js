import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { electionAPI } from '../api';
import { Vote, BarChart2, Calendar } from 'lucide-react';

export default function Elections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    electionAPI.getAll().then(r => setElections(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? elections : elections.filter(e => e.status === filter);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Elections</h1>
        <p className="text-muted">All elections on the platform</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['ALL', 'ACTIVE', 'PENDING', 'ENDED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 14px', fontSize: 11 }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <p className="text-muted pulse">Loading...</p> : (
        <div className="grid-2">
          {filtered.map(el => (
            <div className="card" key={el.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: 16 }}>{el.title}</h3>
                <span className={`badge ${el.status === 'ACTIVE' ? 'badge-green' : el.status === 'ENDED' ? 'badge-gray' : 'badge-blue'}`}>{el.status}</span>
              </div>
              {el.description && <p style={{ fontSize: 12, color: 'var(--text2)' }}>{el.description}</p>}
              {el.startTime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
                  <Calendar size={11} />
                  {new Date(el.startTime).toLocaleDateString()} – {new Date(el.endTime).toLocaleDateString()}
                </div>
              )}
              <Link to={`/results/${el.id}`} className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                <BarChart2 size={14} /> View Results
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
