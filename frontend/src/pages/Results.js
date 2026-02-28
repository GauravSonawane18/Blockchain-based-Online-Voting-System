import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { resultAPI } from '../api';
import { Trophy, Users } from 'lucide-react';

export default function Results() {
  const { electionId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resultAPI.getResults(electionId).then(r => setResults(r.data)).finally(() => setLoading(false));
  }, [electionId]);

  if (loading) return <p className="text-muted pulse">Loading results from blockchain...</p>;
  if (!results) return <p className="text-muted">No results available.</p>;

  const winner = results.candidates?.reduce((a, b) => a.voteCount > b.voteCount ? a : b, {});
  const sorted = [...(results.candidates || [])].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>{results.electionTitle}</h1>
        <p className="text-muted">
          <span className={`badge ${results.status === 'ACTIVE' ? 'badge-green' : results.status === 'ENDED' ? 'badge-gray' : 'badge-blue'}`}>{results.status}</span>
          &nbsp;&nbsp;{results.totalVotes} total votes
        </p>
      </div>

      {results.status === 'ENDED' && winner.name && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(255,200,0,0.3)', background: 'rgba(255,200,0,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,200,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trophy size={24} color="#ffc800" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#ffc800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Winner</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{winner.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{winner.voteCount} votes ({winner.percentage}%)</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map((c, i) => (
          <div className="card" key={c.candidateId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? 'rgba(255,200,0,0.2)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? '#ffc800' : 'var(--text2)' }}>{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  {c.party && <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.party}</div>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-display)' }}>{c.voteCount}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.percentage}%</div>
              </div>
            </div>
            <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${c.percentage}%`, background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--accent2)' : 'var(--text3)', borderRadius: 3, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {results.totalVotes === 0 && (
        <div className="card text-center" style={{ marginTop: 16, padding: 40 }}>
          <Users size={36} color="var(--text3)" style={{ marginBottom: 12 }} />
          <p className="text-muted">No votes have been cast yet.</p>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Results are read directly from the blockchain.</p>
        </div>
      )}
    </div>
  );
}
